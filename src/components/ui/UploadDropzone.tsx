import React, { useRef, useState } from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import {
  imageOutline, cloudUploadOutline, closeOutline, refreshOutline, alertCircleOutline,
} from 'ionicons/icons';
import { useFileDrag, DragState } from '@/hooks/useFileDrag';
import { FileUpload } from '@/hooks/useFileUpload';

/**
 * A drop target that shows what is happening at every step: it reacts before
 * the file lands, previews the file straight away, reports real byte progress,
 * and keeps a failure on screen with a way to retry it.
 *
 * Motion is deliberately restrained. The pulsing highlight lives on an overlay
 * ring rather than the target itself — animating the target's own box moves its
 * edges under a stationary pointer and fires phantom drag events — and every
 * transform is `motion-safe` so a reduced-motion user still gets the colour and
 * border changes without anything moving.
 */

interface Props {
  upload: FileUpload;
  /** Names the thing being uploaded, e.g. "artwork". Used in labels and status text. */
  label: string;
  /** Already-uploaded image, shown when nothing newer is pending. */
  currentUrl?: string;
  /** Static line under the prompt, e.g. "PNG, JPG or WebP · up to 5MB". */
  hint?: string;
  /** Replaces "Uploaded" once the URL is in, for callers where a save still has to happen. */
  doneHint?: string;
  variant?: 'panel' | 'strip';
  /** Renders a remove control once there is something to remove. */
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Gold rather than ink: the highlight has to read against both a near-white and
 * a near-black surface, and ink is invisible on one of them by definition.
 */
const RING_BY_STATE: Record<DragState, string> = {
  over:   'ring-2 ring-gold-strong opacity-100 motion-safe:animate-drop-pulse',
  reject: 'ring-2 ring-red-400 opacity-100',
  armed:  'ring-2 ring-gold-strong/40 opacity-100',
  idle:   'ring-0 opacity-0',
};

const UploadDropzone: React.FC<Props> = ({
  upload, label, currentUrl, hint, doneHint, variant = 'panel', onRemove, disabled, className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  /** How many files past the first were dropped, so the user isn't left wondering. */
  const [ignoredCount, setIgnoredCount] = useState(0);

  const isLocked = !!disabled || upload.isBusy;

  const drag = useFileDrag({
    accept: upload.accept,
    disabled: isLocked,
    onDrop: files => {
      setIgnoredCount(Math.max(0, files.length - 1));
      upload.select(files);
    },
  });

  const openPicker = () => inputRef.current?.click();

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIgnoredCount(0);
    upload.select(e.target.files);
    // Cleared so re-picking the same file still fires a change event.
    e.target.value = '';
  };

  // The local preview outranks the stored image: it is what the user just chose,
  // and it renders instantly instead of waiting on a round trip.
  const image = upload.previewUrl ?? currentUrl;
  const percent = Math.round(upload.progress * 100);
  const isFailed = upload.status === 'error';
  // Bytes are moving but none have been counted yet — a bar pinned at zero
  // looks broken, so this stretch gets a spinner and says so.
  const isStarting = upload.status === 'uploading' && upload.progress === 0;

  const prompt =
    drag.state === 'over'   ? `Drop to upload` :
    drag.state === 'reject' ? `That file isn't an image` :
    drag.state === 'armed'  ? `Drop it here` :
    image                   ? `Replace ${label}` :
    `Drag an image here, or tap to choose`;

  const statusLine =
    upload.status === 'uploading'  ? (isStarting ? 'Starting…' : `Uploading… ${percent}%`) :
    upload.status === 'finalizing' ? 'Finishing up…' :
    // Nothing to say once it's up unless the caller has a caveat, such as the
    // URL not being persisted until the work is saved.
    upload.status === 'done'       ? (doneHint ?? null) :
    null;

  /**
   * Announced once per transition. The percentage is left out on purpose: the
   * progress bar already carries it, and a live region that re-read every tick
   * would talk over everything else.
   */
  const liveMessage =
    isFailed                       ? `${label} upload failed. ${upload.error}` :
    upload.status === 'finalizing' ? `Finishing ${label} upload` :
    upload.status === 'uploading'  ? `Uploading ${label}` :
    upload.status === 'done'       ? `${label} uploaded` : '';

  const borderColorClass =
    isFailed                ? 'border-red-300 dark:border-red-800' :
    drag.state === 'reject' ? 'border-red-400' :
    drag.state === 'over'   ? 'border-gold-strong' :
    drag.state === 'armed'  ? 'border-gold-strong/50' :
    'border-wilde-border';

  /**
   * Panel only: the dashed edge firms up once a file is actually over it.
   *
   * `border-dashed` and `border-solid` both set `border-style`, and which one
   * wins is decided by stylesheet order, not by the order they appear in the
   * class attribute — so exactly one of them may ever be present at a time.
   */
  const panelBorderStyleClass =
    drag.state === 'over' || drag.state === 'reject' ? 'border-solid' : 'border-dashed';

  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      accept={`${upload.accept}*`}
      className="hidden"
      onChange={handlePick}
      disabled={isLocked}
    />
  );

  const ring = (
    <span
      aria-hidden="true"
      className={
        'pointer-events-none absolute inset-0 rounded-lg transition-opacity duration-150 ' +
        RING_BY_STATE[drag.state]
      }
    />
  );

  const live = (
    <span role="status" aria-live="polite" className="sr-only">{liveMessage}</span>
  );

  const progress = !isStarting && upload.isBusy ? (
    <div
      role="progressbar"
      aria-label={`Uploading ${label}`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      // Delayed in, so an upload that finishes in a blink never flashes a bar.
      className="h-1 w-full rounded-full bg-wilde-sunken overflow-hidden animate-fade-in-delayed"
    >
      <div
        className="h-full rounded-full bg-wilde-black transition-[width] duration-200 ease-out
          motion-reduce:transition-none"
        style={{ width: `${percent}%` }}
      />
    </div>
  ) : null;

  /** Kept in the layout rather than in a toast, so it survives long enough to act on. */
  const failure = isFailed ? (
    <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
      <IonIcon icon={alertCircleOutline} aria-hidden="true" className="text-sm shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="leading-snug">{upload.error}</p>
        <div className="flex gap-3 mt-1">
          {upload.canRetry && (
            <button type="button" onClick={upload.retry}
              className="flex items-center gap-1 font-semibold underline underline-offset-2">
              <IonIcon icon={refreshOutline} aria-hidden="true" />
              Try again
            </button>
          )}
          <button type="button" onClick={openPicker}
            className="font-semibold underline underline-offset-2">
            Choose a different file
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const extraNote = ignoredCount > 0 && !isFailed ? (
    <p className="text-xs text-wilde-muted">
      Used the first image; {ignoredCount} other{ignoredCount > 1 ? 's were' : ' was'} ignored.
    </p>
  ) : null;

  if (variant === 'strip') {
    return (
      <div
        {...drag.handlers}
        className={`relative flex items-center gap-3 rounded-lg border px-3 py-2
          transition-colors duration-150 ${borderColorClass} ${className}`}
      >
        {hiddenInput}
        {ring}
        {live}

        {/* Covers the row so the whole strip is clickable, without nesting a
            button inside the remove and retry controls beside it. */}
        <button
          type="button"
          onClick={openPicker}
          disabled={isLocked}
          aria-label={image ? `Replace ${label}` : `Add ${label}`}
          className="absolute inset-0 rounded-lg focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-wilde-black"
        />

        <div className="w-16 h-10 rounded-md bg-wilde-sunken overflow-hidden shrink-0
          flex items-center justify-center pointer-events-none">
          {image ? (
            <img src={image} alt=""
              className={'w-full h-full object-cover transition-opacity duration-200 ' +
                (upload.isBusy ? 'opacity-50' : 'opacity-100')} />
          ) : (
            <IonIcon icon={imageOutline} aria-hidden="true" className="text-lg text-wilde-muted" />
          )}
        </div>

        <div className="flex-1 min-w-0 pointer-events-none">
          <p className="text-xs font-semibold capitalize">{label}</p>
          {failure ? (
            <div className="relative z-10 pointer-events-auto mt-0.5">{failure}</div>
          ) : (
            <>
              {/* Idle, the strip is worth spending its one line on what the
                  image is for; the moment a drag starts, on where to put it. */}
              <p className="text-xs text-wilde-muted truncate">
                {statusLine ?? (drag.state === 'idle' ? (hint ?? prompt) : prompt)}
              </p>
              {progress && <div className="mt-1">{progress}</div>}
              {extraNote}
            </>
          )}
        </div>

        {onRemove && image && !upload.isBusy && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${label}`}
            className="relative z-10 min-w-9 min-h-9 flex items-center justify-center rounded-full
              text-base shrink-0 transition-colors active:bg-wilde-subtle focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-wilde-black"
          >
            <IonIcon icon={closeOutline} aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      {...drag.handlers}
      className={`relative rounded-lg border overflow-hidden transition-colors duration-150
        ${panelBorderStyleClass} ${borderColorClass} ${className}`}
    >
      {hiddenInput}
      {ring}
      {live}

      <button
        type="button"
        onClick={openPicker}
        disabled={isLocked}
        aria-label={image ? `Replace ${label}` : `Add ${label}`}
        className="w-full h-56 flex flex-col items-center justify-center gap-2 text-wilde-muted
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset
          focus-visible:ring-wilde-black"
      >
        {image ? (
          <img
            src={image}
            alt={upload.previewUrl ? `Preview of ${upload.fileName ?? label}` : ''}
            // Shrinks back a touch while a valid file hovers, so it reads as
            // "this is about to be replaced" before the drop happens.
            className={'absolute inset-0 w-full h-full object-cover transition-all duration-200 ' +
              'motion-reduce:transition-none ' +
              (drag.state === 'over' ? 'opacity-60 motion-safe:scale-95 ' : '') +
              (upload.isBusy ? 'opacity-50 ' : '')}
          />
        ) : (
          <>
            <IonIcon
              icon={drag.state === 'over' || drag.state === 'armed' ? cloudUploadOutline : imageOutline}
              aria-hidden="true"
              className={'text-3xl transition-transform duration-150 motion-reduce:transition-none ' +
                (drag.state === 'over' ? 'motion-safe:-translate-y-1' : '')}
            />
            <span className={'text-sm px-4 text-center ' + (drag.state === 'reject' ? 'text-red-600 dark:text-red-400' : '')}>
              {prompt}
            </span>
            {hint && <span className="text-xs text-wilde-muted/80">{hint}</span>}
          </>
        )}
      </button>

      {/* Sits above the picker button so its own controls stay clickable. */}
      {(upload.isBusy || isStarting || statusLine || failure || extraNote) && (
        <div className="absolute inset-x-0 bottom-0 z-10 bg-wilde-panel/95 backdrop-blur-sm
          border-t border-wilde-border px-3 py-2 flex flex-col gap-1 animate-fade-in">
          {failure ?? (
            <>
              <div className="flex items-center gap-2 text-xs text-wilde-muted">
                {isStarting && <IonSpinner name="crescent" className="scale-50 -my-2" />}
                <span className="truncate">
                  {upload.fileName ? `${upload.fileName} — ` : ''}{statusLine}
                </span>
              </div>
              {progress}
              {extraNote}
            </>
          )}
        </div>
      )}

      {onRemove && image && !upload.isBusy && !isFailed && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full
            bg-wilde-panel/90 text-base shadow-sm transition-colors active:bg-wilde-subtle
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wilde-black"
        >
          <IonIcon icon={closeOutline} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default UploadDropzone;
