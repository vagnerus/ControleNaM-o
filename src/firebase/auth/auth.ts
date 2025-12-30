'use client';

import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithRedirect,
} from 'firebase/auth';

export async function signUpWithEmail(auth: Auth, email: string, password: string) {
  return await createUserWithEmailAndPassword(auth, email, password);
}

export async function signInWithEmail(auth: Auth, email: string, password: string) {
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle(auth: Auth) {
  const provider = new GoogleAuthProvider();
  // Use signInWithRedirect for a better experience on mobile and to avoid popup blockers.
  // The result is handled by onAuthStateChanged and getRedirectResult.
  await signInWithRedirect(auth, provider);
}
