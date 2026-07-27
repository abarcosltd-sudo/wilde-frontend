import { useCallback, useEffect, useRef, useState } from 'react';
import { uploadFileResumable, UploadHandle, UPLOAD_CANCELED } from '@/firebase/storage.helpers';
import { formatBytes } from '@/utils';

/**
 * - `idle`       nothing selected
 * - `uploading`  bytes are moving; `progress` is real
 * - `finalizing` every byte is transferred but the download URL isn't back yet
 * - `error`      failed or refused; `canRetry` says whether retrying the same
 *                file could plausibly work
 * - `done`       the URL has been handed to `onUploaded`
 */
export type UploadStatus = 'idle' | 'uploading' | 'finalizing' | 'error' | 'done';

interface Options {
  /** Where the file is written. A function is re-read per attempt, for ids that appear late. */
  path: string | (() => string);
  /** Client-side ceiling. Storage rules enforce their own, but rejecting here costs no bandwidth. */
  maxBytes: number;
  /** MIME prefix, e.g. `image/`. */
  accept?: string;
  /** Human name for what is accepted, used in the rejection message. */
  acceptLabel?: string;
  onUploaded: (url: string) => void;
}

export interface FileUpload {
  status:     UploadStatus;
  /** 0–1 transfer fraction. Only meaningful while `uploading`. */
  progress:   number;
  /** Local object URL for the pending file — shown before a single byte lands. */
  previewUrl: string | null;
  fileName:   string | null;
  error:      string | null;
  /** False for a file that was refused outright: the same file will fail again. */
  canRetry:   boolean;
  /** True while bytes are in flight, so callers can block save and publish. */
  isBusy:     boolean;
  accept:     string;
  select:     (files: File[] | FileList | File | null | undefined) => void;
  retry:      () => void;
  cancel:     () => void;
  reset:      () => void;
}

/** Firebase codes carry more than "something went wrong", so they're worth translating. */
const messageForError = (err: unknown): string => {
  const code = (err as { code?: string } | null)?.code ?? '';
  switch (code) {
    case 'storage/unauthorized':
      return "You're not allowed to upload here. Try signing out and back in.";
    case 'storage/quota-exceeded':
      return 'Storage is full for this account. Contact support.';
    case 'storage/retry-limit-exceeded':
      return 'The upload kept timing out. Check your connection and try again.';
    default:
      // A blocked CORS preflight arrives as an opaque network failure, so the
      // console keeps the original for anyone debugging the bucket.
      return "That upload didn't go through. Check your connection and try again.";
  }
};

/**
 * Owns one upload: local preview, real progress, and a retained file so a
 * failure can be retried without asking the user to find it again.
 */
export const useFileUpload = ({
  path, maxBytes, accept = 'image/', acceptLabel = 'a JPG, PNG or WebP', onUploaded,
}: Options): FileUpload => {
  const [status, setStatus]         = useState<UploadStatus>('idle');
  const [progress, setProgress]     = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName]     = useState<string | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [canRetry, setCanRetry]     = useState(false);

  /** The file behind the current preview, kept so `retry` needs no new pick. */
  const pendingFile = useRef<File | null>(null);
  const previewRef  = useRef<string | null>(null);
  const handleRef   = useRef<UploadHandle | null>(null);
  const mounted     = useRef(true);

  /**
   * Every attempt takes a ticket. A slow first upload that resolves after the
   * user has already picked a second file must not overwrite the second one's
   * preview, progress, or result.
   */
  const runId = useRef(0);

  const revokePreview = useCallback(() => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
  }, []);

  useEffect(() => () => {
    mounted.current = false;
    handleRef.current?.cancel();
    revokePreview();
  }, [revokePreview]);

  const showPreview = useCallback((file: File) => {
    revokePreview();
    const url = URL.createObjectURL(file);
    previewRef.current = url;
    setPreviewUrl(url);
    setFileName(file.name);
  }, [revokePreview]);

  const reset = useCallback(() => {
    runId.current += 1;
    handleRef.current?.cancel();
    handleRef.current = null;
    pendingFile.current = null;
    revokePreview();
    setPreviewUrl(null);
    setFileName(null);
    setError(null);
    setCanRetry(false);
    setProgress(0);
    setStatus('idle');
  }, [revokePreview]);

  const fail = useCallback((message: string, retryable: boolean) => {
    setError(message);
    setCanRetry(retryable);
    setStatus('error');
    setProgress(0);
  }, []);

  const start = useCallback((file: File) => {
    const ticket = ++runId.current;
    const isCurrent = () => mounted.current && runId.current === ticket;

    setError(null);
    setCanRetry(false);
    setProgress(0);
    setStatus('uploading');

    const target = typeof path === 'function' ? path() : path;
    const handle = uploadFileResumable(target, file, fraction => {
      if (!isCurrent()) return;
      setProgress(fraction);
      // The URL is still outstanding at this point, so the UI switches to
      // "finishing up" rather than claiming the upload is complete.
      if (fraction >= 1) setStatus('finalizing');
    });
    handleRef.current = handle;

    handle.result.then(
      url => {
        if (!isCurrent()) return;
        setProgress(1);
        setStatus('done');
        onUploaded(url);
      },
      err => {
        if (!isCurrent()) return;
        // A cancel is the user's own doing; `reset` has already cleared the UI.
        if ((err as { code?: string } | null)?.code === UPLOAD_CANCELED) return;
        console.error('Upload failed:', err);
        fail(messageForError(err), true);
      },
    );
  }, [path, onUploaded, fail]);

  const select: FileUpload['select'] = useCallback(input => {
    const files = input == null
      ? []
      : input instanceof File ? [input] : Array.from(input as FileList | File[]);
    const file = files[0];
    if (!file) return;

    // Abandon whatever was in flight before adopting the new choice.
    runId.current += 1;
    handleRef.current?.cancel();
    handleRef.current = null;

    if (!file.type.startsWith(accept)) {
      pendingFile.current = null;
      revokePreview();
      setPreviewUrl(null);
      setFileName(file.name);
      fail(`"${file.name}" isn't an image. Choose ${acceptLabel}.`, false);
      return;
    }

    // The preview goes up first: the user sees the right file was picked while
    // the bytes are still leaving, rather than staring at a spinner.
    pendingFile.current = file;
    showPreview(file);

    if (file.size > maxBytes) {
      fail(
        `That image is ${formatBytes(file.size)} — the limit is ${formatBytes(maxBytes)}. ` +
        'Choose a smaller one.',
        false,
      );
      return;
    }

    start(file);
  }, [accept, acceptLabel, maxBytes, fail, showPreview, start, revokePreview]);

  const retry = useCallback(() => {
    const file = pendingFile.current;
    if (!file) return;
    start(file);
  }, [start]);

  const cancel = useCallback(() => reset(), [reset]);

  return {
    status,
    progress,
    previewUrl,
    fileName,
    error,
    canRetry,
    isBusy: status === 'uploading' || status === 'finalizing',
    accept,
    select,
    retry,
    cancel,
    reset,
  };
};
