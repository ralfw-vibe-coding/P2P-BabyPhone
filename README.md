# BabyPhone

Ein wirklich privates BabyPhone fuer zwei Smartphones.

Die Idee hinter dieser App ist einfach: Ein Phone bleibt beim Baby, ein zweites Phone ist bei den Eltern. So koennt ihr euer Kind sicher hoeren oder sehen, ohne eine fremde Babyphone-Cloud zu benutzen und ohne einen oeffentlichen Livestream irgendwo im Internet.

Diese App ist fuer den privaten Einsatz gedacht. Sie verbindet nur eure beiden Geraete.

Ein Server bei Netlify wird nur dafuer benutzt, die Seite auszuliefern und die Verbindung zwischen euren Phones kurz anzubahnen. Sobald die Verbindung steht, laeuft der eigentliche Stream direkt zwischen euren Smartphones.

## Was diese App besonders macht

- Sie ist bewusst klein und einfach gehalten.
- Sie ist fuer zwei konkrete Rollen gebaut: `Baby` und `Parent`.
- Die Verbindung ist privat und verschluesselt.
- Es gibt keinen Medienserver, der Audio oder Video fuer euch weiterleitet.
- Das Baby sendet nur das, was das Parent-Phone gerade anfordert.

## So benutzt ihr die App

Stell dir folgende Situation vor:

Es ist Abend. Das Baby schlaeft im Schlafzimmer. Die Mutter legt ihr Smartphone neben das Bettchen. Dieses Handy wird zum `BabyPhone`. Der Vater nimmt sein Smartphone mit ins Wohnzimmer. Dieses Handy wird zum `ParentPhone`.

Am Anfang stehen beide noch kurz beim Baby:

1. Auf dem ersten Handy waehlen sie `Baby`.
2. Dort tippt sie auf `Starten`.
3. Jetzt erscheint ein grosser Code, zum Beispiel `123-987`.
4. Auf dem zweiten Handy waehlen sie `Parent`.
5. Dort gebt sie genau diesen Code ein und tippt auf `Verbinden`.

Nach einer kleinen Weile sind die beiden Phones miteinander gekoppelt.

Wenn die Eltern danach im Wohnzimmer sind, kann das ParentPhone entscheiden, was es gerade braucht:

- `Audio`: Sie hoeren nur, ob sich das Kind regt.
- `Video`: Sie sehen das Baby und hoeren gleichzeitig den Ton.
- `Aus`: Es wird nichts uebertragen.

Wichtig ist dabei:

- Das BabyPhone wartet einfach auf Anforderungen.
- Wenn auf dem ParentPhone nur `Audio` aktiv ist, sendet das BabyPhone auch nur Audio.
- Wenn auf dem ParentPhone `Video` aktiv ist, sendet das BabyPhone Bild und Ton.
- Wenn alles ausgeschaltet ist, sendet das BabyPhone nichts.

So bleibt die Verbindung moeglichst sparsam und klar.

## Was die Eltern auf dem Bildschirm sehen

### Auf dem BabyPhone

- Schritt 1: Rolle `Baby` waehlen
- Schritt 2: `Starten`
- Danach wird der Code gross angezeigt
- Das BabyPhone wartet dann auf das ParentPhone
- Wenn verbunden, seht ihr den Status direkt in der App

### Auf dem ParentPhone

- Schritt 1: Rolle `Parent` waehlen
- Schritt 2: Code vom BabyPhone eingeben und `Verbinden`
- Schritt 3: Medium waehlen
- Dort koennt ihr `Audio` oder `Video` ein- und ausschalten

## Hinweise fuer den echten Alltag

- Testet die Verbindung am Anfang am besten noch im selben Raum.
- Danach bleibt das BabyPhone beim Baby, und das ParentPhone kommt mit zu euch.
- Beide Browser-Tabs sollten offen bleiben.
- Die Displays sollten nicht in einen strengen Energiesparmodus fallen.
- Wenn die direkte Verbindung in einem bestimmten Netz nicht klappt, zeigt die App deutlich an, dass wahrscheinlich ein `TURN`-Server noetig waere.

## Lokal testen

Wenn du die App erst einmal auf deinem Rechner ausprobieren willst:

```bash
npm install
npm run dev
```

Danach zeigt Netlify lokal eine Adresse an, meistens etwas wie:

```text
http://localhost:8888
```

Diese Adresse kannst du im Browser oeffnen und das UI ausprobieren. (Bei demm lokalen Test ist eine Verbindung mit einem anderen Phone noch nicht möglich.)

## Installation bei Netlify

Wenn du mit GitHub und Netlify noch nicht viel gemacht hast, geh einfach in Ruhe diese Schritte durch.

### 1. Projekt zu GitHub hochladen

Du brauchst das Projekt zuerst in einem eigenen GitHub-Repository. Dafür kannst du dieses Repository forken.

Wenn es schon bei dir in GitHub liegt, kannst du direkt mit Schritt 2 weitermachen.

### 2. Bei Netlify anmelden

Gehe auf [netlify.com](https://www.netlify.com/) und melde dich an.

Am einfachsten ist die Anmeldung mit deinem GitHub-Konto. Das ist kostenlos.

### 3. Neues Projekt aus Git importieren

In Netlify:

1. `Add new site` anklicken
2. `Import an existing project` waehlen
3. `GitHub` waehlen
4. Dein Repository mit diesem BabyPhone-Projekt auswaehlen

### 4. Die Build-Einstellungen eintragen

Beim Einrichten der Seite traegst du diese Werte ein:

- `Branch to deploy`: `main`
- `Base directory`: leer lassen
- `Build command`: `npm install`
- `Publish directory`: `.`
- `Functions directory`: `netlify/functions`

Wenn Netlify bei dir `Publish directory` schon aus der Datei `netlify.toml` erkennt, ist das auch in Ordnung.

### 5. Deploy starten

Klicke danach auf `Deploy site`.

Netlify installiert dann automatisch die Abhaengigkeiten und stellt die Seite online.

### 6. Die fertige URL oeffnen

Nach dem Deploy bekommst du eine Webadresse von Netlify, zum Beispiel:

```text
https://<dein projektname>.netlify.app
```

Diese URL oeffnest du auf beiden Smartphones und bedienst wie oben beschrieben.

## Wenn etwas nicht funktioniert

### Die Phones finden sich nicht

- Pruefen, ob beide wirklich denselben Code benutzen
- Pruefen, ob beide die aktuelle Netlify-URL geoeffnet haben
- Seite notfalls auf beiden Geraeten neu laden oder Verbindung trennen und neu verbinden.

### Die App sagt, dass "TURN" noetig ist

Dann reicht die direkte Verbindung in diesem Netz gerade nicht aus. Das kann in manchen WLAN- oder Mobilfunk-Konstellationen passieren. Fuer diesen Prototypen ist das normal und kein Zeichen dafuer, dass mit der App grundsaetzlich etwas kaputt ist.

### Lokal kommt ein Fehler mit Port 3999 oder 8888

Dann laeuft oft noch ein alter Netlify-Prozess im Hintergrund. Diesen Prozess musst du zuerst beenden und danach `npm run dev` neu starten.

## Technischer Kurzueberblick

Falls du spaeter selbst wieder hineinschauen willst:

- [index.html](/Users/ralfw/Repositories/08%20Vibe%20Coding/BabyPhone/index.html): komplette SPA
- [netlify/functions/signal.mjs](/Users/ralfw/Repositories/08%20Vibe%20Coding/BabyPhone/netlify/functions/signal.mjs): Signaling-Funktion
- [netlify.toml](/Users/ralfw/Repositories/08%20Vibe%20Coding/BabyPhone/netlify.toml): Netlify-Konfiguration

## Wichtiger Hinweis

Das ist ein privater Prototyp und kein zertifiziertes Sicherheits- oder Medizinprodukt. Er ist dafuer gedacht, fuer euch zuhause eine moeglichst private und einfache Babyphone-Verbindung zu schaffen.
