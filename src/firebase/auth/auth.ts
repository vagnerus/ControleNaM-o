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
  sendEmailVerification,
} from 'firebase/auth';
import { Firestore, doc, setDoc } from 'firebase/firestore';

export async function signUpWithEmail(auth: Auth, firestore: Firestore, email: string, password: string, displayName: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (userCredential.user) {
    await updateProfile(userCredential.user, { displayName });
    
    // Create user document in Firestore
    // Security rules require 'id' field to match the document ID (user UID)
    await setDoc(doc(firestore, "users", userCredential.user.uid), {
      id: userCredential.user.uid,
      uid: userCredential.user.uid,
      email: email,
      displayName: displayName,
      createdAt: new Date(),
      photoURL: userCredential.user.photoURL || null,
      role: 'user',
    });
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
    // After updating, send a verification email to the new address
    await sendEmailVerification(auth.currentUser);
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
