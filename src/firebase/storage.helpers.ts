import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

/** The error code a cancelled task rejects with — a user action, not a failure. */
export const UPLOAD_CANCELED = 'storage/canceled';

export interface UploadHandle {
  /** Resolves with the download URL. Rejects on failure, or with `UPLOAD_CANCELED`. */
  result: Promise<string>;
  /** Aborts the transfer. Safe to call after the upload has already settled. */
  cancel: () => void;
}

/**
 * Uploads a file and reports real transfer progress.
 *
 * `onProgress` reports bytes only. The transfer can reach 1 a beat before
 * `getDownloadURL` resolves, so a caller that treats 1 as "finished" would be
 * claiming a URL it doesn't have yet — `useFileUpload` holds that last step in
 * a separate `finalizing` state rather than showing a full bar and lying.
 */
export const uploadFileResumable = (
  path: string,
  file: File,
  onProgress: (fraction: number) => void,
): UploadHandle => {
  const task = uploadBytesResumable(ref(storage, path), file);

  const result = new Promise<string>((resolve, reject) => {
    task.on(
      'state_changed',
      snapshot => {
        // A zero total would make this NaN and blank the bar; the caller falls
        // back to an indeterminate spinner while progress stays at 0.
        if (snapshot.totalBytes > 0) onProgress(snapshot.bytesTransferred / snapshot.totalBytes);
      },
      reject,
      () => getDownloadURL(task.snapshot.ref).then(resolve, reject),
    );
  });

  return {
    result,
    cancel: () => { task.cancel(); },
  };
};

export const deleteFile = (path: string) => deleteObject(ref(storage, path));

export const getStoragePath = {
  avatar:    (uid: string)         => `avatars/${uid}/profile.jpg`,
  workCover: (workId: string)      => `works/${workId}/cover.jpg`,
  artwork:   (userId: string, id: string) => `artworks/${userId}/${id}`,
};
