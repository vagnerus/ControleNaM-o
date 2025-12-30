'use client';

import { FirebaseStorage, getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { useFirebaseApp } from '@/firebase';

/**
 * Custom hook to get an initialized Firebase Storage instance.
 * @returns {FirebaseStorage} The Firebase Storage instance.
 */
export const useStorage = (): FirebaseStorage => {
  const app = useFirebaseApp();
  return getStorage(app);
};

/**
 * Uploads a file to a user-specific folder in Firebase Storage.
 * @param storage The Firebase Storage instance.
 * @param userId The ID of the user.
 * @param file The file to upload.
 * @returns {Promise<string>} A promise that resolves with the download URL of the uploaded file.
 */
export const uploadAttachment = async (storage: FirebaseStorage, userId: string, file: File): Promise<string> => {
  if (!userId) {
    throw new Error('User must be authenticated to upload files.');
  }

  // Create a unique file name to avoid collisions
  const fileExtension = file.name.split('.').pop();
  const uniqueFileName = `${uuidv4()}.${fileExtension}`;
  
  // Create a reference to the file location
  const storageRef = ref(storage, `users/${userId}/attachments/${uniqueFileName}`);

  try {
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    // Here you could add more specific error handling or re-throw
    throw new Error('Failed to upload file.');
  }
};
