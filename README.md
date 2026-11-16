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
node --test tests/engine.test.mjs
python3 -m unittest discover -s tests -p "test_*.py"
```

`tests/engine.test.mjs` covers the matching engine and its dictionaries: how titles, places, experience and skills are read (English and Bangla), and that reading every real post stays fast. The Python tests cover the robot's rules, the company job-board readers and the optional AI step. None of them uses the network: the Gemini service is replaced by `tests/fake_gemini.py`.

The smoke test checks that `dist/` is complete, that every script parses, that no secret is in the page, that the matching engine gives sensible results for three sample people, and that it can read the real `jobs.json`. Both workflows run it before publishing, so a build that fails is never deployed and a broken `jobs.json` is never committed.

Work happens on the `dev` branch. Only `main` is published, so nothing reaches the live site until `dev` is merged.

## Keys and secrets

| Key | Where it lives | Public? |
| --- | --- | --- |
| Firebase web config (`src/firebase-config.js`) | in the page | Yes, by design. It only names the project. `firestore.rules` and the key's website restriction protect the data. |
| Gemini API key (optional: the AI step is off, so none is needed) | GitHub Actions Secrets only | No. Never in the repo or the page. |
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

`robot/sources.json` lists every source with `enabled: true/false`, the places the robot deliberately does not read, and the settings of the optional AI step. Add or switch off a source there; no code changes. Switching a source off also removes its posts at the next run. The company job boards (SmartRecruiters, Lever, Freshteam, Trakstar Hire) are read by `robot/sources/ats.py`; a board's post stays for as long as the board lists it and is removed when the board removes it.

`robot/org-places.json` gives a place to government organisations that work from one place. Government circulars carry their place only inside a PDF, which the robot cannot read, and it never guesses one.

`robot/pilot.py` is a trial run on a few posts from the sources listed under `pilot` in `sources.json`. It never writes `jobs.json`. Push to the branch `pilot` (or press Run workflow on "Pilot run") and the report appears in `robot/pilot/report.md` on that branch: the sources, and for every sample post what is stored and how the matcher reads it.

### The AI step (off)

`robot/ai.py` can send new posts to Google Gemini for cleaner fields. It is switched off (`"ai": {"enabled": false}` in `sources.json`): it never runs, no key is read, and the workflows do not mention a secret. The matcher works with rules and dictionaries only.

To turn it on later:

1. Add the repository secret `GEMINI_API_KEY` (Settings, Secrets and variables, Actions).
2. In `.github/workflows/jobs.yml`, remove the `# ` in front of the `GEMINI_API_KEY` line.
3. Set `"enabled": true` in `robot/sources.json` (`"summaries": true` also asks for the English and Bangla summaries).

Step 2 cannot live in `sources.json`: GitHub only hands a secret to a step that names it, and editors warn about a named secret that does not exist yet.

When it runs, it sends only posts that have never been through it, several per request, checks every value that comes back, asks once more for a post whose answer fails the check, and otherwise keeps the post with its basic fields. Links never come from the AI. `python3 robot/pilot.py --fake-ai` exercises it with a stand-in service.

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

`req` is never the full description: it holds only the keywords the matcher needs (skills, "freshers can apply", an age limit, "only females"), capped at 300 characters, with the requirement signals always first so they are never the part that is cut. The site always links to the original post.

`edu` is one short line (at most 120 characters). `site` (the company website) is left out when the post has a logo, because the site uses the website only to find a logo.

### Download size

A phone downloads `jobs.json` compressed (GitHub Pages uses gzip level 5). The budget is 350 KB; every run's `report.json` has the real figure under `size`, and the daily run's summary shows it.

The app asks for `jobs.json` with `cache: 'no-cache'`: the browser asks GitHub Pages whether the file has changed since the copy it holds, and gets "304 Not Modified" (nothing downloaded) when it has not. A person who opens the app many times a day downloads the list only after a robot run. Offline, the copy saved by the service worker is shown.

## The job robot

`robot/` collects real posts every day and writes `jobs.json`.

```
robot/run.py              the run: collect, merge, clean up, write jobs.json + report.json
robot/sources.json        every source with its on/off switch (edit this, not the code)
robot/fetcher.py          polite HTTP: robots.txt, one request per host per 2s, timeouts, caps
robot/normalise.py        Bangla dates and digits, the short req line, the money-asking filter
robot/structured.py       reads schema.org JobPosting data out of a page
robot/sources/            one reader per source (ats.py: the company job boards)
robot/keywords.mjs        reads a post's full text with the site's own dictionary and returns the skills found
robot/org-places.json     the place of government organisations that work from one place
robot/companies.json      company career pages to read (add your own)
robot/classify.mjs        runs src/engine.js over jobs.json and writes the matching report
robot/report.json         how the last run went
robot/ai.py               the optional AI step (off)
robot/pilot.py            a trial run on a few posts
```

Run it by hand:

```
pip install -r robot/requirements.txt
python3 robot/run.py              # add --dry-run to leave jobs.json alone
node robot/classify.mjs
```

Useful flags: `--limit N` (new pages per source), `--only ID` (one source, by its id in `sources.json`), `--out FILE` (for testing: write the jobs to another file and leave `jobs.json` alone).

### Where the posts come from

| Source | How | Why it is allowed |
| --- | --- | --- |
| NextJobz | `sitemap-job-details.xml`, then each job page's schema.org JobPosting | robots.txt allows the job pages and sitemaps |
| Alljobs by Teletalk | its public JSON API (government jobs) | no robots.txt and no terms restricting it |
| Jobicy, Remote OK, Himalayas | their public job APIs, entry-level roles open to Bangladesh | free APIs; each asks to be credited with a link back, which the site does |
| Company career pages | `robot/companies.json`, schema.org JobPosting only | the company's own site |
| Company job boards on SmartRecruiters | the public career page, then each job page's schema.org data | the career site has no robots.txt rules |
| Company job boards on Lever | its public postings API | robots.txt: `Allow: /` |
| Company job boards on Freshteam | the careers page, then each job page's schema.org JobPosting | robots.txt: `Allow: /jobs` |
| Company job boards on Trakstar Hire | the board's own openings feed | robots.txt: `Allow: /` |

Deliberately **not** read: BDJobs (robots.txt blocks every robot), LinkedIn, Facebook, Skill.jobs (its terms forbid aggregating or linking to its content), Shomvob (its public site carries no listings; the jobs sit behind `/api/`, which its robots.txt disallows), Remotive (its terms ask that its jobs are not passed to other job sites), and the SmartRecruiters Posting API at `api.smartrecruiters.com` (that host's robots.txt disallows every robot; the public career pages carry the same posts). The same list is in `sources.json` under `notRead` and appears in every report.

Every host's robots.txt is read again at run time and any disallowed path is skipped, so this stays true even if a site changes its rules.

### What each run does

1. Reads the existing `jobs.json` so pages already collected are not fetched again.
2. Collects from each source that is switched on. A source that fails is logged and the run carries on.
3. Removes a company board's post once the board no longer lists it, and the posts of a source that was switched off.
4. Keywords: the site's own dictionary reads the requirements part of each new post's full text; the skills it finds go to the front of `req`. The experience and education sentences are lifted the same way. The text itself is never written to a file.
5. Gives a government post a place only from `org-places.json` or from a place the organisation's own name states.
6. Drops posts whose deadline has passed, posts older than 30 days (not company-board posts: those stay while listed), posts with no apply link, and posts that ask candidates for money.
7. Merges the same job from two sources into one entry and lists the others in `alsoOn`.
8. Slims every post (`slim` in `run.py`): an education field longer than 120 characters becomes a short line that gives the same education level, the skills only it named move into `req`, and the website is left out when there is a logo. The site's own engine then reads each changed post as it was and as it would be; a post whose reading would change in any way keeps its long field.
9. Keeps the file under 3 MB, oldest posts first to go.
10. Runs the site's own engine over the result and writes `robot/report.json`.

`report.json` shows every source (on or off, posts collected, jobs listed, any failure), what was removed, which requests failed, how many posts the matcher could not give a field, a role, a place, an experience level or a skill, and the 50 most common titles it could not classify, each with a suggested line for `src/taxonomy.js`. The robot never edits `src/taxonomy.js` itself.

### Daily run

`.github/workflows/jobs.yml` runs twice a day, at 23:37 UTC (5:37 AM in Dhaka) and 07:37 UTC (1:37 PM in Dhaka), and has a **Run workflow** button. The odd minute is on purpose: GitHub queues scheduled runs, and round times are the busiest. It runs every test, commits `jobs.json` and `robot/report.json` only when they changed, then rebuilds and publishes the site, because a push made with `GITHUB_TOKEN` does not start another workflow. It uses no secrets beyond the built-in `GITHUB_TOKEN`.
