# Änderungsprotokoll

Alle nennenswerten Änderungen an „Unser Nest“, die neuesten zuerst.

---

## 04.10.2026 – Version 2.2: Verschieben per Griff ⠿

### Neu

- **Griff ⠿ statt ▲ ▼ in der Checkliste:** Jeder Punkt und jede Kategorie hat
  rechts einen Griff.
  - **Ziehen** verschiebt einen Punkt innerhalb seiner Kategorie bzw. eine
    Kategorie zwischen den anderen. Eine Linie zeigt, wo er landet; am oberen
    und unteren Bildschirmrand scrollt die Liste mit. Beim Ziehen einer
    Kategorie klappen alle Kategorien kurz zu und danach wieder auf.
  - **Antippen** öffnet ein Menü: „Ganz nach oben“, „Eins nach oben“, „Eins
    nach unten“, „Ganz nach unten“, bei Punkten zusätzlich „In andere
    Kategorie …“, bei Kategorien „Kategorie löschen“ (mit „Rückgängig“).
    Das Menü lässt sich auch mit der Tastatur bedienen (Enter, Pfeiltasten,
    Escape) – Verschieben geht also immer auch ohne Ziehen.
  - Bei Suche, Filter oder „Erledigte ausblenden“ zählen nur die sichtbaren
    Punkte: „Eins nach oben“ springt am ausgeblendeten Nachbarn vorbei.
- **Aufgeräumte Zeilen:** Häkchen · Titel · Kennzeichen · Griff ·
  Aufklapp-Pfeil. „Punkt löschen“ und „Verschieben nach …“ stehen im
  aufgeklappten Punkt. Der Kategorie-Kopf zeigt nur noch Fortschritt, Griff
  und Pfeil.
- **Handy:** Griff und Pfeil stehen neben dem Titel, die Kennzeichen darunter
  (keine eigene Zeile mehr nur für die Knöpfe). Auf Touch-Geräten (iPad,
  Handy) ist der Griff 40 × 40 px groß.

### Behoben

- Hinweis beim Löschen einer Kategorie mit genau einem Punkt: „(1 Punkt)“
  statt „(1 Punkte)“.

### Technisches

- Neue reine Hilfsfunktionen `placeEntry` und `neighborMove` mit Tests
  (`npm test`, jetzt 24 Tests).
- Während gezogen wird, zeichnet die App nicht neu; Änderungen der anderen
  Person werden danach übernommen und wie gewohnt zusammengeführt.
- Service-Worker-Cache `unser-nest-v2.2`.

---

## 27.09.2026 – Version 2.1: Eigene Anzeigenamen

### Neu

- **Anzeigenamen in der App:** Über das Konto-Menü → „Anzeigenamen ändern …“
  legt ihr fest, wie ihr in der App heißt (z. B. einen Spitznamen) – für euch
  beide in einem Dialog. Der Name erscheint überall: Begrüßung, Konto-Knopf
  (inkl. Kürzel), „Zuständig“, „Erledigt von“, Namensbewertungen und
  Sicherung. Das Google-Konto bleibt unverändert; ein leeres Feld bedeutet
  „Vorname aus Google“. Gespeichert wird in `nest/shared/meta/members`
  (Feld `displayName`), eine erneute Anmeldung überschreibt ihn nicht.
- Enter in einem Eingabefeld eines Dialogs löst den Hauptknopf aus.

---

## 26.09.2026 – Version 2.0.1: Darstellung auf iPad/iPhone (Safari)

### Behoben

- **Baby-Kleidung auf dem iPad (Safari):** In den Zeilen der
  Unterkategorien waren Zahl („0 von 3“), die Knöpfe − / + und der Mülleimer
  aus der Karte geschoben und nicht sichtbar. Safari berechnete die Breite der
  Zeile ohne den Fortschrittsbalken. Der Balken hat jetzt eine feste Breite.
- **Checkliste auf dem iPhone:** Bei Punkten mit vielen Kennzeichen (Frist,
  Preis, Links, offene Frage) rutschten Mülleimer und Aufklapp-Pfeil aus der
  Karte. Die Kennzeichen brechen jetzt um.

### Verbessert

- Auf Touch-Geräten (iPad, Handy) sind die Knöpfe − / + und die Symbol-Knöpfe
  größer und leichter zu treffen.

Geprüft mit der Safari-Engine (WebKit) in iPad hoch/quer und iPhone-Größe –
alle Bereiche ohne überstehende Elemente – sowie in Chrome.

---

## 25.09.2026 – Version 2.0

Große Weiterentwicklung. Version 2 nutzt dieselbe Datenbank wie Version 1 und
liest alle bisherigen Daten ohne Umwandlung. Den Wechsel beschreibt
[README → Umstieg von Version 1](README.md#umstieg-von-version-1).

Als Vorbild dienten gängige Schwangerschafts- und Eltern-Apps (Checklisten,
Wehen-Timer, Babynamen mit Partner-Abgleich, Wochenansicht) sowie
Checklisten von familienplanung.de, Hebammen und Krankenkassen – siehe
„Quellen“ unten.

### Neu

- **Gleichzeitige Änderungen werden zusammengeführt.** Bisher gewann bei der
  Checkliste und den Kleidungs-Kategorien der zuletzt gespeicherte Stand,
  eine zeitgleiche Änderung der anderen Person konnte verloren gehen. Jetzt
  merkt sich die App den gemeinsamen Ausgangsstand und führt beim Speichern
  (Firestore-Transaktion) und beim Empfangen zusammen: verschiedene Punkte,
  verschiedene Felder, neue Punkte, Löschungen und Verschiebungen beider
  Seiten bleiben erhalten.
- **Offline nutzbar und als App installierbar.** Daten werden auf dem Gerät
  gespeichert (Firestore-Offline-Speicher), die App selbst startet über
  einen Service Worker auch ohne Netz. Installation auf dem Startbildschirm
  (Android, iPhone, Desktop) mit eigenem Symbol und Direktsprüngen
  (Checkliste, Baby-Kleidung, Wehen-Timer). Oben erscheint „Offline“,
  solange keine Verbindung besteht.
- **Schwangerschaftswoche** im Kopfbereich: „SSW 32+0“, Schwangerschaftswoche,
  Trimester, Fortschrittsbalken und Größenvergleich mit Länge und Gewicht.
  Ab vier Wochen vor dem ET lässt sich der **Geburtstag** eintragen; danach
  zeigt die App das Alter des Babys.
- **Checkliste**
  - **Zuständig**: ich, Partner:in oder beide – mit Kürzel am Punkt und
    Filter „Meine Aufgaben“.
  - **Erledigt von … am …** wird beim Abhaken festgehalten.
  - **Filter-Chips**: Meine Aufgaben, Offene Fragen, Mit Termin (mit Anzahl).
    Suche findet jetzt auch Preise und Link-Texte, mehrere Wörter werden
    kombiniert.
  - **Budget**: Summe aller Preise (erkennt „ca. 1.299,90 €“, „50–80 €“ …),
    erledigt/offen und ein eigenes Budget-Ziel mit Balken.
  - **Termine & Fristen**: Die Kachel zeigt jetzt auch Termine („Wann“),
    wahlweise die nächsten 14 Tage oder alle.
  - **Kalender-Export**: alle Termine und Fristen (plus ET) oder ein einzelner
    Punkt als `.ics`-Datei, mit Erinnerung am Vortag; wöchentliche Termine
    wiederholen sich auch im Kalender.
  - **Punkte verschieben**: ▲ ▼ innerhalb der Kategorie und „Verschieben
    nach …“ in eine andere Kategorie.
  - **Vorlagen-Pakete** („Aus Vorlage hinzufügen“): Kliniktasche – Packliste
    (26 Punkte), Nach der Geburt: Behörden & Termine (16), Wochenbett &
    erste Tage zuhause (12), Geburtsplan: Wünsche besprechen (10). Gibt es
    die Kategorie schon, werden nur fehlende Punkte ergänzt.
  - Glückwunsch, wenn eine Kategorie komplett erledigt ist. 🎉
- **Baby-Kleidung**
  - **Jahreszeit je Größe**: Aus ET bzw. Geburtstag berechnet die App, wann
    eine Größe voraussichtlich passt (z. B. „50/56 · Nov 2026 – Jan 2027 ·
    Herbst/Winter“).
  - **Zielwerte vorschlagen**: füllt leere Ziele der gewählten Größe nach
    gängigen Erstausstattungs-Listen, angepasst an die Jahreszeit (im Winter
    mehr Langarm, im Sommer mehr Kurzarm). Eigene Werte werden nie
    überschrieben; „Rückgängig“ ist möglich.
  - **Einkaufsliste** (neuer Unterreiter): alles, was bis zum Ziel noch fehlt,
    nach Größe – zum Kopieren oder Teilen (z. B. als Wunschliste).
  - Neue Felder: **Herkunft** (gekauft, geschenkt, geliehen, gebraucht),
    **von wem** und **gewaschen** (in der Sammlung per Antippen umschaltbar).
  - Sammlung mit **Suche** und **Filtern**: noch waschen, geschenkt, geliehen.
  - **Foto-Großansicht** beim Antippen des Vorschaubilds.
  - Beim Erfassen bleiben Kategorie, Größe, Herkunft und „von“ für das nächste
    Stück stehen.
- **Namen** (neuer Bereich): gemeinsame Namensliste mit Bedeutung/Notiz,
  Bewertung je Person (❤️ 👍 👎), die Bewertung der anderen Person wird erst
  nach der eigenen sichtbar, **Treffer** bei beidseitigem Gefallen, Filter,
  Sortierung und Nachname zum Probelesen.
- **Geburt** (neuer Bereich):
  - **Wehen-Timer**, live auf beiden Geräten: Dauer, Abstand, Auswertung der
    letzten Stunde und Hinweis nach der üblichen Faustregel (etwa alle
    5 Minuten, rund 1 Minute lang, seit etwa einer Stunde), mit Anruf-Knopf
    für den Kreißsaal. Einträge löschen und „Neu beginnen“ mit „Rückgängig“.
  - **Wichtige Nummern** mit Anruf-Knopf und Notruf 112.
  - **Kliniktasche**: Fortschritt aus der Checkliste, Sprung zur Packliste.
- **Wiederherstellen aus einer Sicherung** (auch aus Sicherungen von
  Version 1). Vorher wird automatisch eine Sicherung des aktuellen Stands
  heruntergeladen. Die Sicherung enthält jetzt zusätzlich `namen.csv`,
  Kontakte, Wehen und die neuen Felder.
- **Konto-Menü** oben rechts: Kalender-Export, Drucken, Sicherung,
  Wiederherstellen, **Design** (automatisch/hell/dunkel) und Abmelden.
  Beim Abmelden wird der Offline-Speicher des Geräts geleert.

### Verbessert

- **Neue Gestaltung**: Kopfzeile mit Logo, persönliche Begrüßung,
  Schwangerschafts-Karte mit Obst-/Gemüse-Symbol und Trimester-Leiste,
  Übersichtskacheln mit farbigen Symbolen, eigener Farbton je Kategorie,
  runde Häkchen, größere Schrift und besserer Kontrast, Größen-Knöpfe und
  Jahreszeiten-Karte bei der Baby-Kleidung, freundliche Leerzustände.
- **Installations-Hinweis** als schmale Leiste mit App-Symbol.
- **Handy**: Reiterleiste unten wie in einer App, kompakterer Kopfbereich.
- **Desktop**: Die obere Leiste bleibt beim Scrollen sichtbar.
- Beim Start erscheint „Einen Moment …“ statt kurz der Anmeldeknopf.
- Firebase-Bibliotheken von 10.13 auf **12.19** aktualisiert.
- Barrierefreiheit: Beschriftungen für Bildschirmleser an allen Knöpfen und
  Feldern, Häkchen als echte Kontrollkästchen, Hinweise als Live-Region.
- Taste `/` springt in die Suche; Enter im Link-Feld fügt den Link hinzu.
- Hinweise stapeln sich nicht mehr endlos (höchstens drei).
- Die Umstellung alter Größenangaben bei den Zielwerten ändert nur noch die
  betroffenen Werte (vorher wurde das ganze Dokument neu geschrieben).
- Unbekannte Felder in der Datenbank bleiben beim Speichern erhalten
  (zukunftssicher).
- CSV-Export schützt zusätzlich vor Zellen, die mit „-“ beginnen
  (Formel-Schutz).
- „Wöchentlich wiederholen“ wird nicht mehr in Großbuchstaben angezeigt.

### Verträglichkeit mit Version 1 (geprüft)

Geprüft mit der **unveränderten Version 1** und Version 2 gleichzeitig auf
derselben Test-Datenbank (Firebase-Emulator):

- **Version 1 → 2:** Daten, die mit der Oberfläche von Version 1 angelegt
  wurden (ET, abgehakte Punkte, Frist, wöchentlicher Termin, Preis, Notiz mit
  Sonderzeichen, offene Frage, Link, umbenannte und neue Kategorie,
  Reihenfolge, gelöschter Punkt; Kleidung mit Foto, Mengen, Ziele, umbenannte
  und neue Unterkategorie): alle 75 Punkte in 11 Kategorien, alle Felder und
  die Kleidung werden in Version 2 identisch angezeigt. Beim Öffnen verändert
  Version 2 kein Dokument von Version 1.
- **Version 2 → 1:** Version 1 startet mit Daten von Version 2 fehlerfrei und
  zeigt alles an (auch neue Vorlagen-Kategorien, verschobene Punkte).
- **Version 1 speichert, während Version 2 genutzt wird:** Zuständig, erledigt
  von/am, Budget und Geburtstag würden dabei verloren gehen. **Neu:** Version 2
  hält eine Kopie dieser Angaben (`nest/shared/meta/checklistExtras`), erkennt
  Speicherstände von Version 1 (Feld `schema` fehlt) und ergänzt die Angaben
  automatisch – getestet mit Version 2 offen und geschlossen. Die Änderung
  aus Version 1 bleibt dabei erhalten.
- **Kleidung:** Bearbeitet Version 1 ein Stück, bleiben Herkunft, „von wem“
  und „gewaschen“ erhalten.
- **Sicherung:** Eine mit Version 1 erstellte ZIP-Sicherung lässt sich in
  Version 2 vollständig wiederherstellen (inkl. Fotos).
- Die Zugriffsregeln (`firestore.rules`) sind in beiden Versionen identisch.

### Sicherheit & Datenschutz

- Startet die App offline aus dem Gerätespeicher, wird die Oberfläche nur
  freigegeben, wenn genau dieses Konto auf diesem Gerät schon einmal vom
  Server bestätigt wurde. Weitere Bereiche laden erst nach der Bestätigung.
- Zusätzliche Sicherheits-Header beim Hosting (`X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`).
- Die Zugriffsregeln bleiben unverändert; alle neuen Daten liegen unter
  `nest/shared` und sind damit automatisch geschützt.

### Technik

- Automatische Tests für die reinen Hilfsfunktionen (`npm test`, 22 Tests:
  Zusammenführen, Verträglichkeit mit Version 1, Preise, SSW, Jahreszeiten,
  Wehen, Kalender, ZIP, CSV).
- Vorlage `.firebaserc.example` für die Projekt-Zuordnung; die eigene
  `.firebaserc` bleibt – wie `firestore.rules` – außerhalb des Repositorys.

### Quellen der Recherche

- Kliniktasche: Checkliste „Meine Kliniktasche“, familienplanung.de (BIÖG,
  Stand März 2025)
- Größenvergleich je SSW: Embryo-Tabelle von babyone.de, babymarkt.de,
  babyartikel.de
- Erstausstattung Kleidung (Mengen je Größe): mibaby.de, AOK, windelrebellen.de
- Wehen und wann in die Klinik: Hinweise von Kliniken und Hebammen
  (u. a. hallohebamme.de, swissmom.ch, Marien Hospital Herne)
- Funktionen vergleichbarer Apps: Übersichten von babelli.de, elterngeld.de,
  babyartikelcheck.de (z. B. AOK Schwanger, CharliesNames)

---

## 24.09.2026 – Sicherung, einheitliches Design, Bearbeiten ohne Umweg

### Neu

- **Sicherung herunterladen** (oben neben „Abmelden“): lädt alles als eine
  ZIP-Datei herunter, damit die Daten nicht nur in Firebase liegen:
  - `checkliste.csv` – alle Punkte mit Status, Fristen, Terminen, Preisen,
    Notizen, offenen Fragen und Links (öffnet direkt in Excel/LibreOffice)
  - `kleidung.csv` – alle Kleidungsstücke mit Größe, Kategorie, Menge, Farbe,
    Muster und Verweis auf das Foto
  - `fotos/` – alle Fotos als JPG
  - `unser-nest-daten.json` – der vollständige Datenstand inkl. Kategorien
    und Zielwerte (Grundlage für eine spätere Wiederherstellung)
  - `LIESMICH.txt` – kurze Erklärung

  Die Datei wird komplett im Browser erzeugt, es wird nichts an Dritte
  übertragen.

### Geändert

- **„Bestand je Größe“ funktioniert jetzt wie die Checkliste.** Der
  Umweg über den Knopf „Bearbeiten“ entfällt. Jede Kategorie ist eine eigene
  Karte mit Symbol, Name, Fortschrittsbalken, Zähler (Bestand/Ziel der
  gewählten Größe) und ▲ ▼ 🗑 ⌄. Jede Unterkategorie ist eine Zeile mit Balken,
  „x von y“, − / + und 🗑. Namen werden direkt angeklickt und umbenannt,
  unter jeder Karte steht „+ Unterkategorie hinzufügen“, ganz unten
  „+ Neue Kategorie“. Kategorien lassen sich ein- und ausklappen.
- **Die Sammlung** (erfasste Kleidungsstücke) nutzt dasselbe Kartendesign:
  je Größe eine einklappbare Karte mit der Stückzahl, darin die Stücke mit
  Foto sowie denselben Bearbeiten- und Löschen-Knöpfen wie in der Checkliste.
- **Speicherstatus und Abmelden** stehen jetzt oben neben den Reitern und
  sind damit auch in der Baby-Kleidung sichtbar (vorher nur in der
  Checkliste). Der Status „speichert …/gespeichert“ berücksichtigt jetzt auch
  Änderungen an der Baby-Kleidung.
- **Das Formular „Hinzufügen“** ist so breit wie alle anderen Karten und
  verwendet dieselben Begriffe (Kategorie/Unterkategorie statt
  Oberpunkt/Unterpunkt).

Alle bisherigen Funktionen bleiben erhalten.

---

## 22.09.2026 – Bearbeitbare Kleidungs-Kategorien, Fehlerbehebungen, Veröffentlichung

### Neu

- **Kategorien der Baby-Kleidung in der App bearbeiten**, zunächst über
  einen Knopf „Bearbeiten“ (seit 24.09. direkt wie in der Checkliste, siehe
  oben): umbenennen, verschieben, hinzufügen und löschen mit „Rückgängig“.
  Was noch Kleidungsstücke enthält, lässt sich nicht löschen, sodass nie
  versehentlich Stücke samt Fotos verloren gehen.

  Die Kategorien werden in Firestore gespeichert
  (`nest/shared/clothingMeta/categories`) und in Echtzeit synchronisiert.
  Solange nie bearbeitet wurde, gilt weiterhin die Vorlage aus dem Code
  (`DEFAULT_CLOTHING_CATEGORIES`). Umbenennen ändert nur den angezeigten
  Namen, nicht die interne Kennung. Erfasste Stücke und Zielwerte bleiben
  deshalb zugeordnet. Neue Kategorien bekommen vorerst ein neutrales Symbol.
  Die Größen sind weiterhin fest im Code.
- **Neue Unterkategorien unter „Sonstiges“:** Moltontücher und Babydecke.
- **„Rückgängig“ beim Löschen von Kleidungsstücken** (stellt das Stück samt
  Foto wieder her).
- **Lokales Testen** mit der Firebase Emulator Suite
  (`firebase emulators:start --project demo-unser-nest`). Die App erkennt
  Demo-Projekte und verbindet sich automatisch mit den Emulatoren.
- **Dokumentation für die Veröffentlichung:** neues `README.md`, komplett
  überarbeitetes `SETUP.md`, dieses Änderungsprotokoll.

### Behoben – möglicher Datenverlust

- **Bearbeiten vor dem Laden überschrieb die Liste.** Die App zeigte direkt
  nach dem Anmelden kurz die Beispiel-Checkliste an. Wer in diesem Moment
  etwas anklickte, speicherte die Vorlage über die echte Liste. Jetzt lässt
  sich erst bearbeiten, wenn die gespeicherte Liste geladen ist.
- **Start ohne Internet überschrieb die Liste.** Offline meldete Firestore
  „Dokument existiert nicht“ (nur: nicht im lokalen Cache), und die App lud
  daraufhin die Vorlage hoch. Das hätte die echte Liste überschrieben, sobald
  die Verbindung zurück war. Jetzt wird die Vorlage nur angelegt, wenn der
  Server bestätigt, dass es noch keine Liste gibt.
- **Eigene Eingaben gingen verloren, wenn die andere Person gleichzeitig
  speicherte.** Kam deren Änderung an, während man selbst tippte, ersetzte sie
  den eigenen, noch nicht gespeicherten Stand. Eigene Eingaben haben jetzt
  Vorrang, bis sie gespeichert sind.
- **Zielwerte der Baby-Kleidung überschrieben sich gegenseitig.** Jede
  Änderung speicherte das ganze Ziel-Dokument neu. Jetzt werden nur die
  geänderten Werte gespeichert.
- **Letzte Eingaben gingen beim Schließen oder App-Wechsel verloren.** Das
  Speichern läuft mit kurzer Verzögerung. Wurde der Tab in dieser Zeit
  geschlossen oder das Handy gesperrt, fehlte die Änderung. Jetzt wird beim
  Wechsel in den Hintergrund und vor dem Abmelden sofort gespeichert.

### Behoben – Funktion

- **Nach Ab- und wieder Anmelden wirkte jeder Klick doppelt.** Abhaken hob
  sich dadurch sofort wieder auf, und Löschen entfernte zwei Punkte.
- **Kacheln „Offene Fragen“ und „Bald fällig“ reagierten nicht auf Klicks.**
  Jetzt springen sie zum Punkt, klappen Kategorie und Details auf und setzen
  Suche bzw. „Erledigte ausblenden“ zurück, falls diese den Punkt verstecken.
- **„Rückgängig“ stellte bei mehreren Löschungen den falschen Punkt wieder
  her** (immer den zuletzt gelöschten) und funktionierte nach einem
  Datenabgleich gar nicht mehr.
- **Deaktivierter Pfeil ▲ bzw. ▼ klappte die Kategorie zu,** statt nichts zu
  tun.
- **Kleidungsstücke ließen sich nicht mehr speichern,** wenn ihre
  Unterkategorie inzwischen in eine andere Kategorie verschoben worden war.
  Der Klick auf „Speichern“ tat dann kommentarlos nichts. Die Unterkategorie
  wird jetzt automatisch gefunden. Ist die Auswahl ungültig, erscheint eine
  Meldung.
- **Badges und Übersichtskacheln aktualisierten sich beim Tippen nicht**
  (z. B. nach Eintragen einer Frist oder offenen Frage), sondern erst beim
  nächsten Klick irgendwo.
- **Wöchentliche Termine blieben in der Vergangenheit hängen.** Wurde ein
  wiederkehrender Punkt mehrere Wochen lang nicht abgehakt, sprang er nur um
  eine Woche weiter. Jetzt springt er auf den nächsten Termin ab heute.
- **Doppelte Kleidungsstücke durch Doppelklick** auf „Hinzufügen“. Das
  Formular wird jetzt sofort geleert (auch offline). Zuvor wartete es auf die
  Bestätigung des Servers.
- **Beim Tippen im Formular „Hinzufügen“ ging der Fokus verloren,** sobald die
  andere Person etwas änderte.
- Neu angelegte Checklisten-Punkte hatten das Feld „wöchentlich wiederholen“
  nicht gesetzt.
- Nach dem Hinzufügen eines Checklisten-Punkts bleibt der Cursor im
  Eingabefeld, sodass man direkt den nächsten eintippen kann.
- Ein abgebrochenes Google-Anmeldefenster zeigt keine Fehlermeldung mehr an.

### Behoben – Darstellung

- Riesige Symbole bei „Link hinzufügen“, „Punkt löschen“ und beim Entfernen
  eines Links (fehlende Größenangabe).
- Lange Titel wurden abgeschnitten, nachdem sich die Fensterbreite geändert
  hatte (z. B. Handy gedreht).
- Überflüssige Trennlinie zwischen Kategorie-Überschrift und erster
  Unterkategorie in der Baby-Übersicht.
- Transparente PNG-Fotos wurden beim Komprimieren schwarz. Sie bekommen jetzt
  einen weißen Hintergrund.
- Anmeldeseite: „Nur ihr beide **habt** Zugriff“ (statt „haben“).

### Sicherheit & Datenschutz

- **Keine Projekt-Konfiguration mehr im Code.** API-Key, Projekt-ID usw.
  lädt die App automatisch von Firebase Hosting (`/__/firebase/init.json`).
- **E-Mail-Adressen nur noch an einer Stelle,** in `firestore.rules`. Die
  zweite Liste im Code (`ALLOWED_EMAILS`) ist entfallen. Die App erkennt
  fehlenden Zugriff an der Antwort der Datenbank. Beide Listen konnten
  bisher auseinanderlaufen.
- **Regeln verlangen eine verifizierte E-Mail-Adresse**
  (`email_verified == true`). Das schützt davor, dass jemand ein Konto mit
  fremder, unbestätigter Adresse anlegt, falls später weitere
  Anmeldemethoden aktiviert werden.
- **Persönliche Dateien werden nicht eingecheckt:** `firestore.rules` und
  `.firebaserc` stehen in `.gitignore`. Mitgeliefert wird die Vorlage
  `firestore.rules.example` mit Platzhalter-Adressen (`@example.com`).
- Gespeicherte Werte (IDs, Links, Fotos) werden vor der Anzeige konsequent
  maskiert. Links werden nur als `http(s)` ausgegeben, damit z. B. keine
  `javascript:`-Links entstehen können.
- Die Oberfläche bleibt gesperrt, bis die Datenbank den Zugriff bestätigt
  hat.

### Update einer bestehenden Installation

1. Einmal komplett hochladen, **nicht** nur `--only hosting`, damit auch die
   verschärften Regeln aktiv werden:
   ```bash
   firebase deploy
   ```
2. Sonst ist nichts zu tun. Vorhandene Checkliste, Kleidungsstücke, Fotos
   und Zielwerte bleiben unverändert. Das Kategorien-Dokument entsteht erst
   beim ersten Bearbeiten.
3. Wer bisher mit einer eigenen `firestore.rules` gearbeitet hat: die Zeile
   `request.auth.token.email_verified == true &&` aus
   `firestore.rules.example` übernehmen.

---

## Nach dem 05.09.2026 – Erweiterung der Baby-Kleidung

- Feld **Menge**: mehrere gleiche Stücke als ein Eintrag („3×“).
- Neue Kategorie **Sonstiges** (Handtücher, Mulltücher, Waschlappen) und
  Unterkategorie **Schlafsack** bei „Einteiler & Schlafzeug“.
- **Größen** auf nicht überlappende Zweierbereiche umgestellt (50/56, 62/68,
  74/80, 86/92) plus **Uni Size**. Einträge und Zielwerte mit älteren
  Größenangaben werden beim Laden automatisch umgestellt.

## Bis 05.09.2026 – Entstehung

1. **Grundkonzept:** Prototyp einer Checkliste mit Kategorien, abhakbaren
   Punkten und pro Punkt Frist, Termin, Preis, Notizen, offenen Fragen und
   Links, vorbefüllt mit einer recherchierten Beispiel-Checkliste.
2. **Umzug auf eigene Firebase-Infrastruktur:** Google-Anmeldung,
   OAuth-Testnutzer, Cloud Firestore, Sicherheitsregeln und Firebase Hosting
   im kostenlosen Spark-Tarif.
3. **Inhalt erweitert** auf 10 Kategorien mit 74 Punkten. Eine bereits
   genutzte eigene Liste wurde abgeglichen. Persönliche Punkte landeten nur
   in der eigenen Liste, nicht in der Vorlage.
4. **Kategorien verschieben** (▲/▼). Dabei wurde behoben, dass „Kategorie
   löschen“ wegen eines abgefangenen Klick-Ereignisses wirkungslos war.
5. **Wiederkehrende Termine:** „Wöchentlich wiederholen“. Abhaken schiebt den
   Termin eine Woche weiter, statt den Punkt zu erledigen.
6. **Mobile Optimierungen:** mitwachsende Titelfelder statt abgeschnittener
   Texte. Kategorienamen und Badges brechen auf schmalen Bildschirmen sauber
   um.
7. **Baby-Kleidung, Entwurf:** zunächst nur als Mockup zur Abstimmung, danach
   nach Rückmeldung überarbeitet (Unterreiter „Hinzufügen“ und „Übersicht“).
8. **Baby-Kleidung, Umsetzung:** Kategorien mit Unterkategorien, Größen,
   Muster, Farbe, Foto. Soll/Ist-Balken je Unterkategorie mit einstellbaren
   Zielen, Sammlung nach Größe gruppiert. Fotos werden im Browser auf ca.
   480 px komprimiert und direkt in Firestore gespeichert, weil Cloud Storage
   im Spark-Tarif nicht verfügbar ist. Dabei behoben: ein falsch
   dimensioniertes Symbol und ein CSS-Fehler, durch den beide Ansichten
   gleichzeitig sichtbar blieben. Die Firestore-Regeln wurden auf die neuen
   Unterkollektionen erweitert.
9. **Fehler „Missing or insufficient permissions“:** Die erweiterten Regeln
   waren nicht hochgeladen, weil nur `--only hosting` deployt wurde. Behoben
   durch ein vollständiges `firebase deploy`.
10. **Kleidungsstücke bearbeiten:** Stift-Symbol öffnet das Formular
    vorausgefüllt („Änderungen speichern“ / „Abbrechen“).
