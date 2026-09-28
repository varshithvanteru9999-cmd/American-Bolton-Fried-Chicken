// Firebase initialization + social auth providers.
// Credentials are read from .env (Vite exposes vars prefixed with VITE_).
// Until real keys are added the app falls back to a simulated sign-in,
// so the demo keeps working.
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Considered configured only when the essential keys are present
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId
);

let auth = null;
let db = null;
if (isFirebaseConfigured) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app); // Cloud Firestore — stores user profile + orders
  // Keep the user signed in across reloads/sessions
  setPersistence(auth, browserLocalPersistence).catch(() => {});
}
export { auth, db };

// Returns a fresh provider instance for the given key
export const getProvider = (key) => {
  switch (key) {
    case 'google': {
      const p = new GoogleAuthProvider();
      p.addScope('email');
      p.addScope('profile');
      return p;
    }
    default:
      return null;
  }
};
