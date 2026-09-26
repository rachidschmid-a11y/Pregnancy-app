# 🪺 Unser Nest

*[🇬🇧 English version available here](README.en.md)*

Eine private, gemeinsame Web-App für werdende Eltern: eine Checkliste für die
Zeit vor und nach der Geburt, ein Inventar für die Baby-Kleidung, eine
gemeinsame Namensliste und ein Wehen-Timer. Die App synchronisiert in Echtzeit
zwischen euren Geräten, funktioniert auch offline, lässt sich wie eine App auf
dem Handy installieren und läuft komplett im **eigenen**
[Firebase](https://firebase.google.com)-Projekt – im kostenlosen Tarif, ohne
eigenen Server.

Diese Dokumentation beschreibt den kompletten Setup-Prozess von null auf eine
lauffähige, selbst gehostete Instanz – inklusive Zugriffsschutz, lokaler
Entwicklung mit dem Firebase-Emulator, Tests und Deployment.

> **Hinweis:** Diese Dokumentation und der zugehörige Code enthalten keine
> personenbezogenen Daten (keine echten Namen, E-Mail-Adressen, Projekt-IDs
> oder Zugangsdaten). Alle Beispielwerte sind frei erfunden bzw. exemplarisch.
> Wer Zugriff hat, steht ausschließlich in der Datei `firestore.rules`, die
> ihr selbst aus der Vorlage anlegt und die nicht ins Repository gehört.

---

## Inhaltsverzeichnis

1. [Funktionsübersicht](#funktionsübersicht)
2. [Technischer Stack](#technischer-stack)
3. [Projektstruktur](#projektstruktur)
4. [Voraussetzungen](#voraussetzungen)
5. [Setup Schritt 1: Firebase-Projekt anlegen](#setup-schritt-1-firebase-projekt-anlegen)
6. [Setup Schritt 2: Google-Anmeldung und Testnutzer](#setup-schritt-2-google-anmeldung-und-testnutzer)
7. [Setup Schritt 3: Firestore-Datenbank und Web-App](#setup-schritt-3-firestore-datenbank-und-web-app)
8. [Setup Schritt 4: Zugriffsregeln anlegen](#setup-schritt-4-zugriffsregeln-anlegen)
9. [Setup Schritt 5: Lokal testen mit dem Emulator](#setup-schritt-5-lokal-testen-mit-dem-emulator)
10. [Setup Schritt 6: Deployment auf Firebase Hosting](#setup-schritt-6-deployment-auf-firebase-hosting)
11. [Update von Version 1](#update-von-version-1)
12. [Konfiguration](#konfiguration)
13. [Tests](#tests)
14. [Datenmodell-Referenz](#datenmodell-referenz)
15. [Wie die App intern arbeitet](#wie-die-app-intern-arbeitet)
16. [Troubleshooting](#troubleshooting)
17. [Sicherheitshinweise und Datenschutz](#sicherheitshinweise-und-datenschutz)
18. [Lizenz](#lizenz)

---

## Funktionsübersicht

| Bereich | Funktionen |
|---|---|
| ✅ **Checkliste** | 10 Kategorien mit 74 recherchierten Beispielpunkten; pro Punkt Frist, Termin (optional wöchentlich), Preis, Zuständigkeit (ich / Partner:in / beide), Notizen, offene Fragen und Links; „erledigt von … am …“; Punkte und Kategorien verschieben, umbenennen, löschen (mit „Rückgängig“); Suche und Filter (Meine Aufgaben, Offene Fragen, Mit Termin); **Vorlagen-Pakete** zum Nachladen (ausführliche Kliniktasche, Behörden nach der Geburt, Wochenbett, Geburtsplan); Drucken |
| 🤰 **Schwangerschaft** | Aktuelle Schwangerschaftswoche aus dem Entbindungstermin (z. B. „SSW 32+0“), Trimester-Leiste, Größenvergleich mit Obst/Gemüse; nach der Geburt das Alter des Babys |
| 📊 **Übersicht** | Kacheln für offene Fragen, Termine & Fristen (14 Tage oder alle) und Budget (Summe aller Preise, erledigt/offen, eigenes Budget-Ziel); Kalender-Export als `.ics` mit Erinnerung am Vortag |
| 👕 **Baby-Kleidung** | Kleidungsstücke mit Kategorie, Größe (50/56 bis 86/92, Uni Size), Farbe, Muster, Menge, Foto, Herkunft (gekauft/geschenkt/geliehen/gebraucht), „von wem“ und „gewaschen“; Bestand je Größe mit eigenen Zielen; **Jahreszeit je Größe** anhand des Entbindungstermins; Zielwert-Vorschlag passend zur Jahreszeit; **Einkaufsliste** „Was noch fehlt“ zum Kopieren/Teilen; Suche, Filter und Foto-Großansicht |
| 💕 **Namen** | Gemeinsame Namensliste (Mädchen/Junge/neutral, Bedeutung); jede Person bewertet für sich (Favorit, gefällt, eher nicht); die Bewertung der anderen Person wird erst nach der eigenen sichtbar; **Treffer**, wenn beide einen Namen mögen; Nachname zum Probelesen |
| ⏱️ **Geburt** | **Wehen-Timer** live auf beiden Geräten mit Auswertung der letzten Stunde und Hinweis nach gängiger Faustregel; wichtige Telefonnummern mit Anruf-Knopf; Stand der Kliniktasche aus der Checkliste |
| 🔄 **Zusammenarbeit** | Echtzeit-Sync; gleichzeitige Änderungen werden **zusammengeführt** statt überschrieben |
| 📴 **Offline & App** | Offline-Speicher für Daten und App; installierbar als App (Android, iPhone, Desktop); Direktsprünge per Adresse (`#checkliste`, `#kleidung`, `#namen`, `#geburt`) |
| 💾 **Sicherung** | Export als ZIP (CSV-Dateien, Fotos, vollständiges JSON) und Wiederherstellen daraus |
| 🎨 **Darstellung** | Helles/dunkles Design (automatisch oder fest), Handy-Ansicht mit Reiterleiste unten, getestet in Chrome und Safari/WebKit |
| 🔒 **Zugriffsschutz** | Anmeldung nur mit Google und nur für freigegebene, verifizierte Adressen – serverseitig geprüft |

---

## Technischer Stack

- **Frontend:** Eine einzige HTML-Datei mit HTML, CSS und JavaScript – **ohne Build-Schritt und ohne Framework**
- **Datenbank:** [Cloud Firestore](https://firebase.google.com/docs/firestore) (Echtzeit-Sync, Offline-Speicher)
- **Anmeldung:** [Firebase Authentication](https://firebase.google.com/docs/auth) mit Google-Konto
- **Hosting:** [Firebase Hosting](https://firebase.google.com/docs/hosting) (liefert die Projekt-Konfiguration automatisch unter `/__/firebase/init.json` aus)
- **Offline/Installation:** Service Worker + Web-App-Manifest (PWA)
- **Bibliotheken:** Firebase JS SDK 12 (Compat-Variante, per CDN) – sonst keine Abhängigkeiten
- **Tests:** Node.js-Testrunner (`node --test`), keine Pakete nötig
- **Lokale Entwicklung:** [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)

---

## Projektstruktur

```
.
├── public/                        # Alles, was ausgeliefert wird
│   ├── index.html                 # Die komplette App (HTML, CSS, JavaScript)
│   ├── sw.js                      # Service Worker (Offline-Start der App)
│   ├── manifest.webmanifest       # Web-App-Manifest (Installation, Symbole, Direktsprünge)
│   └── icons/                     # App-Symbole (PNG, SVG, maskierbar, Apple-Touch)
├── tests/
│   └── helpers.test.js            # Tests der reinen Hilfsfunktionen (npm test)
├── firebase.json                  # Hosting (inkl. Header), Firestore und Emulator-Ports
├── firestore.rules.example        # Vorlage für die Zugriffsregeln (→ firestore.rules)
├── firestore.indexes.json         # Firestore-Indizes (keine nötig)
├── .firebaserc.example            # Vorlage für die Projekt-Zuordnung (→ .firebaserc)
├── package.json                   # npm-Skripte: test, start (Emulator)
├── CHANGELOG.md                   # Änderungsprotokoll
├── README.md                      # Diese Dokumentation
└── README.en.md                   # Englische Fassung
```

> Die Dateien `firestore.rules` (eure E-Mail-Adressen) und `.firebaserc` (eure
> Projekt-ID) legt ihr selbst aus den `*.example`-Vorlagen an. Beide stehen in
> `.gitignore` und gehören **nicht** ins Repository.

Innerhalb von `public/index.html` ist das Skript in klar kommentierte Abschnitte
gegliedert: Konfiguration, Symbole, **reine Hilfsfunktionen** (ohne DOM und
Firebase, von den Tests direkt gelesen), Vorlagen, Zustand, Checkliste,
Baby-Kleidung, Namen, Geburt, Sicherung/Wiederherstellen, Konto-Menü,
Anmeldung und Start.

---

## Voraussetzungen

- Ein Google-Konto (für Firebase und die Anmeldung in der App)
- [Node.js](https://nodejs.org) 20 oder neuer (für die Firebase-CLI und die Tests)
- Die Firebase-CLI: `npm install -g firebase-tools`
- Für den lokalen Emulator zusätzlich Java 11 oder neuer
- Git

Kosten: Im kostenlosen **Spark-Tarif** normalerweise 0 €. Es wird keine
Kreditkarte benötigt.

---

## Setup Schritt 1: Firebase-Projekt anlegen

1. [console.firebase.google.com](https://console.firebase.google.com) öffnen → **Projekt hinzufügen**.
2. Namen vergeben (z. B. `unser-nest`). Google Analytics wird nicht gebraucht.
3. Die **Projekt-ID** notieren (Projekteinstellungen → „Projekt-ID“, z. B.
   `unser-nest-a1b2c`). Sie wird in Schritt 6 benötigt.

---

## Setup Schritt 2: Google-Anmeldung und Testnutzer

1. Firebase Console: **Build → Authentication → Jetzt starten**.
2. Tab **Sign-in method** → **Google** → aktivieren → Speichern.
3. Testnutzer eintragen, damit sich wirklich nur ihr anmelden könnt:
   - [console.cloud.google.com/auth/audience](https://console.cloud.google.com/auth/audience)
     öffnen (oben das richtige Projekt wählen; in älteren Oberflächen heißt
     der Bereich „OAuth-Zustimmungsbildschirm“).
   - Nutzertyp **Extern**, Status **Testing** belassen.
   - Unter **Testnutzer** → **+ Add users** → die Google-Adressen aller
     Personen eintragen, die die App nutzen sollen.

Der Zugriff ist damit **doppelt** abgesichert: Nur Testnutzer können sich
anmelden, und die Datenbank akzeptiert zusätzlich nur die in
`firestore.rules` eingetragenen, verifizierten Adressen (Schritt 4).

---

## Setup Schritt 3: Firestore-Datenbank und Web-App

1. Firebase Console: **Build → Firestore Database → Datenbank erstellen**.
   Standort z. B. `eur3 (europe-west)`. Der Startmodus ist egal – in Schritt 6
   werden eigene Regeln hochgeladen.
2. Zahnrad → **Projekteinstellungen** → **Meine Apps** → **</>** (Web) →
   Namen vergeben → **App registrieren**. Den angezeigten Konfigurations-Code
   braucht ihr **nicht** zu kopieren: Firebase Hosting liefert ihn der App
   automatisch aus.

---

## Setup Schritt 4: Zugriffsregeln anlegen

```bash
git clone <URL-eures-Repositories>
cd <Repository-Ordner>
cp firestore.rules.example firestore.rules
```

In `firestore.rules` die Beispieladressen durch dieselben Adressen wie in
Schritt 2 ersetzen (kleingeschrieben):

```
request.auth.token.email in [
  "person-1@example.com",
  "person-2@example.com"
];
```

Die Regeln erlauben den Zugriff auf `nest/shared` **und alles darunter** –
dadurch sind alle Bereiche der App (Kleidung, Namen, Kontakte, Wehen …)
automatisch abgedeckt. Alles andere in der Datenbank ist für niemanden
zugänglich.

> ⚠️ `firestore.rules` **niemals** committen – sie enthält eure Adressen und
> ist bereits in `.gitignore` eingetragen.

---

## Setup Schritt 5: Lokal testen mit dem Emulator

Mit der Firebase Emulator Suite läuft alles auf dem eigenen Rechner – mit
Test-Konten und Test-Daten, ohne ein echtes Projekt anzufassen:

```bash
npm start      # = firebase emulators:start --project demo-unser-nest
```

Dann [http://127.0.0.1:5000](http://127.0.0.1:5000) öffnen → **Mit Google
anmelden** → **Add new account** → eine der Adressen aus `firestore.rules`
eingeben. Projekt-IDs, die mit `demo-` beginnen, erkennt die App und verbindet
sich automatisch mit den Emulatoren. Unter
[http://127.0.0.1:4000](http://127.0.0.1:4000) ist die Test-Datenbank zu sehen.

Um das Zusammenspiel zweier Personen auszuprobieren: ein zweites
Browserfenster im privaten Modus öffnen und mit der zweiten Adresse anmelden.

---

## Setup Schritt 6: Deployment auf Firebase Hosting

```bash
firebase login
cp .firebaserc.example .firebaserc     # euer-firebase-projekt → eure Projekt-ID
firebase deploy
```

Das erste Deployment lädt **Regeln und App** hoch. Am Ende steht die
**Hosting URL**, z. B. `https://unser-nest-a1b2c.web.app` – euer privater Link.
Öffnen, mit Google anmelden, fertig. Beim allerersten Anmelden wird die
Beispiel-Checkliste angelegt.

Später reicht für Änderungen an der App:

```bash
firebase deploy --only hosting
```

> ⚠️ `--only hosting` lädt die Regeln **nicht** mit hoch. Nach Änderungen an
> `firestore.rules` einmal `firebase deploy --only firestore:rules` (oder
> `firebase deploy`) ausführen.

**Optional erst testen:** Eine zeitlich begrenzte Vorschau-Adresse mit den
echten Daten, während die gewohnte Adresse unverändert bleibt:

```bash
firebase hosting:channel:deploy vorschau --expires 7d
```

**Als App auf dem Handy:** Link öffnen, dann unter Android den Hinweis
„Installieren“ antippen, auf dem iPhone/iPad Teilen → „Zum Home-Bildschirm“.

**Zurück zur vorherigen Version:** Firebase Console → Hosting →
Versionsverlauf → „Rollback“. Die Daten bleiben dabei unverändert.

---

## Update von Version 1

Version 2 nutzt **dieselbe Datenbank** und liest alle Daten von Version 1
(Checkliste, Kleidung, Fotos, Zielwerte, Kategorien) ohne Umwandlung. Die
Zugriffsregeln müssen nicht geändert werden.

1. In Version 1 **„Sicherung herunterladen“** und die ZIP-Datei aufbewahren
   (Version 2 kann sie über das Konto-Menü wiederherstellen).
2. Den Code von Version 2 in den bisherigen Projektordner übernehmen (eure
   `firestore.rules` und `.firebaserc` bleiben dabei, wie sie sind).
3. `firebase deploy --only hosting` – fertig.

Beide Versionen vertragen sich auch in der Übergangszeit (z. B. ein altes,
noch offenes Browserfenster mit Version 1). Details unter
[Wie die App intern arbeitet](#verträglichkeit-mit-version-1).

---

## Konfiguration

Checkliste, Kategorien der Baby-Kleidung, Namen und Kontakte passt ihr direkt
in der App an – dafür muss kein Code geändert werden. Im Code stehen nur
Vorlagen und feste Listen, jeweils am Anfang des Skripts in
`public/index.html`:

| Was | Wo | Hinweis |
|---|---|---|
| Vorlage der Checkliste | `defaultState()` | gilt nur für neue Installationen |
| Vorlagen-Pakete („Aus Vorlage hinzufügen“) | `TEMPLATE_PACKS` | jederzeit nachladbar, auch in bestehenden Listen |
| Kategorien der Baby-Kleidung | `DEFAULT_CLOTHING_CATEGORIES` | gilt, bis zum ersten Mal in der App bearbeitet wurde |
| Kleidergrößen | `CLOTHING_SIZES` | alte Größenangaben werden über `LEGACY_SIZE_MIGRATION` umgestellt |
| Alter je Größe (für die Jahreszeit) | `SIZE_AGE_MONTHS` | Richtwerte in Monaten ab Geburt |
| Zielwert-Vorschläge | `suggestTargets()` | je Größe und Jahreszeit (warm/mild/kalt) |
| Größenvergleich je SSW | `BABY_SIZE_BY_WEEK` | Name, Länge, Gewicht, Symbol |
| Farben und Design | CSS-Variablen am Anfang von `<style>` | helles und dunkles Farbschema |

Nach Änderungen: `firebase deploy --only hosting`.

**Schriftarten:** Die Schriften werden von Google Fonts geladen. Wer das nicht
möchte, kann sie selbst hosten oder die `<link>`-Zeile im `<head>` entfernen
(dann greifen Systemschriften).

**Service Worker:** Bei jeder neuen Version (vor allem bei einer neuen
Firebase-Version in `index.html`) den Namen `CACHE` in `public/sw.js`
hochzählen – dann werden alte Dateien beim nächsten Start aufgeräumt.

---

## Tests

```bash
npm test       # = node --test tests/*.test.js
```

Die Tests lesen den Abschnitt **„REINE HILFSFUNKTIONEN“** direkt aus
`public/index.html` und prüfen ihn mit Node – ohne Browser, ohne Firebase und
ohne zusätzliche Pakete. Abgedeckt sind (22 Tests):

- Zusammenführen gleichzeitiger Änderungen (Felder, neue/gelöschte/verschobene
  Punkte, Reihenfolge, unbekannte Felder, Kleidungs-Kategorien)
- Verträglichkeit mit Version 1 (Wiederherstellen der neuen Felder)
- Preiserkennung („ca. 1.299,90 €“, „50–80 €“ …), Schwangerschaftswoche,
  Alter des Babys, Jahreszeit je Größe, Zielwert-Vorschläge
- Wehen-Auswertung, Kalender-Export (.ics, Zeilenumbruch nach RFC 5545),
  CSV-Schutz vor Formeln, ZIP schreiben/lesen (auch komprimiert), Base64,
  Maskieren und sichere Links

Die Oberfläche selbst wird mit dem Emulator (Schritt 5) ausprobiert.

---

## Datenmodell-Referenz

Alle Daten liegen unter `nest/shared` – dadurch genügt eine einzige Regel.

| Pfad | Zweck | Wichtige Felder |
|---|---|---|
| `nest/shared` | Checkliste als **ein** Dokument | `dueDate`, `birthDate`, `budget`, `categories[]`, `schema`, `updatedAt` |
| `nest/shared/clothing/{id}` | Ein Dokument pro Kleidungsstück | `ober`, `unter`, `groesse`, `menge`, `farbe`, `muster`, `herkunft`, `von`, `gewaschen`, `photo`, `createdAt` |
| `nest/shared/clothingMeta/targets` | Zielwerte der Baby-Kleidung | Schlüssel `"kategorie\|unterkategorie\|größe"` → Anzahl |
| `nest/shared/clothingMeta/categories` | Eigene Kategorien der Kleidung | `categories[]` mit `key`, `name`, `icon`, `subs[]` |
| `nest/shared/names/{id}` | Namensideen | `name`, `gender` (`w`/`m`/`n`), `note`, `votes` (je Person `2`/`1`/`-1`) |
| `nest/shared/contacts/{id}` | Wichtige Nummern | `label`, `name`, `phone`, `order` |
| `nest/shared/contractions/{id}` | Wehen | `start`, `end` (Millisekunden), `by` |
| `nest/shared/meta/members` | Angemeldete Personen (für „Zuständig“) | je Nutzer-ID: `email`, `name` |
| `nest/shared/meta/checklistExtras` | Kopie der Angaben, die nur Version 2 kennt | `items{}` mit `wer`, `doneBy`, `doneAt`; `budget`, `birthDate` |

**Kategorien der Checkliste** (`categories[]`): `id`, `name`, `icon`, `items[]`.
**Punkte** (`items[]`): `id`, `title`, `done`, `bisWann` (Frist), `wann`
(Termin), `wannRepeatWeekly`, `preis` (Freitext), `notizen`, `zuKlaeren`,
`links[]` (`label`, `url`), `wer` (Nutzer-ID oder `"beide"`), `doneBy`, `doneAt`.

**Fotos** werden im Browser auf ca. 480 px verkleinert und als JPEG (typisch
20–60 KB) direkt im Dokument des Kleidungsstücks gespeichert, weil Cloud
Storage im kostenlosen Spark-Tarif nicht verfügbar ist. Da jedes Stück ein
eigenes Dokument ist, wird Firestores Grenze von 1 MB pro Dokument nie
erreicht.

---

## Wie die App intern arbeitet

### Zusammenführen gleichzeitiger Änderungen

Checkliste und Kleidungs-Kategorien sind jeweils ein gemeinsames Dokument.
Die App merkt sich den letzten gemeinsamen Stand und führt beim Speichern (in
einer Firestore-Transaktion) und beim Empfangen zusammen (3-Wege-Merge):

- Pro Feld gewinnt, wer es geändert hat.
- Neue Punkte beider Seiten bleiben erhalten; Löschungen und Verschiebungen
  werden übernommen.
- Nur wenn beide **dasselbe Feld** gleichzeitig ändern, gewinnt die eigene
  Eingabe.

Kleidungsstücke, Zielwerte, Namen, Bewertungen, Kontakte und Wehen sind
einzelne Dokumente bzw. Felder und überschneiden sich nie.

### Offline

Firestore speichert alle Daten zusätzlich im Browser (IndexedDB), der Service
Worker hält die App selbst bereit. Ohne Netz startet die App aus dem
Zwischenspeicher; Änderungen werden später übertragen. Die Oberfläche wird
offline nur freigegeben, wenn genau dieses Konto auf diesem Gerät schon einmal
vom Server bestätigt wurde.

### Verträglichkeit mit Version 1

- Version 2 zeigt alle Daten von Version 1 unverändert an und schreibt beim
  bloßen Öffnen nichts um.
- Version 1 zeigt Daten von Version 2 an; neue Bereiche und Felder ignoriert
  sie.
- Speichert Version 1 die Checkliste, fehlen danach Zuständig, erledigt
  von/am, Budget und Geburtstag. Version 2 erkennt solche Stände am fehlenden
  Feld `schema` und ergänzt die Angaben automatisch aus
  `meta/checklistExtras`.

---

## Troubleshooting

**„Dieses Konto hat keinen Zugriff“, obwohl die Adresse eingetragen ist**
Die Regeln sind vermutlich nicht hochgeladen – `firebase deploy --only
hosting` lädt sie **nicht** mit. Einmal `firebase deploy` ausführen und in der
Ausgabe auf „released rules firestore.rules“ achten. Außerdem Groß-/
Kleinschreibung der Adresse prüfen.

**„Firebase-Konfiguration nicht gefunden“**
Die App wurde nicht über Firebase Hosting geöffnet (z. B. `index.html` direkt
als Datei) oder es ist keine Web-App registriert (Schritt 3).

**„Not in a Firebase app directory“**
Den Befehl im Projektordner ausführen – dort, wo `firebase.json` liegt.

**„No currently active project“ bzw. das Deployment landet im falschen Projekt**
`.firebaserc` aus der Vorlage anlegen oder das Projekt ausdrücklich angeben:
`firebase deploy --only hosting --project eure-projekt-id`.

**Anmelde-Fenster erscheint nicht**
Pop-up-Blocker für die Seite deaktivieren. Auf einer Vorschau-Adresse ggf.
die Domain unter Authentication → Einstellungen → Autorisierte Domains
eintragen.

**Die App zeigt eine alte Version**
Einmal neu laden (am Handy die App ganz schließen und wieder öffnen). Die App
lädt online immer zuerst die neueste Version; nur ohne Verbindung startet sie
aus dem Zwischenspeicher. Die Versionsnummer steht unten auf der Seite.

**„offline – wird später übertragen“, obwohl Internet da ist**
Die Datenbank war kurz nicht erreichbar. Die Änderungen sind auf dem Gerät
gespeichert und werden automatisch übertragen.

**Darstellungsfehler auf iPhone/iPad (Safari)**
Safari berechnet manche Layouts anders als Chrome. Die aktuelle Version ist in
der Safari-Engine (WebKit) geprüft; bei neuen Auffälligkeiten hilft ein
Screenshot – und in der Regel eine feste Breite statt nur `flex-basis`.

---

## Sicherheitshinweise und Datenschutz

- **Keine eigenen Server, kein Tracking.** Alle Daten liegen im
  Firebase-Projekt der Person, die die App einrichtet.
- **Zugriff wird serverseitig geprüft:** Die Firestore-Regeln lassen nur
  angemeldete Google-Konten mit **verifizierter** Adresse aus der Liste in
  `firestore.rules` zu. Das lässt sich im Browser nicht umgehen.
- **Die Projekt-Konfiguration (API-Key, Projekt-ID) ist kein Geheimnis:** Sie
  wird von Firebase Hosting ohnehin öffentlich ausgeliefert. Geschützt werden
  die Daten durch die Regeln – nicht durch das Verbergen der Konfiguration.
  Sie steht trotzdem bewusst nicht im Code.
- **Nie committen:** `firestore.rules` (Adressen), `.firebaserc` (Projekt-ID),
  Sicherungs-ZIPs und Kalenderdateien – alles in `.gitignore` eingetragen.
- **Offline-Speicher:** Die Daten liegen zusätzlich im Browser des Geräts.
  „Abmelden“ im Konto-Menü löscht diesen Speicher wieder (sinnvoll auf fremden
  Geräten).
- **Eingaben werden maskiert**, Links nur als `http(s)` ausgegeben (keine
  `javascript:`-Links), CSV-Exporte vor Formeln geschützt.
- **Hosting-Header:** `X-Content-Type-Options`, `Referrer-Policy` und
  `Permissions-Policy` sind in `firebase.json` gesetzt.
- **Medizinischer Hinweis:** Der Wehen-Timer gibt eine gängige Faustregel
  wieder und ersetzt keine medizinische Beratung. Im Zweifel immer Kreißsaal
  oder Hebamme anrufen.
- Im OAuth-Modus „Testing“ erlaubt Google höchstens 100 Testnutzer – für eine
  Familie mehr als genug.

---

## Lizenz

Privates Projekt. Lizenz nach Bedarf ergänzen (z. B. MIT), falls das
Repository öffentlich geteilt werden soll.
