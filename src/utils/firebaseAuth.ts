import {
  signInWithPopup,
signOut,
onAuthStateChanged,
signInWithEmailAndPassword,
createUserWithEmailAndPassword,
updateProfile,
User,
} from 'firebase/auth';
import { auth, authReady, googleAuthProvider } from '../lib/firebase.ts';
import { logAuthDebug } from './authDebug.ts';
export { logAuthDebug };
export async function waitForAuthInit(): Promise<void> {
await authReady;
await auth.authStateReady();
}
export async function loginWithGoogle() {
await waitForAuthInit();
const result = await signInWithPopup(auth, googleAuthProvider);
return result.user;
}
export async function loginWithEmail(email: string, password: string) {
await waitForAuthInit();
const credential = await signInWithEmailAndPassword(auth, email, password);
return credential.user;
}
export async function signUpWithEmail(email: string, password: string, displayName?: string) {
await waitForAuthInit();
const credential = await createUserWithEmailAndPassword(auth, email, password);
if (displayName?.trim()) {
await updateProfile(credential.user, { displayName: displayName.trim() });
  }
return credential.user;
}
export async function logoutUser() {
await waitForAuthInit();
await signOut(auth);
}
export async function getRestoredAuthUser(user?: User | null): Promise<User | null> {
await waitForAuthInit();
if (user) {
return user;
  }
return auth.currentUser;
}
export async function getAuthToken(user?: User | null): Promise<string | null> {
  // Check for bypass token in localStorage first
  const bypassToken = localStorage.getItem('bypassToken');
  if (bypassToken) {
    return bypassToken;
  }

  const tokenUser = await getRestoredAuthUser(user);
  if (!tokenUser) {
    return null;
  }
  try {
    const token = await tokenUser.getIdToken();
    logAuthDebug('TOKEN_GENERATED', { uid: tokenUser.uid });
    return token;
  } catch (e) {
    console.error('Error fetching Firebase ID token:', e);
  }
  return null;
}
export { onAuthStateChanged };
export type { User };