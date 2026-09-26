# 🪺 Unser Nest ("Our Nest")

*[🇩🇪 Deutsche Version hier](README.md)*

A private, shared web app for parents-to-be: a checklist for the time before
and after the birth, an inventory of baby clothes, a shared list of baby
names and a contraction timer. The app syncs in real time between your
devices, works offline, can be installed like an app on your phone and runs
entirely in **your own** [Firebase](https://firebase.google.com) project – on
the free plan, without a server of your own.

This documentation describes the complete setup from scratch to a working,
self-hosted instance – including access control, local development with the
Firebase emulator, tests and deployment.

> **Note:** This documentation and the code contain no personal data (no real
> names, email addresses, project IDs or credentials). All example values are
> made up or purely illustrative. Who has access is defined only in the file
> `firestore.rules`, which you create yourself from the template and which
> does not belong in the repository.
>
> The user interface is in German.

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Project structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Setup step 1: Create a Firebase project](#setup-step-1-create-a-firebase-project)
6. [Setup step 2: Google sign-in and test users](#setup-step-2-google-sign-in-and-test-users)
7. [Setup step 3: Firestore database and web app](#setup-step-3-firestore-database-and-web-app)
8. [Setup step 4: Create the access rules](#setup-step-4-create-the-access-rules)
9. [Setup step 5: Test locally with the emulator](#setup-step-5-test-locally-with-the-emulator)
10. [Setup step 6: Deploy to Firebase Hosting](#setup-step-6-deploy-to-firebase-hosting)
11. [Upgrading from version 1](#upgrading-from-version-1)
12. [Configuration](#configuration)
13. [Tests](#tests)
14. [Data model reference](#data-model-reference)
15. [How the app works internally](#how-the-app-works-internally)
16. [Troubleshooting](#troubleshooting)
17. [Security and privacy](#security-and-privacy)
18. [License](#license)

---

## Features

| Area | Features |
|---|---|
| ✅ **Checklist** | 10 categories with 74 researched example items; per item a deadline, an appointment (optionally weekly), price, assignee (me / partner / both), notes, open questions and links; "done by … on …"; move, rename and delete items and categories (with undo); search and filters (my tasks, open questions, with date); **template packs** you can add at any time (detailed hospital bag, paperwork after the birth, postpartum, birth plan); printing |
| 🤰 **Pregnancy** | Current week of pregnancy from the due date (e.g. "SSW 32+0"), trimester bar, size comparison with fruit/vegetables; after the birth the baby's age |
| 📊 **Overview** | Tiles for open questions, appointments & deadlines (14 days or all) and budget (sum of all prices, done/open, your own budget goal); calendar export as `.ics` with a reminder the day before |
| 👕 **Baby clothes** | Items with category, size (50/56 to 86/92, one size), colour, pattern, quantity, photo, origin (bought/gift/borrowed/second-hand), "from whom" and "washed"; stock per size with your own targets; **season per size** based on the due date; target suggestions matching the season; **shopping list** "what's still missing" to copy/share; search, filters and photo zoom |
| 💕 **Names** | Shared list of names (girl/boy/neutral, meaning); each person rates on their own (favourite, like, rather not); the other person's rating only becomes visible after rating yourself; **matches** when both like a name; surname preview |
| ⏱️ **Birth** | **Contraction timer**, live on both devices, with an analysis of the last hour and a hint based on the common rule of thumb; important phone numbers with a call button; hospital bag progress from the checklist |
| 🔄 **Collaboration** | Real-time sync; simultaneous changes are **merged** instead of overwritten |
| 📴 **Offline & app** | Offline storage for data and app; installable as an app (Android, iPhone, desktop); deep links (`#checkliste`, `#kleidung`, `#namen`, `#geburt`) |
| 💾 **Backup** | Export as ZIP (CSV files, photos, full JSON) and restore from it |
| 🎨 **Appearance** | Light/dark theme (automatic or fixed), phone layout with bottom tab bar, tested in Chrome and Safari/WebKit |
| 🔒 **Access control** | Sign-in with Google only, and only for approved, verified addresses – enforced on the server |

---

## Tech stack

- **Frontend:** A single HTML file with HTML, CSS and JavaScript – **no build step, no framework**
- **Database:** [Cloud Firestore](https://firebase.google.com/docs/firestore) (real-time sync, offline cache)
- **Sign-in:** [Firebase Authentication](https://firebase.google.com/docs/auth) with Google accounts
- **Hosting:** [Firebase Hosting](https://firebase.google.com/docs/hosting) (serves the project configuration automatically at `/__/firebase/init.json`)
- **Offline/installation:** Service worker + web app manifest (PWA)
- **Libraries:** Firebase JS SDK 12 (compat build, via CDN) – no other dependencies
- **Tests:** Node.js test runner (`node --test`), no packages required
- **Local development:** [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)

---

## Project structure

```
.
├── public/                        # Everything that gets served
│   ├── index.html                 # The complete app (HTML, CSS, JavaScript)
│   ├── sw.js                      # Service worker (offline start of the app)
│   ├── manifest.webmanifest       # Web app manifest (installation, icons, shortcuts)
│   └── icons/                     # App icons (PNG, SVG, maskable, Apple touch)
├── tests/
│   └── helpers.test.js            # Tests for the pure helper functions (npm test)
├── firebase.json                  # Hosting (incl. headers), Firestore and emulator ports
├── firestore.rules.example        # Template for the access rules (→ firestore.rules)
├── firestore.indexes.json         # Firestore indexes (none needed)
├── .firebaserc.example            # Template for the project alias (→ .firebaserc)
├── package.json                   # npm scripts: test, start (emulator)
├── CHANGELOG.md                   # Change log (German)
├── README.md                      # German documentation
└── README.en.md                   # This documentation
```

> You create `firestore.rules` (your email addresses) and `.firebaserc` (your
> project ID) yourself from the `*.example` templates. Both are listed in
> `.gitignore` and do **not** belong in the repository.

Inside `public/index.html` the script is split into clearly commented
sections: configuration, icons, **pure helper functions** (no DOM, no
Firebase – read directly by the tests), templates, state, checklist, baby
clothes, names, birth, backup/restore, account menu, sign-in and start-up.
Code comments are in German.

---

## Prerequisites

- A Google account (for Firebase and for signing in to the app)
- [Node.js](https://nodejs.org) 20 or newer (for the Firebase CLI and the tests)
- The Firebase CLI: `npm install -g firebase-tools`
- For the local emulator additionally Java 11 or newer
- Git

Cost: usually €0 on the free **Spark plan**. No credit card required.

---

## Setup step 1: Create a Firebase project

1. Open [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. Choose a name (e.g. `unser-nest`). Google Analytics is not needed.
3. Note the **project ID** (project settings → "Project ID", e.g.
   `unser-nest-a1b2c`). You will need it in step 6.

---

## Setup step 2: Google sign-in and test users

1. Firebase console: **Build → Authentication → Get started**.
2. Tab **Sign-in method** → **Google** → enable → save.
3. Add test users so that really only you can sign in:
   - Open [console.cloud.google.com/auth/audience](https://console.cloud.google.com/auth/audience)
     (select the right project at the top; older interfaces call this the
     "OAuth consent screen").
   - Keep user type **External** and status **Testing**.
   - Under **Test users** → **+ Add users** → add the Google addresses of
     everyone who should use the app.

Access is therefore protected **twice**: only test users can sign in, and the
database additionally only accepts the verified addresses listed in
`firestore.rules` (step 4).

---

## Setup step 3: Firestore database and web app

1. Firebase console: **Build → Firestore Database → Create database**. Choose a
   location, e.g. `eur3 (europe-west)`. The start mode doesn't matter – your own
   rules are uploaded in step 6.
2. Gear icon → **Project settings** → **Your apps** → **</>** (Web) → choose a
   name → **Register app**. You do **not** need to copy the configuration
   snippet: Firebase Hosting serves it to the app automatically.

---

## Setup step 4: Create the access rules

```bash
git clone <URL-of-your-repository>
cd <repository-folder>
cp firestore.rules.example firestore.rules
```

In `firestore.rules`, replace the example addresses with the same addresses as
in step 2 (lower case):

```
request.auth.token.email in [
  "person-1@example.com",
  "person-2@example.com"
];
```

The rules allow access to `nest/shared` **and everything below it** – so all
areas of the app (clothes, names, contacts, contractions …) are covered
automatically. Everything else in the database is inaccessible to everyone.

> ⚠️ **Never** commit `firestore.rules` – it contains your addresses and is
> already listed in `.gitignore`.

---

## Setup step 5: Test locally with the emulator

With the Firebase Emulator Suite everything runs on your own machine – with
test accounts and test data, without touching a real project:

```bash
npm start      # = firebase emulators:start --project demo-unser-nest
```

Then open [http://127.0.0.1:5000](http://127.0.0.1:5000) → **Mit Google
anmelden** → **Add new account** → enter one of the addresses from
`firestore.rules`. The app recognises project IDs starting with `demo-` and
connects to the emulators automatically. The test database is shown at
[http://127.0.0.1:4000](http://127.0.0.1:4000).

To try two people working together, open a second browser window in private
mode and sign in with the second address.

---

## Setup step 6: Deploy to Firebase Hosting

```bash
firebase login
cp .firebaserc.example .firebaserc     # replace euer-firebase-projekt with your project ID
firebase deploy
```

The first deployment uploads **rules and app**. At the end you'll see the
**Hosting URL**, e.g. `https://unser-nest-a1b2c.web.app` – your private link.
Open it, sign in with Google, done. The example checklist is created on the
very first sign-in.

For later changes to the app this is enough:

```bash
firebase deploy --only hosting
```

> ⚠️ `--only hosting` does **not** upload the rules. After changing
> `firestore.rules`, run `firebase deploy --only firestore:rules` (or
> `firebase deploy`) once.

**Optionally test first:** a temporary preview URL with your real data while
the usual address stays unchanged:

```bash
firebase hosting:channel:deploy vorschau --expires 7d
```

**As an app on your phone:** open the link, then tap "Installieren" on
Android, or Share → "Add to Home Screen" on iPhone/iPad.

**Back to the previous version:** Firebase console → Hosting → release
history → "Rollback". Your data stays unchanged.

---

## Upgrading from version 1

Version 2 uses **the same database** and reads all data from version 1
(checklist, clothes, photos, targets, categories) without conversion. The
access rules don't need to change.

1. In version 1, click **"Sicherung herunterladen"** (download backup) and
   keep the ZIP file (version 2 can restore it via the account menu).
2. Copy the version 2 code into your existing project folder (your
   `firestore.rules` and `.firebaserc` stay as they are).
3. `firebase deploy --only hosting` – done.

Both versions also get along during the transition (e.g. an old browser tab
with version 1 still open). Details under
[How the app works internally](#compatibility-with-version-1).

---

## Configuration

You adjust the checklist, clothing categories, names and contacts directly in
the app – no code changes needed. The code only contains templates and fixed
lists, each near the top of the script in `public/index.html`:

| What | Where | Note |
|---|---|---|
| Checklist template | `defaultState()` | only applies to new installations |
| Template packs ("Aus Vorlage hinzufügen") | `TEMPLATE_PACKS` | can be added at any time, also to existing lists |
| Clothing categories | `DEFAULT_CLOTHING_CATEGORIES` | applies until first edited in the app |
| Clothing sizes | `CLOTHING_SIZES` | old size values are migrated via `LEGACY_SIZE_MIGRATION` |
| Age per size (for the season) | `SIZE_AGE_MONTHS` | guideline values in months from birth |
| Target suggestions | `suggestTargets()` | per size and season (warm/mild/cold) |
| Size comparison per week | `BABY_SIZE_BY_WEEK` | name, length, weight, symbol |
| Colours and design | CSS variables at the top of `<style>` | light and dark colour scheme |

After changes: `firebase deploy --only hosting`.

**Fonts:** Fonts are loaded from Google Fonts. If you'd rather not, host them
yourself or remove the `<link>` line in the `<head>` (system fonts are used
then).

**Service worker:** With every new release (especially a new Firebase version
in `index.html`) bump the `CACHE` name in `public/sw.js` – old files are then
cleaned up on the next start.

---

## Tests

```bash
npm test       # = node --test tests/*.test.js
```

The tests read the section **"REINE HILFSFUNKTIONEN"** (pure helper
functions) directly from `public/index.html` and check it with Node – without
a browser, without Firebase and without extra packages. Covered (22 tests):

- Merging simultaneous changes (fields, new/deleted/moved items, order,
  unknown fields, clothing categories)
- Compatibility with version 1 (restoring the new fields)
- Price parsing ("ca. 1.299,90 €", "50–80 €" …), week of pregnancy, baby's
  age, season per size, target suggestions
- Contraction analysis, calendar export (.ics, line folding per RFC 5545),
  CSV formula protection, writing/reading ZIP files (also compressed),
  Base64, escaping and safe links

The user interface itself is tried out with the emulator (step 5).

---

## Data model reference

All data lives under `nest/shared` – so a single rule is enough.

| Path | Purpose | Key fields |
|---|---|---|
| `nest/shared` | Checklist as **one** document | `dueDate`, `birthDate`, `budget`, `categories[]`, `schema`, `updatedAt` |
| `nest/shared/clothing/{id}` | One document per clothing item | `ober`, `unter`, `groesse`, `menge`, `farbe`, `muster`, `herkunft`, `von`, `gewaschen`, `photo`, `createdAt` |
| `nest/shared/clothingMeta/targets` | Clothing targets | key `"category\|subcategory\|size"` → count |
| `nest/shared/clothingMeta/categories` | Your own clothing categories | `categories[]` with `key`, `name`, `icon`, `subs[]` |
| `nest/shared/names/{id}` | Name ideas | `name`, `gender` (`w`/`m`/`n`), `note`, `votes` (per person `2`/`1`/`-1`) |
| `nest/shared/contacts/{id}` | Important phone numbers | `label`, `name`, `phone`, `order` |
| `nest/shared/contractions/{id}` | Contractions | `start`, `end` (milliseconds), `by` |
| `nest/shared/meta/members` | Signed-in people (for "assignee") | per user ID: `email`, `name` |
| `nest/shared/meta/checklistExtras` | Copy of the fields only version 2 knows | `items{}` with `wer`, `doneBy`, `doneAt`; `budget`, `birthDate` |

**Checklist categories** (`categories[]`): `id`, `name`, `icon`, `items[]`.
**Items** (`items[]`): `id`, `title`, `done`, `bisWann` (deadline), `wann`
(appointment), `wannRepeatWeekly`, `preis` (free text), `notizen` (notes),
`zuKlaeren` (open question), `links[]` (`label`, `url`), `wer` (user ID or
`"beide"`), `doneBy`, `doneAt`.

**Photos** are resized in the browser to about 480 px and stored as JPEG
(typically 20–60 KB) directly in the clothing item's document, because Cloud
Storage is not available on the free Spark plan. Since each item is its own
document, Firestore's 1 MB per-document limit is never reached.

---

## How the app works internally

### Merging simultaneous changes

The checklist and the clothing categories are each one shared document. The
app remembers the last common state and merges when saving (in a Firestore
transaction) and when receiving changes (three-way merge):

- Per field, whoever changed it wins.
- New items from both sides are kept; deletions and moves are applied.
- Only if both change **the same field** at the same time does your own
  input win.

Clothing items, targets, names, ratings, contacts and contractions are
separate documents or fields and never collide.

### Offline

Firestore also stores all data in the browser (IndexedDB), and the service
worker keeps the app itself available. Without a network the app starts from
the cache; changes are uploaded later. Offline, the interface is only
unlocked if exactly this account has been confirmed by the server on this
device before.

### Compatibility with version 1

- Version 2 shows all version 1 data unchanged and doesn't rewrite anything
  just by opening it.
- Version 1 shows version 2 data; it simply ignores new areas and fields.
- If version 1 saves the checklist, the assignee, done by/on, budget and
  birthday are missing afterwards. Version 2 detects such states by the
  missing `schema` field and restores the values automatically from
  `meta/checklistExtras`.

---

## Troubleshooting

**"Dieses Konto hat keinen Zugriff" (no access) although the address is listed**
The rules were probably not uploaded – `firebase deploy --only hosting` does
**not** include them. Run `firebase deploy` once and look for "released rules
firestore.rules" in the output. Also check the upper/lower case of the address.

**"Firebase-Konfiguration nicht gefunden" (configuration not found)**
The app wasn't opened via Firebase Hosting (e.g. `index.html` opened directly
as a file) or no web app is registered (step 3).

**"Not in a Firebase app directory"**
Run the command in the project folder – where `firebase.json` is.

**"No currently active project" or the deployment goes to the wrong project**
Create `.firebaserc` from the template or name the project explicitly:
`firebase deploy --only hosting --project your-project-id`.

**The sign-in window doesn't appear**
Disable the pop-up blocker for the site. On a preview URL, add the domain
under Authentication → Settings → Authorized domains if needed.

**The app shows an old version**
Reload once (on a phone, close the app completely and reopen it). Online, the
app always loads the latest version first; it only starts from the cache
without a connection. The version number is shown at the bottom of the page.

**"offline – wird später übertragen" although the internet works**
The database was briefly unreachable. Your changes are stored on the device
and will be uploaded automatically.

**Layout issues on iPhone/iPad (Safari)**
Safari computes some layouts differently from Chrome. The current version has
been checked with the Safari engine (WebKit); for new issues a screenshot
helps – and usually a fixed width instead of just `flex-basis`.

---

## Security and privacy

- **No servers of your own, no tracking.** All data lives in the Firebase
  project of the person who sets up the app.
- **Access is enforced on the server:** the Firestore rules only admit
  signed-in Google accounts with a **verified** address from the list in
  `firestore.rules`. This cannot be bypassed in the browser.
- **The project configuration (API key, project ID) is not a secret:** Firebase
  Hosting serves it publicly anyway. The data is protected by the rules – not
  by hiding the configuration. It is still deliberately kept out of the code.
- **Never commit:** `firestore.rules` (addresses), `.firebaserc` (project ID),
  backup ZIPs and calendar files – all listed in `.gitignore`.
- **Offline storage:** the data is also stored in the device's browser.
  "Abmelden" (sign out) in the account menu deletes it again (useful on other
  people's devices).
- **Input is escaped**, links are only rendered as `http(s)` (no
  `javascript:` links), CSV exports are protected against formulas.
- **Hosting headers:** `X-Content-Type-Options`, `Referrer-Policy` and
  `Permissions-Policy` are set in `firebase.json`.
- **Medical note:** the contraction timer reflects a common rule of thumb and
  is no substitute for medical advice. When in doubt, always call the delivery
  ward or your midwife.
- In OAuth "Testing" mode Google allows at most 100 test users – more than
  enough for a family.

---

## License

Private project. Add a license as needed (e.g. MIT) if the repository is to be
shared publicly.
