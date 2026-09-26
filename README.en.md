# 🪺 Unser Nest ("Our Nest")

*[🇩🇪 Deutsche Version hier verfügbar](README.md)*

A small [Firebase](https://firebase.google.com) web app for parents-to-be: a
shared checklist for the time before and after the birth, an inventory of
baby clothes, a shared list of baby names and a contraction timer. The app
syncs in real time between your devices, works offline and can be installed
like an app on your phone. [Cloud Firestore](https://firebase.google.com/docs/firestore)
is used as the database; sign-in works with Google accounts.

This documentation covers the complete setup process from scratch to a
running, self-hosted instance — including the access rules, local
development, and deployment.

> **Note:** This documentation and the accompanying code contain no personal
> data (no real names, email addresses, project IDs, or credentials). All
> example values are fictional or illustrative only. The user interface is in
> German.

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Project structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Setup step 1: Set up a Firebase project](#setup-step-1-set-up-a-firebase-project)
6. [Setup step 2: Create the access rules](#setup-step-2-create-the-access-rules)
7. [Setup step 3: Local development environment](#setup-step-3-local-development-environment)
8. [Setup step 4: Deploy to Firebase Hosting](#setup-step-4-deploy-to-firebase-hosting)
9. [Configuration](#configuration)
10. [Tests](#tests)
11. [Database schema reference](#database-schema-reference)
12. [Troubleshooting](#troubleshooting)
13. [Security notes](#security-notes)
14. [License](#license)

---

## Features

| Area | Features |
|---|---|
| ✅ **Checklist** | 10 categories with 74 researched example items; per item a deadline, an appointment (optionally weekly), price, assignee (me / partner / both), notes, open questions and links; "done by … on …"; move, rename and delete items and categories (with undo); search and filters; **template packs** you can add at any time (detailed hospital bag, paperwork after the birth, postpartum, birth plan); printing |
| 🤰 **Pregnancy** | Current week of pregnancy from the due date (e.g. "SSW 32+0"), trimester bar, size comparison with fruit/vegetables; after the birth the baby's age |
| 📊 **Overview** | Tiles for open questions, appointments & deadlines and budget (sum of all prices, done/open, your own budget goal); calendar export as `.ics` with a reminder the day before |
| 👕 **Baby clothes** | Items with category, size (50/56 to 86/92, one size), colour, pattern, quantity, photo, origin (bought/gift/borrowed/second-hand), "from whom" and "washed"; stock per size with your own targets; **season per size** based on the due date; target suggestions matching the season; **shopping list** "what's still missing"; search, filters and photo zoom |
| 💕 **Names** | Shared list of names (girl/boy/neutral, meaning); each person rates on their own; the other person's rating only becomes visible after rating yourself; **matches** when both like a name; surname preview |
| ⏱️ **Birth** | **Contraction timer**, live on both devices, with an analysis of the last hour; important phone numbers with a call button; hospital bag progress from the checklist |
| 🔄 **Collaboration** | Real-time sync; simultaneous changes are **merged** instead of overwritten |
| 📴 **Offline & app** | Offline storage for data and app; installable as an app (Android, iPhone, desktop) |
| 💾 **Backup** | Export as ZIP (CSV files, photos, full JSON) and restore from it |
| 🔒 **Access control** | Sign-in with Google only, and only for approved, verified addresses — enforced on the server |

---

## Tech stack

- **Frontend:** A single HTML file (HTML, CSS, JavaScript) — no build step, no framework
- **Database:** [Cloud Firestore](https://firebase.google.com/docs/firestore) (real-time sync, offline cache)
- **Sign-in:** [Firebase Authentication](https://firebase.google.com/docs/auth) with Google accounts
- **Hosting:** [Firebase Hosting](https://firebase.google.com/docs/hosting)
- **Offline/installation:** Service worker + web app manifest (PWA)
- **Libraries:** Firebase JS SDK 12 (compat build, via CDN) — no other dependencies
- **Tests:** Node.js test runner (`node --test`)
- **Local development:** [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)

---

## Project structure

```
.
├── public/                        # Everything that gets served
│   ├── index.html                 # The complete app (HTML, CSS, JavaScript)
│   ├── sw.js                      # Service worker (offline start)
│   ├── manifest.webmanifest       # Web app manifest (installation, icons)
│   └── icons/                     # App icons
├── tests/
│   └── helpers.test.js            # Tests for the pure helper functions
├── .devcontainer/
│   └── devcontainer.json          # Optional dev container configuration (VS Code/Codespaces)
├── firebase.json                  # Hosting (incl. headers), Firestore, emulator ports
├── firestore.rules.example        # Template for the access rules (see below)
├── firestore.indexes.json         # Firestore indexes (none needed)
├── .firebaserc.example            # Template for the project alias (see below)
├── package.json                   # npm scripts: test, start (emulator)
├── CHANGELOG.md                   # Change log (German)
├── README.md                      # German documentation
└── README.en.md                   # This documentation
```

> You create `firestore.rules` (your email addresses) and `.firebaserc` (your
> project ID) yourself from the `*.example` templates — both are listed in
> `.gitignore` and do **not** belong in the repository. Inside
> `public/index.html` the script is split into commented sections
> (configuration, pure helper functions, templates, checklist, baby clothes,
> names, birth, backup, sign-in). Code comments are in German.

---

## Prerequisites

- A Google account (for Firebase and for signing in to the app)
- [Node.js](https://nodejs.org) 20 or newer
- Java 21 or newer (only for the local emulator)
- Git

Cost: usually €0 on the free **Spark plan**, no credit card required.

---

## Setup step 1: Set up a Firebase project

1. Log in at [console.firebase.google.com](https://console.firebase.google.com)
   and choose **Add project**. Google Analytics is not needed.
2. **Build → Authentication → Get started** → tab **Sign-in method** → enable
   **Google**.
3. Add test users so that really only you can sign in: open
   [console.cloud.google.com/auth/audience](https://console.cloud.google.com/auth/audience)
   (called "OAuth consent screen" in older interfaces), keep user type
   **External** and status **Testing**, and add the Google addresses of
   everyone under **Test users**.
4. **Build → Firestore Database → Create database**, location e.g.
   `eur3 (europe-west)`. The start mode doesn't matter because your own rules
   are uploaded in step 4.
5. Gear icon → **Project settings** → **Your apps** → **</>** (Web) →
   **Register app**. You do **not** need to copy the configuration snippet:
   Firebase Hosting serves it to the app automatically at
   `/__/firebase/init.json`.
6. Note the **project ID** (project settings, e.g. `unser-nest-a1b2c`). You'll
   need it later in `.firebaserc`.

---

## Setup step 2: Create the access rules

Who may use the app is defined only in `firestore.rules`. The rules admit only
signed-in Google accounts with a **verified** address from the list and allow
access to `nest/shared` **and everything below it** — which covers all areas
of the app (checklist, clothes, names, contacts, contractions). Everything else
in the database is inaccessible to everyone.

Access is therefore protected twice: only test users can sign in (step 1), and
the database additionally checks every request against this list.

The template is copied to `firestore.rules` and filled with your addresses in
step 3.3.

### Appendix: Firestore rules

```
rules_version = '2';

// Template – copy to firestore.rules and replace the addresses below:
//   cp firestore.rules.example firestore.rules
//
// Only Google accounts with one of the email addresses listed below may read
// or write the shared data. Everything else is denied (including other
// signed-in Google accounts that know the app's URL).

service cloud.firestore {
  match /databases/{database}/documents {

    function isFamily() {
      return request.auth != null &&
        request.auth.token.email_verified == true &&
        request.auth.token.email in [
          "person-1@example.com",
          "person-2@example.com"
        ];
    }

    match /nest/{docId} {
      allow read, write: if isFamily();

      // Sub-collections (clothes, names, contacts, contractions …) are NOT
      // covered automatically in Firestore – this block gives the family
      // access to everything below, at any depth.
      match /{document=**} {
        allow read, write: if isFamily();
      }
    }

    // Everything else in this database is inaccessible to everyone.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

(The actual `firestore.rules.example` in the repository has German comments.)

---

## Setup step 3: Local development environment

### 3.1 Clone the repository

```bash
git clone <URL-of-your-repository>
cd <repository-folder>
```

### 3.2 Set up the Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 3.3 Configure rules and project

```bash
cp firestore.rules.example firestore.rules
cp .firebaserc.example .firebaserc
```

Then open `firestore.rules` and replace the example addresses with your Google
addresses (lower case, the same as the test users). In `.firebaserc`, replace
the placeholder `euer-firebase-projekt` with your project ID from step 1:

```json
{
  "projects": {
    "default": "unser-nest-a1b2c"
  }
}
```

> ⚠️ **Never** commit `firestore.rules` or `.firebaserc`! Both are already
> listed in `.gitignore` — as are backup ZIPs and calendar files you download
> from the app.

### 3.4 Run the app locally

```bash
npm start      # = firebase emulators:start --project demo-unser-nest
```

The app is then available at `http://127.0.0.1:5000`, the test database at
`http://127.0.0.1:4000`. To sign in: **Mit Google anmelden** → **Add new
account** → enter one of the addresses from `firestore.rules`. The app
recognises project IDs starting with `demo-` and connects to the emulators
automatically — your real project is not touched.

To try two people working together, open a second browser window in private
mode and sign in with the second address.

### 3.5 Optional: Dev container / GitHub Codespaces

The repository contains a `.devcontainer/devcontainer.json` for VS Code Dev
Containers or GitHub Codespaces. It sets up Node.js, Java and the Firebase CLI
and starts the emulator automatically.

> The app expects the emulator at `127.0.0.1`. This works when the container
> is opened in VS Code (locally or as a codespace in VS Code Desktop), because
> VS Code forwards the ports to your own machine. In the browser-only view of
> Codespaces the app cannot reach the emulator.

---

## Setup step 4: Deploy to Firebase Hosting

1. The first time, upload **rules and app**:
   ```bash
   firebase deploy
   ```
2. At the end you'll see the **Hosting URL**, e.g.
   `https://unser-nest-a1b2c.web.app` — your private link. The example
   checklist is created on the very first sign-in.
3. For later changes to the app this is enough:
   ```bash
   firebase deploy --only hosting
   ```

> ⚠️ `--only hosting` does **not** upload the rules. After changing
> `firestore.rules`, run `firebase deploy --only firestore:rules` once.

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

## Configuration

### Adjusting templates and lists

The checklist, clothing categories, names and contacts are edited directly in
the app — not in the code. The code only contains templates and fixed lists,
each near the top of the script in `public/index.html`:

| What | Where | Note |
|---|---|---|
| Checklist template | `defaultState()` | only applies to new installations |
| Template packs | `TEMPLATE_PACKS` | can be added in the app at any time ("Aus Vorlage hinzufügen") |
| Clothing categories | `DEFAULT_CLOTHING_CATEGORIES` | applies until first edited in the app |
| Clothing sizes | `CLOTHING_SIZES` | old size values are migrated via `LEGACY_SIZE_MIGRATION` |
| Age per size | `SIZE_AGE_MONTHS` | basis for the season per size |
| Target suggestions | `suggestTargets()` | per size and season (warm/mild/cold) |
| Size comparison per week | `BABY_SIZE_BY_WEEK` | name, length, weight, symbol |
| Colours | CSS variables at the top of `<style>` | light and dark colour scheme |

After changes: `firebase deploy --only hosting`.

### Adding or removing people

A new person has to be added in **two** places: as a test user (step 1,
item 3) and in `firestore.rules`. Then upload the rules:

```bash
firebase deploy --only firestore:rules
```

### Simultaneous changes (merging)

The checklist and the clothing categories are each one shared document. The
app remembers the last common state and merges when saving (in a Firestore
transaction) and when receiving changes: per field, whoever changed it wins;
new items from both sides are kept; deletions and moves are applied. Only if
both change **the same field** at the same time does your own input win.
Clothing items, targets, names, contacts and contractions are separate
documents or fields and never collide.

### Offline mode

Firestore also stores all data in the browser, and the service worker keeps
the app itself available. Without a network the app starts from the cache;
changes are uploaded later. Offline, the interface is only unlocked if exactly
this account has been confirmed by the server on this device before.
"Abmelden" (sign out) in the account menu deletes the offline storage again.

With every new release (especially a new Firebase version in `index.html`)
bump the `CACHE` name in `public/sw.js` — old files are then cleaned up on the
next start.

### Upgrading from version 1

Version 2 uses **the same database** and reads all version 1 data without
conversion; the access rules stay unchanged.

1. In version 1, click **"Sicherung herunterladen"** (download backup) and
   keep the ZIP file (version 2 can restore it via the account menu).
2. Copy the version 2 code into your existing project folder —
   `firestore.rules` and `.firebaserc` stay as they are.
3. `firebase deploy --only hosting`.

Both versions also get along during the transition: if a still-open version 1
window saves the checklist, the fields only version 2 knows (assignee, done
by/on, budget, birthday) are missing afterwards. Version 2 detects such states
by the missing `schema` field and restores the values automatically from
`nest/shared/meta/checklistExtras`.

### Fonts

Fonts are loaded from Google Fonts. If you'd rather not, host them yourself
or remove the `<link>` line in the `<head>` of `index.html` (system fonts are
used then).

---

## Tests

```bash
npm test       # = node --test tests/*.test.js
```

The tests read the section "REINE HILFSFUNKTIONEN" (pure helper functions)
directly from `public/index.html` and check it with Node — without a browser,
without Firebase and without extra packages, so no credentials are needed.
The 22 tests cover merging simultaneous changes, compatibility with
version 1, price parsing, week of pregnancy, season per size, target
suggestions, contraction analysis, calendar export, CSV protection, and
writing and reading ZIP files. The user interface itself is tried out with
the emulator (step 3.4).

---

## Database schema reference

| Path | Purpose | Key fields |
|---|---|---|
| `nest/shared` | Checklist as **one** document | `dueDate`, `birthDate`, `budget`, `categories[]`, `schema`, `updatedAt` |
| `nest/shared/clothing/{id}` | One document per clothing item | `ober`, `unter`, `groesse`, `menge`, `farbe`, `muster`, `herkunft`, `von`, `gewaschen`, `photo` |
| `nest/shared/clothingMeta/targets` | Clothing targets | key `category\|subcategory\|size` → count |
| `nest/shared/clothingMeta/categories` | Your own clothing categories | `categories[]` with `key`, `name`, `icon`, `subs[]` |
| `nest/shared/names/{id}` | Name ideas | `name`, `gender` (`w`/`m`/`n`), `note`, `votes` (per person `2`/`1`/`-1`) |
| `nest/shared/contacts/{id}` | Important phone numbers | `label`, `name`, `phone`, `order` |
| `nest/shared/contractions/{id}` | Contractions | `start`, `end` (milliseconds), `by` |
| `nest/shared/meta/members` | Signed-in people (for "assignee") | per user ID: `email`, `name` |
| `nest/shared/meta/checklistExtras` | Copy of the fields only version 2 knows | `items{}` with `wer`, `doneBy`, `doneAt`; `budget`, `birthDate` |

Checklist items (`categories[].items[]`) have the fields `id`, `title`,
`done`, `bisWann` (deadline), `wann` (appointment), `wannRepeatWeekly`,
`preis` (free text), `notizen` (notes), `zuKlaeren` (open question), `links[]`
(`label`, `url`), `wer` (user ID or `"beide"`), `doneBy` and `doneAt`.

Photos are resized in the browser to about 480 px and stored as JPEG
(typically 20–60 KB) directly in the clothing item's document, because Cloud
Storage is not available on the free Spark plan. Since each item is its own
document, Firestore's 1 MB per-document limit is never reached.

---

## Troubleshooting

**"Dieses Konto hat keinen Zugriff" (no access) although the address is listed**
The rules were probably not uploaded — `firebase deploy --only hosting` does
**not** include them. Run `firebase deploy` once and look for "released rules
firestore.rules" in the output. Also check the upper/lower case of the address.

**"Firebase-Konfiguration nicht gefunden" (configuration not found)**
The app wasn't opened via Firebase Hosting (e.g. `index.html` opened directly
as a file) or no web app is registered (step 1, item 5).

**"Not in a Firebase app directory"**
Run the command in the project folder — where `firebase.json` is.

**"No currently active project" or the deployment goes to the wrong project**
Create `.firebaserc` from the template (step 3.3) or name the project
explicitly: `firebase deploy --only hosting --project your-project-id`.

**The sign-in window doesn't appear**
Disable the pop-up blocker for the site. On a preview URL, add the domain
under Authentication → Settings → Authorized domains if needed.

**The app shows an old version**
Reload once (on a phone, close the app completely and reopen it). Online, the
app always loads the latest version first; the version number is shown at
the bottom of the page.

**"offline – wird später übertragen" although the internet works**
The database was briefly unreachable. Your changes are stored on the device
and will be uploaded automatically.

**Layout issues on iPhone/iPad (Safari)**
Safari computes some layouts differently from Chrome. The current version has
been checked with the Safari engine (WebKit); for new issues a screenshot
helps — and usually a fixed width instead of just `flex-basis`.

---

## Security notes

- No servers of your own and no tracking: all data lives in the Firebase
  project of the person who sets up the app.
- Access is enforced **on the server** by the Firestore rules (only verified
  addresses from `firestore.rules`) and cannot be bypassed in the browser.
- With Firebase, the project configuration (API key, project ID) is not a
  secret — Firebase Hosting serves it publicly anyway. The data is protected
  by the rules, not by hiding the configuration. It is still deliberately kept
  out of the code.
- Never commit `firestore.rules`, `.firebaserc`, backup ZIPs or calendar files
  (all listed in `.gitignore`).
- The data is also stored in the device's browser (offline storage).
  "Abmelden" (sign out) in the account menu deletes it again — useful on other
  people's devices.
- Input is escaped before display, links are only rendered as `http(s)`, CSV
  exports are protected against formulas. Additional security headers are set
  in `firebase.json`.
- The contraction timer reflects a common rule of thumb and is no substitute
  for medical advice.
- In OAuth "Testing" mode Google allows at most 100 test users — more than
  enough for a family.

---

## License

Private project. Add a license as needed (e.g. MIT) if the repository is to be
shared publicly.
