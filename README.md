# JobShathi (জবসাথী)

A free job-matching web app for job seekers in Bangladesh. People answer a few setup questions (name, optional mobile or email, fields, roles, skills, experience, education, areas) and see each day's job posts checked against their profile, with what fits and what is missing.

Live: https://noobarafat.github.io/jobshathi/

Plain HTML, CSS and JavaScript. No framework, no npm install.

## Files

```
src/index.html          page shell; each <!-- @inline name --> line is replaced by src/name
src/styles.css          all styles (light and dark)
src/data.js             fields, roles, skills, education and experience levels, places
src/i18n.js             all interface text, English and বাংলা: TEXT.key = ['English', 'বাংলা']
src/jobs-sample.js      example posts shown until jobs.json exists
src/engine.js           the matching engine
src/firebase-config.js  Firebase web app settings (public values)
src/cloud.js            Firebase sign-in and the users/{uid} document
src/app.js              the app: Store, pages, actions
pwa/                    manifest.webmanifest, sw.js, icons/ (install as an app)
build.py                builds dist/
firestore.rules         Firestore security rules
.github/workflows/pages.yml   builds and publishes dist/ to GitHub Pages on every push to main
```

## Build

```
python3 build.py
```

This writes `dist/`: one self-contained `index.html`, plus `manifest.webmanifest`, `sw.js` and `icons/`. If a `jobs.json` sits in the repo root it is copied too. Open `dist/index.html` through any static server, for example `python3 -m http.server -d dist`.

Every push to `main` runs the same build in GitHub Actions and publishes `dist/` to GitHub Pages.

## Accounts and data

Finishing the setup questions creates the account in the person's name. Behind the scenes the app signs them in to Firebase anonymously, so there is no extra step.

Each person's data is one Firestore document, `users/{uid}`, with the fields `account`, `profile`, `marks` (saved, applied, dismissed jobs), `lang`, `theme` and `updatedAt`.

All storage goes through `Store` in `src/app.js`. Every change is written to localStorage at once (so the app opens instantly and works offline) and sent to Firestore a moment later. Changes made offline stay marked as waiting and are sent when the app is next online. When the app opens it compares the two copies and keeps the newer one.

"Continue with Google" (profile page, and "Already have an account?" on the welcome page) links the anonymous account to Google, so the same account opens on another phone or computer. "Delete my account" deletes the Firestore document and the Firebase user, then this browser's copy.

If the Firebase SDK cannot load (offline, blocked, or `apiKey` left empty in `src/firebase-config.js`), the app works exactly as before with this browser's storage only.

Firebase project: `jobshathi-c8888` (Spark plan). Authentication: Anonymous and Google, `noobarafat.github.io` in Authorized domains. Firestore: `asia-south1`, rules in `firestore.rules` (each signed-in user can read and write only their own `users/{uid}`). To change the rules, paste `firestore.rules` into Firebase console, Firestore Database, Rules, and publish.

## jobs.json

The page uses `jobs.json` next to `index.html` when it exists, and the example posts otherwise. The file is either a list of posts or `{ "jobs": [ ... ] }`. One post:

```
{ "id": "...", "title": "Accountant", "company": "...", "cat": "accounting",
  "loc": "Mirpur, Dhaka", "type": "full", "salary": "18000-25000", "exp": "1-3 years",
  "edu": "Bachelor", "age": "22-30", "req": "skills and requirements text",
  "postedAt": "2026-11-10", "deadline": "2026-11-25", "vacancies": 2,
  "source": "...", "url": "https://..." }
```

Only `title` is required. See the comment at the top of `src/jobs-sample.js` for every field.

Later a daily GitHub Actions robot will write `jobs.json` from job portals that allow robots.
