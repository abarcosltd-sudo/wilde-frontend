import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

export const uploadFile = async (path: string, file: File): Promise<string> => {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
};

export const deleteFile = (path: string) => deleteObject(ref(storage, path));

export const getStoragePath = {
  avatar:    (uid: string)         => `avatars/${uid}/profile.jpg`,
  workCover: (workId: string)      => `works/${workId}/cover.jpg`,
  artwork:   (userId: string, id: string) => `artworks/${userId}/${id}`,
};
