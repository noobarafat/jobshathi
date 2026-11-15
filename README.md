# JobShathi (জবসাথী)

A free job-matching web app for job seekers in Bangladesh. People answer a few setup questions (name, optional mobile or email, fields, roles, skills, experience, education, areas) and see each day's job posts checked against their profile, with what fits and what is missing.

Live: https://noobarafat.github.io/jobshathi/

Built by **K. M. Arafat Islam**, founder and developer of JobShathi. [LinkedIn](https://www.linkedin.com/in/kmarafatislam/)

Plain HTML, CSS and JavaScript. No framework, no npm install.

## Files

```
src/index.html          page shell; each <!-- @inline name --> line is replaced by src/name
src/styles.css          all styles (light and dark)
src/taxonomy.js         fields, roles, synonyms, skills, education and experience levels
src/locations.js        8 divisions, 64 districts, areas of the big cities
src/i18n.js             all interface text, English and বাংলা: TEXT.key = ['English', 'বাংলা']
src/jobs-sample.js      example posts shown until jobs.json exists
src/engine.js           the matching engine
src/maker-photo.js      the maker's photo as a data URI, so the build stays one file
src/firebase-config.js  Firebase web app settings (public values)
src/cloud.js            Firebase sign-in and the users/{uid} document
src/app.js              the app: Store, pages, actions
pwa/                    manifest.webmanifest, sw.js, icons/ (install as an app)
build.py                builds dist/
firestore.rules         Firestore security rules
.github/workflows/pages.yml   builds and publishes dist/ to GitHub Pages on every push to main
.github/workflows/jobs.yml    the daily job robot, then publishes the site
robot/                  the job robot (see "The job robot" below)
```

## Build

```
python3 build.py
```

This writes `dist/`: one self-contained `index.html`, plus `manifest.webmanifest`, `sw.js` and `icons/`. If a `jobs.json` sits in the repo root it is copied too. Open `dist/index.html` through any static server, for example `python3 -m http.server -d dist`.

Every push to `main` runs the same build in GitHub Actions and publishes `dist/` to GitHub Pages.

## Test

```
python3 build.py && node tests/smoke.mjs
```

```
python3 -m unittest discover -s tests -p "test_*.py"
```

The unit tests cover the AI step and the company job-board readers. They never use the network: the Gemini service is replaced by `tests/fake_gemini.py`.

The smoke test checks that `dist/` is complete, that every script parses, that no secret is in the page, that the matching engine gives sensible results for three sample people, and that it can read the real `jobs.json`. Both workflows run it before publishing, so a build that fails is never deployed and a broken `jobs.json` is never committed.

Work happens on the `dev` branch. Only `main` is published, so nothing reaches the live site until `dev` is merged.

## Keys and secrets

| Key | Where it lives | Public? |
| --- | --- | --- |
| Firebase web config (`src/firebase-config.js`) | in the page | Yes, by design. It only names the project. `firestore.rules` and the key's website restriction protect the data. |
| Gemini API key | GitHub Actions Secrets only | No. Never in the repo or the page. |
| Firebase service account key | GitHub Actions Secrets only | No. Never in the repo or the page. |

`.gitignore` blocks the usual secret file names, and the smoke test fails if something that looks like a secret reaches the page.

## App Check

App Check (reCAPTCHA v3) proves that a request to Firestore comes from the real site and not from a script. It starts when `APP_CHECK_SITE_KEY` in `src/firebase-config.js` is filled in. The site key is public; the reCAPTCHA secret key is pasted into the Firebase console only.

Testing on your own computer (`http://localhost:8000`): reCAPTCHA does not know `localhost`, so the app asks Firebase for a debug token instead.

1. Open the local site, press F12, open the Console tab. A line shows `App Check debug token: xxxxxxxx-xxxx-...`.
2. Firebase console, App Check, Apps, the web app's three-dot menu, Manage debug tokens, Add debug token. Paste the token and save.
3. Reload the local site. The token is remembered by that browser.

A debug token lets its holder pass App Check, so treat it like a password: never commit it or share it. Delete it in the console when it is no longer needed.

## Sources and the pilot run

`robot/sources.json` lists every source with `enabled: true/false`, the AI settings (model names, posts per call, calls per run) and the places the robot deliberately does not read. The company job boards (SmartRecruiters, Lever, Freshteam, Trakstar Hire) are read by `robot/sources/ats.py`.

`robot/ai.py` is the AI step. It sends only posts that have never been through it, several per request, checks every value that comes back, asks once more for a post whose answer fails the check, and otherwise keeps the post with its basic fields. Links never come from the AI. The key is the GitHub Actions secret `GEMINI_API_KEY`.

`robot/pilot.py` is a trial run on a few posts. It never writes `jobs.json`. Push to the branch `pilot` (or press Run workflow on "Pilot run") and the report appears in `robot/pilot/report.md` on that branch. `python3 robot/pilot.py --fake-ai` runs it without a key, with a stand-in for the AI.

## Moving to a custom domain later

Every path in the site, the manifest and the service worker is relative, so the files need no change. What does need doing:

1. GitHub: repo Settings, Pages, Custom domain.
2. Firebase console: Authentication, Settings, Authorized domains: add the new domain.
3. Google Cloud console: the browser API key's website restrictions: add the new domain.
4. People who never connected Google keep their account only in the old address's browser storage. Ask them to connect Google before the move.

## Accounts and data

Finishing the setup questions creates the account in the person's name. Behind the scenes the app signs them in to Firebase anonymously, so there is no extra step.

Each person's data is one Firestore document, `users/{uid}`, with the fields `account`, `profile`, `marks` (saved, applied, dismissed jobs), `lang`, `theme` and `updatedAt`.

All storage goes through `Store` in `src/app.js`. Every change is written to localStorage at once (so the app opens instantly and works offline) and sent to Firestore a moment later. Changes made offline stay marked as waiting and are sent when the app is next online. When the app opens it compares the two copies and keeps the newer one.

"Continue with Google" (profile page, and "Already have an account?" on the welcome page) links the anonymous account to Google, so the same account opens on another phone or computer. "Delete my account" deletes the Firestore document and the Firebase user, then this browser's copy.

If the Firebase SDK cannot load (offline, blocked, or `apiKey` left empty in `src/firebase-config.js`), the app works exactly as before with this browser's storage only.

Firebase project: `jobshathi-c8888` (Spark plan). Authentication: Anonymous and Google, `noobarafat.github.io` in Authorized domains. Firestore: `asia-south1`, rules in `firestore.rules` (each signed-in user can read and write only their own `users/{uid}`, the document must have the app's shape and stay within size limits, and everything else is closed). To change the rules, paste `firestore.rules` into Firebase console, Firestore Database, Rules, and publish.

## jobs.json

The page uses `jobs.json` next to `index.html` when it exists, and the example posts otherwise. The file the robot writes is:

```
{ "updatedAt": "2026-11-11T06:10:00+06:00", "count": 412, "jobs": [ ... ] }
```

A plain list of posts also works. One post:

```
{ "id": "...", "title": "Accountant", "company": "...", "cat": "accounting",
  "loc": "Mirpur, Dhaka", "type": "full", "salary": "18000-25000", "exp": "1-3 years",
  "edu": "Bachelor", "age": "22-30", "req": "skills and requirements text",
  "postedAt": "2026-11-10", "deadline": "2026-11-25", "vacancies": 2,
  "source": "...", "url": "https://...", "logo": "...", "site": "...",
  "alsoOn": ["another source"] }
```

Only `title` is required. See the comment at the top of `src/jobs-sample.js` for every field.

`req` is never the full description: it holds only the keywords the matcher needs (skills, "freshers can apply", an age limit, "only females"), capped at 300 characters. The site always links to the original post.

## The job robot

`robot/` collects real posts every day and writes `jobs.json`.

```
robot/run.py              the run: collect, merge, clean up, write jobs.json + report.json
robot/fetcher.py          polite HTTP: robots.txt, one request per host per 2s, timeouts, caps
robot/normalise.py        Bangla dates and digits, the short req line, the money-asking filter
robot/structured.py       reads schema.org JobPosting data out of a page
robot/sources/            one reader per source
robot/companies.json      company career pages to read (add your own)
robot/classify.mjs        runs src/engine.js over jobs.json and writes the matching report
robot/report.json         how the last run went
```

Run it by hand:

```
pip install -r robot/requirements.txt
python3 robot/run.py              # add --dry-run to leave jobs.json alone
node robot/classify.mjs
```

Useful flags: `--limit N` (new pages per source), `--only nextjobz|alljobs|remote|companies`.

### Where the posts come from

| Source | How | Why it is allowed |
| --- | --- | --- |
| NextJobz | `sitemap-job-details.xml`, then each job page's schema.org JobPosting | robots.txt allows the job pages and sitemaps |
| Alljobs by Teletalk | its public JSON API (government jobs) | no robots.txt and no terms restricting it |
| Jobicy, Remote OK, Himalayas | their public job APIs, entry-level roles open to Bangladesh | free APIs; each asks to be credited with a link back, which the site does |
| Company career pages | `robot/companies.json`, schema.org JobPosting only | the company's own site |

Deliberately **not** read: BDJobs (robots.txt blocks every robot), LinkedIn, Facebook, Skill.jobs (its terms forbid aggregating or linking to its content), Shomvob (its public site carries no listings; the jobs sit behind `/api/`, which its robots.txt disallows), and Remotive (its terms ask that its jobs are not passed to other job sites).

Every host's robots.txt is read again at run time and any disallowed path is skipped, so this stays true even if a site changes its rules.

### What each run does

1. Reads the existing `jobs.json` so pages already collected are not fetched again.
2. Collects from each source in turn. A source that fails is logged and the run carries on.
3. Drops posts whose deadline has passed, posts older than 30 days, and posts that ask candidates for money.
4. Merges the same job from two sources into one entry and lists the others in `alsoOn`.
5. Keeps the file under 3 MB, oldest posts first to go.
6. Runs the site's own engine over the result and writes `robot/report.json`.

`report.json` shows posts per source, what was removed, which requests failed, how many posts the matcher could not place, and the 50 most common titles it could not classify, each with a suggested line for `src/taxonomy.js`. The robot never edits `src/taxonomy.js` itself.

### Daily run

`.github/workflows/jobs.yml` runs at 23:37 UTC (about 5:37 AM in Dhaka; an odd minute off the hour, because GitHub queues scheduled runs and the top of the hour is busiest) and has a **Run workflow** button. It commits `jobs.json` and `robot/report.json` only when they changed, then rebuilds and publishes the site, because a push made with `GITHUB_TOKEN` does not start another workflow. It uses no secrets beyond the built-in `GITHUB_TOKEN`.
