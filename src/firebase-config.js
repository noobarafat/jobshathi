/* ───────── Online accounts: Firebase project settings ─────────
   From the Firebase console: Project settings → Your apps → Web app → SDK setup and configuration → Config.
   These values are public by design; the Firestore rules (firestore.rules) keep each person's data private.
   Leave apiKey empty and the app keeps everything in this browser only, as before. */
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyB-pwMRlBowtuDchm2in54UrxCdmbCAJV0',
  authDomain: 'jobshathi-c8888.firebaseapp.com',
  projectId: 'jobshathi-c8888',
  storageBucket: 'jobshathi-c8888.firebasestorage.app',
  messagingSenderId: '665465369120',
  appId: '1:665465369120:web:7cc8d482316efe802a0245',
};

/* App Check (reCAPTCHA v3): proves a request comes from the real JobShathi site, not a script.
   This is the reCAPTCHA *site key*, which is public by design. The reCAPTCHA *secret key* is
   pasted into the Firebase console only and never appears here.
   Leave it empty and App Check stays off. */
const APP_CHECK_SITE_KEY = '';
