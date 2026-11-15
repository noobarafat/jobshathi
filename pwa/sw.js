/* JobShathi service worker.
   - The app opens offline: the page and its icons are saved on first visit.
   - Online, the newest page and jobs.json always come from the network.
   - On a slow connection the saved page is shown after SLOW_MS instead of a blank screen,
     and the newest one is saved in the background for the next visit.
   Every path is relative, so the site can move to another address (a custom domain)
   without any change here. */
const CACHE = 'jobshathi-v3';
const SLOW_MS = 3500;
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === 'navigate';

  // always ask the network, and keep a copy of every good answer
  const fresh = fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  });
  const saved = () => caches.match(req, { ignoreSearch: isPage }).then(hit => hit || (isPage ? caches.match('index.html') : undefined));

  if (!isPage) { // jobs.json, icons, manifest: the network first, the saved copy when offline
    e.respondWith(fresh.catch(() => saved().then(hit => hit || Response.error())));
    return;
  }

  // the page itself: the network first, but never wait longer than SLOW_MS when a saved copy exists
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
