'use client';

import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
} from 'firebase/auth';

export async function signUpWithEmail(auth: Auth, email: string, password: string, displayName: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (userCredential.user) {
    await updateProfile(userCredential.user, { displayName });
  }
  return userCredential;
}

export async function signInWithEmail(auth: Auth, email: string, password: string) {
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle(auth: Auth) {
  const provider = new GoogleAuthProvider();
  // Use signInWithPopup for a more direct login flow, especially in desktop environments.
  await signInWithPopup(auth, provider);
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
