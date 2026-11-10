/* ───────── Online accounts: Firebase sign-in and the users/{uid} document ─────────
   The Firebase SDK comes from Google's CDN as ES modules, loaded only when the page runs, so the
   single-file build stays one file. If it cannot load (offline, blocked, no config) every call
   reports `ok: false` and the app carries on with the copy kept in this browser. */
const Cloud = (() => {
  const SDK = 'https://www.gstatic.com/firebasejs/12.19.0/';
  const FIELDS = ['account', 'profile', 'marks', 'lang', 'theme', 'updatedAt'];
  let fb = null, auth = null, db = null, starting = null;
  let status = 'off'; // off → loading → ready | failed

  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('timeout')), ms))]);
  const failure = e => ({ ok: false, code: (e && e.code) || (e && e.message) || 'unknown', error: e });

  /** Loads the SDK and waits until Firebase knows who is signed in. Safe to call again after a failure. */
  function start() {
    if (status === 'ready') return Promise.resolve(true);
    if (starting) return starting;
    if (!FIREBASE_CONFIG.apiKey || typeof window === 'undefined') { status = 'failed'; return Promise.resolve(false); }
    status = 'loading';
    starting = (async () => {
      try {
        const [app, a, f] = await withTimeout(Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-firestore.js')]), 15000);
        fb = { ...a, ...f };
        const firebaseApp = app.initializeApp(FIREBASE_CONFIG);
        auth = a.getAuth(firebaseApp);
        db = f.initializeFirestore(firebaseApp, { ignoreUndefinedProperties: true });
        await withTimeout(auth.authStateReady ? auth.authStateReady() : new Promise(ok => { const off = a.onAuthStateChanged(auth, () => { off(); ok(); }); }), 10000);
        status = 'ready';
        return true;
      } catch (e) {
        status = 'failed'; fb = auth = db = null;
        if (window.console) console.warn('JobShathi: online accounts unavailable, using this browser only.', e);
        return false;
      } finally { starting = null; }
    })();
    return starting;
  }

  const ready = () => status === 'ready';
  const user = () => (ready() ? auth.currentUser : null);
  const googleEmail = u => { const g = u && u.providerData.find(p => p.providerId === 'google.com'); return g ? g.email || (u.email || '') : ''; };
  const ref = uid => fb.doc(db, 'users', uid);
  const google = () => { const p = new fb.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' }); return p; };
  const pick = data => { const out = {}; FIELDS.forEach(k => { out[k] = data[k] === undefined ? null : data[k]; }); return out; };

  /** A signed-in user for a new account: the current one, else a fresh anonymous one. */
  async function ensureUser() {
    if (!ready()) return { ok: false, code: 'unavailable' };
    try { return { ok: true, user: auth.currentUser || (await fb.signInAnonymously(auth)).user }; } catch (e) { return failure(e); }
  }

  /** users/{uid}, or null when it does not exist. */
  async function load(uid) {
    if (!ready()) return { ok: false, code: 'unavailable' };
    try { const snap = await withTimeout(fb.getDoc(ref(uid)), 12000); return { ok: true, data: snap.exists() ? snap.data() : null }; } catch (e) { return failure(e); }
  }

  /** Writes the whole document (no merge, so removed saved jobs stay removed). */
  async function save(uid, data) {
    if (!ready()) return { ok: false, code: 'unavailable' };
    try { await fb.setDoc(ref(uid), pick(data)); return { ok: true }; } catch (e) { return failure(e); }
  }

  /** "Already have an account?": sign in with Google. Must run straight from a tap so the pop-up is allowed. */
  async function signInGoogle() {
    if (!ready()) return { ok: false, code: 'unavailable' };
    try { return { ok: true, user: (await fb.signInWithPopup(auth, google())).user }; } catch (e) { return failure(e); }
  }

  /** Adds Google to the current anonymous account, so the same account opens on any device.
      If that Google account already has its own JobShathi account, the temporary anonymous one is
      removed and that account is signed in instead (`switched`). */
  async function linkGoogle() {
    if (!ready()) return { ok: false, code: 'unavailable' };
    const current = auth.currentUser;
    if (!current) return signInGoogle();
    try { return { ok: true, user: (await fb.linkWithPopup(current, google())).user }; } catch (e) {
      if (e && (e.code === 'auth/credential-already-in-use' || e.code === 'auth/email-already-in-use')) {
        const cred = fb.GoogleAuthProvider.credentialFromError(e);
        if (!cred) return failure(e);
        try {
          if (current.isAnonymous) { try { await fb.deleteDoc(ref(current.uid)); await fb.deleteUser(current); } catch { /* left for Firebase to clean up */ } }
          return { ok: true, switched: true, user: (await fb.signInWithCredential(auth, cred)).user };
        } catch (e2) { return failure(e2); }
      }
      return failure(e);
    }
  }

  /** Deletes users/{uid} and then the Firebase user. Google users who signed in long ago are asked to confirm (code auth/requires-recent-login). */
  async function removeAccount(confirmWithGoogle) {
    if (!ready()) return { ok: false, code: 'unavailable' };
    const u = auth.currentUser;
    if (!u) return { ok: true };
    try {
      if (confirmWithGoogle) await fb.reauthenticateWithPopup(u, google());
      if (!navigator.onLine) return { ok: false, code: 'offline' };
      await withTimeout(fb.deleteDoc(ref(u.uid)), 12000);
      await fb.deleteUser(u);
      return { ok: true };
    } catch (e) { return failure(e); }
  }

  async function signOut() { if (ready()) { try { await fb.signOut(auth); } catch { /* already out */ } } }

  return { start, ready, user, googleEmail, ensureUser, load, save, signInGoogle, linkGoogle, removeAccount, signOut, get status() { return status; } };
})();
