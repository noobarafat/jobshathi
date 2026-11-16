/* ───────── The job reader, away from the screen (a Web Worker) ─────────
   Reading every post (Engine.prepareJobs) takes a cheap phone several seconds. Done on the page, the
   screen froze for all of that time. Here it runs in a worker: the page stays usable and shows
   placeholder cards until the jobs arrive.

   build.py makes dist/worker.js from src/taxonomy.js, src/locations.js, src/engine.js and this file.

   Messages from the page:  { type: 'load', first: true|false }
   Messages to the page:    { type: 'begin', stamp, count, from: 'saved'|'network'|'stored', ... }
                            { type: 'chunk', jobs: [...] }  (a few at a time; the page answers { type: 'next' } after each)
                            { type: 'end' } · { type: 'same' } (the jobs on screen are the newest) · { type: 'failed' }

   Saved reading (part গ): a reading is kept in this browser (IndexedDB) under a key made of the job file's
   time stamp and size, today's date and this build's version. A key that matches means the same posts,
   read by the same rules on the same day: the reading is used as it is, with no work. Anything else
   (a new job file, a new day, a new dictionary or engine) and the posts are read again. */
const BUILD = '__APP_VERSION__';
const CHUNK = 150;
let shownKey = '', shownTag = '';
const post = m => self.postMessage(m);
const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };

/* ── the saved reading (IndexedDB): one record, replaced each time ── */
const DB = 'jobshathi', STORE = 'reading';
function openDb() {
  return new Promise((ok, no) => {
    if (!self.indexedDB) return no(new Error('no IndexedDB'));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => ok(req.result);
    req.onerror = () => no(req.error);
  });
}
async function readSaved(key) {
  try {
    const db = await openDb();
    return await new Promise(ok => {
      const r = db.transaction(STORE).objectStore(STORE).get('jobs');
      r.onsuccess = () => ok(r.result && r.result.key === key ? r.result.jobs : null);
      r.onerror = () => ok(null);
    });
  } catch { return null; }
}
async function keep(key, jobs) {
  try {
    const db = await openDb();
    db.transaction(STORE, 'readwrite').objectStore(STORE).put({ key, jobs }, 'jobs');
  } catch { /* private window or full storage: the posts are simply read again next time */ }
}

/** One job file (its text) → the jobs on the page. `tag` is the server's fingerprint of the file. */
async function use(text, from, tag) {
  let data;
  try { data = JSON.parse(text); } catch { return false; }
  const list = Array.isArray(data) ? data : data && data.jobs;
  if (!Array.isArray(list) || !list.length) return false;
  const stamp = (data && data.updatedAt) || '';
  const key = [stamp, list.length, today(), BUILD].join('|');
  if (key === shownKey) { shownTag = tag || shownTag; post({ type: 'same' }); return true; }
  const t0 = Date.now();
  let jobs = await readSaved(key), how = 'stored';
  if (!jobs) { jobs = Engine.prepareJobs(list); how = from; keep(key, jobs); }
  shownKey = key; shownTag = tag || '';
  post({ type: 'begin', stamp, count: jobs.length, from: how, ms: Date.now() - t0 });
  // one part at a time: the next goes only when the page has taken this one in ('next'), so the page
  // never has to take in several parts in one go
  for (let i = 0; i < jobs.length; i += CHUNK) { post({ type: 'chunk', jobs: jobs.slice(i, i + CHUNK) }); await taken(); }
  post({ type: 'end' });
  return true;
}
let release = null;
const taken = () => new Promise(ok => { release = ok; setTimeout(ok, 3000); });   // never stuck if the page stops answering

async function load(first) {
  let shown = false;
  if (first) { // the copy saved last time first: fast, and it works offline
    try { const hit = self.caches && await caches.match('jobs.json'); if (hit) shown = await use(await hit.text(), 'saved', hit.headers.get('etag') || ''); } catch { /* nothing saved yet */ }
  }
  try {
    // 'no-cache': the server is asked whether jobs.json changed; unchanged → "304", nothing is downloaded
    const res = await fetch('jobs.json', { cache: 'no-cache' });
    if (!res.ok) { if (!shown) post({ type: 'failed' }); return; }
    const tag = res.headers.get('etag') || '';
    if (tag && tag === shownTag) { post({ type: 'same' }); return; }   // the same file as on screen: not even read
    if (!(await use(await res.text(), 'network', tag)) && !shown) post({ type: 'failed' });
  } catch { if (!shown) post({ type: 'failed' }); }
}

self.onmessage = e => {
  const m = e.data || {};
  if (m.type === 'load') load(!!m.first);
  else if (m.type === 'next' && release) { const go = release; release = null; go(); }
};
