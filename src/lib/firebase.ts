import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { logAuthDebug } from '../utils/authDebug.ts';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const authReady = setPersistence(auth, browserLocalPersistence)
  .then(() => auth.authStateReady())
  .then(() => {
    logAuthDebug('AUTH_INIT');
  })
  .catch((err) => {
    console.error('AUTH_INIT failed:', err);
  });

export const googleAuthProvider = new GoogleAuthProvider();
export default auth;
