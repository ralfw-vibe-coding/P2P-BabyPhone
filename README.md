# BabyPhone Prototype

Ein privater SPA-Prototyp für zwei Smartphones:

- `BabyPhone` sendet `Audio` oder `Video`
- `ParentPhone` empfängt den Stream
- WebRTC übernimmt die verschlüsselte Medienverbindung
- Netlify Functions + Netlify Blobs übernehmen das leichte Signaling

## Ablauf im UI

1. Rolle wählen: `Baby` oder `Parent`
2. Beide Phones mit demselben kurzen Code wie `123-987` matchen
3. Auf dem BabyPhone festlegen, ob `Audio` oder `Video` gesendet wird
4. Beide Phones auf `Verbinden` tippen

Der Link-Share bleibt optional, aber der Hauptweg ist ein kurzer manuell eingegebener Code.

## Lokal starten

```bash
npm install
npm run dev
```

Dann im Browser über die von `netlify dev` angezeigte URL öffnen.

## Deployment auf Netlify

1. Repository mit Netlify verbinden
2. Build command leer lassen oder `npm install`
3. Publish directory: `.`
4. Functions directory ist bereits in `netlify.toml` gesetzt
5. Nach dem Deploy die Seite auf beiden Smartphones öffnen

## Architektur

- `index.html`: komplette SPA in einer Datei
- `netlify/functions/signal.mjs`: Join, Heartbeat, Polling und Austausch von Offer/Answer/ICE
- `@netlify/blobs`: einfacher Speicher für Teilnehmer und Signaling-Nachrichten

## Wichtige Hinweise

- Das ist bewusst ein Prototyp für privaten Einsatz.
- Es wird ein öffentlicher STUN-Server genutzt: `stun:stun.l.google.com:19302`
- Ohne TURN kann es in manchen Mobilfunk- oder WLAN-Konstellationen Verbindungsprobleme geben.
- Für stabile Nutzung sollten Browser-Tab und Display aktiv bleiben.
