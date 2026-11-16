/* JobShathi service worker.
   - The app opens offline: the page and its icons are saved on first visit.
   - Online, the newest page and jobs.json always come from the network.
   - On a slow connection the saved page is shown after SLOW_MS instead of a blank screen,
     and the newest one is saved in the background for the next visit.
   Every path is relative, so the site can move to another address (a custom domain)
   without any change here. */
// v4: a page other than the app (an opened jobs.json, say) could have been saved as the app under v3;
// the new name clears that old cache once.
const CACHE = 'jobshathi-v4';
const SLOW_MS = 3500;
// '__WORKER_URL__' is replaced by build.py with this build's worker address (worker.js?v=...).
const SHELL = ['index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', '__WORKER_URL__'];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });

/* Which saved copy answers a request. The app is saved under one name only (index.html), whatever was
   added to its address (a link shared on LinkedIn carries ?utm_source=...): offline, the newest app is
   always the one shown. Only the app's own address counts as the app: any other page opened in the
   browser (the Privacy page, About, or a file like jobs.json) is saved under its own address, without
   the part after "?", so it can never take the app's place. */
function savedName(req) {
  const url = new URL(req.url), home = new URL(self.registration.scope);
  if (req.mode !== 'navigate') return req;
  if (url.pathname === home.pathname || url.pathname === home.pathname + 'index.html') return new URL('index.html', home).href;
  return url.origin + url.pathname;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (/\/version\.json$/.test(new URL(req.url).pathname)) return; // always straight from the network, never saved
  const isPage = req.mode === 'navigate';
  const key = savedName(req);

  // always ask the network, and keep a copy of every good answer. When the answer is the very file
  // already saved (the same ETag: jobs.json that has not changed), it is not written again.
  const keep = res => caches.open(CACHE).then(c => c.match(key).then(old => {
    const tag = res.headers.get('etag');
    if (!(tag && old && old.headers.get('etag') === tag)) return c.put(key, res);
  })).catch(() => {});
  const fresh = fetch(req).then(res => {
    if (res.ok) keep(res.clone());
    return res;
  });
  const saved = () => caches.match(key);

  if (!isPage) { // jobs.json, icons, manifest: the network first, the saved copy when offline
    e.respondWith(fresh.catch(() => saved().then(hit => hit || Response.error())));
    return;
  }

  // a page (the app or another page): the network first, but never wait longer than SLOW_MS when a saved copy exists
  e.respondWith(new Promise(done => {
    let answered = false;
    const answer = res => { if (!answered && res) { answered = true; done(res); } };
    const timer = setTimeout(() => saved().then(answer), SLOW_MS);
    fresh.then(res => { clearTimeout(timer); answer(res); }, () => {
      clearTimeout(timer);
      saved().then(hit => answer(hit || Response.error()));
    });
  }));
  e.waitUntil(fresh.catch(() => {})); // let a slow download finish and be saved
});
