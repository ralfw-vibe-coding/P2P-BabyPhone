import { getStore } from "@netlify/blobs";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const LOCAL_STORE_ROOT = path.join("/tmp", "babyphone-signaling-store");

const ROOM_TTL_MS = 1000 * 60 * 30;
const MESSAGE_TTL_MS = 1000 * 60 * 10;
const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
  "cache-control": "no-store",
  "content-type": "application/json; charset=utf-8",
};

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: CORS_HEADERS,
  });

const createLocalStore = (rootDir) => {
  const toFilePath = (key) => path.join(rootDir, key);
  const normalizeKey = (filePath) => path.relative(rootDir, filePath).replaceAll(path.sep, "/");

  const ensureParentDir = async (filePath) => {
    await mkdir(path.dirname(filePath), { recursive: true });
  };

  const walk = async (dirPath, visitor) => {
    let entries = [];

    try {
      entries = await readdir(dirPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const nextPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        await walk(nextPath, visitor);
        continue;
      }

      await visitor(nextPath);
    }
  };

  return {
    async get(key, options = {}) {
      try {
        const value = await readFile(toFilePath(key), "utf8");
        return options.type === "json" ? JSON.parse(value) : value;
      } catch {
        return null;
      }
    },
    async setJSON(key, value) {
      const filePath = toFilePath(key);
      await ensureParentDir(filePath);
      await writeFile(filePath, JSON.stringify(value), "utf8");
    },
    async delete(key) {
      try {
        await rm(toFilePath(key), { force: true });
      } catch {
        // Ignore missing files in the local fallback store.
      }
    },
    async list({ prefix = "" } = {}) {
      const targetDir = toFilePath(prefix);
      const blobs = [];
      const rootExists = await stat(rootDir).then(() => true).catch(() => false);

      if (!rootExists) {
        return { blobs };
      }

      const prefixStat = await stat(targetDir).catch(() => null);

      if (prefixStat?.isFile()) {
        blobs.push({ key: prefix });
        return { blobs };
      }

      const walkRoot = prefixStat?.isDirectory() ? targetDir : rootDir;
      await walk(walkRoot, async (filePath) => {
        const key = normalizeKey(filePath);
        if (key.startsWith(prefix)) {
          blobs.push({ key });
        }
      });

      return { blobs };
    },
  };
};

const createBlobStore = () =>
  getStore({
    name: "babyphone-signaling",
    consistency: "strong",
  });

let storePromise;

const getSignalStore = async () => {
  if (!storePromise) {
    storePromise = (async () => {
      try {
        const candidate = createBlobStore();
        await candidate.list({ prefix: "__healthcheck__" });
        return candidate;
      } catch (error) {
        console.warn("Falling back to local signaling store:", error instanceof Error ? error.message : error);
        await mkdir(LOCAL_STORE_ROOT, { recursive: true });
        return createLocalStore(LOCAL_STORE_ROOT);
      }
    })();
  }

  return storePromise;
};

const safeRoomId = (value) => String(value || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 24);
const safeDeviceId = (value) => String(value || "").trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);

const participantKey = (roomId, deviceId) => `rooms/${roomId}/participants/${deviceId}.json`;
const messageKeyPrefix = (roomId) => `rooms/${roomId}/messages/`;

const parseJson = async (req) => {
  try {
    return await req.json();
  } catch {
    return {};
  }
};

const listParticipants = async (roomId, now) => {
  const store = await getSignalStore();
  const { blobs } = await store.list({ prefix: `rooms/${roomId}/participants/` });
  const participants = [];

  for (const blob of blobs) {
    const participant = await store.get(blob.key, { type: "json" });
    if (!participant) {
      continue;
    }

    if (now - participant.lastSeenAt > ROOM_TTL_MS) {
      await store.delete(blob.key);
      continue;
    }

    participants.push(participant);
  }

  participants.sort((left, right) => left.role.localeCompare(right.role));
  return participants;
};

const listMessages = async (roomId, deviceId, after, now) => {
  const store = await getSignalStore();
  const { blobs } = await store.list({ prefix: messageKeyPrefix(roomId) });
  const keys = blobs.map((blob) => blob.key).sort();
  const visible = [];
  let cursor = after || "";

  for (const key of keys) {
    if (key <= after) {
      continue;
    }

    const message = await store.get(key, { type: "json" });
    if (!message) {
      continue;
    }

    if (now - message.createdAt > MESSAGE_TTL_MS) {
      await store.delete(key);
      continue;
    }

    cursor = key;

    if (message.senderId === deviceId) {
      continue;
    }

    if (message.targetId && message.targetId !== "*" && message.targetId !== deviceId) {
      continue;
    }

    visible.push(message);
  }

  return { messages: visible, cursor };
};

const upsertParticipant = async (body) => {
  const store = await getSignalStore();
  const roomId = safeRoomId(body.roomId);
  const deviceId = safeDeviceId(body.deviceId);

  if (!roomId || !deviceId) {
    return json(400, { error: "roomId and deviceId are required." });
  }

  const now = Date.now();
  const participant = {
    deviceId,
    roomId,
    role: body.role === "baby" ? "baby" : "parent",
    wantsVideo: Boolean(body.wantsVideo),
    label: body.label || (body.role === "baby" ? "BabyPhone" : "ParentPhone"),
    lastSeenAt: now,
  };

  await store.setJSON(participantKey(roomId, deviceId), participant);
  return json(200, { ok: true, participant });
};

const leaveRoom = async (body) => {
  const store = await getSignalStore();
  const roomId = safeRoomId(body.roomId);
  const deviceId = safeDeviceId(body.deviceId);

  if (!roomId || !deviceId) {
    return json(400, { error: "roomId and deviceId are required." });
  }

  await store.delete(participantKey(roomId, deviceId));
  return json(200, { ok: true });
};

const sendSignal = async (body) => {
  const store = await getSignalStore();
  const roomId = safeRoomId(body.roomId);
  const senderId = safeDeviceId(body.senderId);
  const targetId = body.targetId ? safeDeviceId(body.targetId) : "*";

  if (!roomId || !senderId || !body.type) {
    return json(400, { error: "roomId, senderId and type are required." });
  }

  const createdAt = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const key = `${messageKeyPrefix(roomId)}${String(createdAt).padStart(13, "0")}-${randomSuffix}.json`;

  await store.setJSON(key, {
    key,
    roomId,
    senderId,
    targetId,
    type: body.type,
    payload: body.payload ?? null,
    createdAt,
  });

  return json(200, { ok: true, cursor: key });
};

const pollRoom = async (url) => {
  const roomId = safeRoomId(url.searchParams.get("roomId"));
  const deviceId = safeDeviceId(url.searchParams.get("deviceId"));
  const after = url.searchParams.get("after") || "";

  if (!roomId || !deviceId) {
    return json(400, { error: "roomId and deviceId are required." });
  }

  const now = Date.now();
  const participants = await listParticipants(roomId, now);
  const { messages, cursor } = await listMessages(roomId, deviceId, after, now);

  return json(200, {
    ok: true,
    participants,
    messages,
    cursor,
    serverTime: now,
  });
};

export default async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    const url = new URL(req.url);

    if (req.method === "GET") {
      return pollRoom(url);
    }

    if (req.method !== "POST") {
      return json(405, { error: "Method not allowed." });
    }

    const body = await parseJson(req);
    const action = body.action || "";

    if (action === "join" || action === "heartbeat") {
      return upsertParticipant(body);
    }

    if (action === "leave") {
      return leaveRoom(body);
    }

    if (action === "send") {
      return sendSignal(body);
    }

    return json(400, { error: "Unknown action." });
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : "Unknown server error.",
    });
  }
};
