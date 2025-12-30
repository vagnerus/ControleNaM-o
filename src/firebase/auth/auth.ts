'use client';

import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithRedirect,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
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

export async function updateUserEmail(auth: Auth, currentPasswordForReauth: string, newEmail: string) {
    if (!auth.currentUser) {
        throw new Error("Usuário não autenticado.");
    }
    
    // Re-authenticate the user
    const credential = EmailAuthProvider.credential(auth.currentUser.email!, currentPasswordForReauth);
    await reauthenticateWithCredential(auth.currentUser, credential);
    
    // Now update the email
    await updateEmail(auth.currentUser, newEmail);
}

export async function updateUserPassword(auth: Auth, currentPasswordForReauth: string, newPassword: string) {
    if (!auth.currentUser) {
        throw new Error("Usuário não autenticado.");
    }

    // Re-authenticate the user
    const credential = EmailAuthProvider.credential(auth.currentUser.email!, currentPasswordForReauth);
    await reauthenticateWithCredential(auth.currentUser, credential);
    
    // Now update the password
    await updatePassword(auth.currentUser, newPassword);
}
