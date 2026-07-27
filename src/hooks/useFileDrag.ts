import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Drag-and-drop state for a single drop target.
 *
 * - `idle`   nothing is being dragged
 * - `armed`  a file is in flight somewhere over the window — the target says
 *            "you can drop here" before the pointer ever reaches it, which is
 *            the difference between a discoverable drop target and a hidden one
 * - `over`   a file this target accepts is directly over it
 * - `reject` something over this target can't be accepted
 */
export type DragState = 'idle' | 'armed' | 'over' | 'reject';

interface Options {
  /** MIME prefix this target accepts, e.g. `image/`. */
  accept: string;
  /** Drops are ignored while true, and the target never leaves `idle`. */
  disabled?: boolean;
  onDrop: (files: File[]) => void;
}

interface FileDrag {
  state: DragState;
  /** Spread onto the drop target element. */
  handlers: Pick<React.HTMLAttributes<HTMLElement>, 'onDragEnter' | 'onDragOver' | 'onDragLeave' | 'onDrop'>;
}

/** True when the drag carries files rather than selected text or a link. */
const isFileDrag = (dt: DataTransfer | null) =>
  !!dt && Array.from(dt.types).includes('Files');

/**
 * Whether the payload looks acceptable, judged from what a drag exposes.
 *
 * Names and sizes are withheld until drop, but item MIME types are readable
 * during the drag, which is enough to refuse an obvious mismatch while the user
 * can still change their mind. Some sources report an empty type, and those
 * can't be judged early — they're let through and validated as real `File`s.
 */
const acceptsDrag = (dt: DataTransfer | null, accept: string) => {
  if (!dt) return false;
  const fileItems = Array.from(dt.items ?? []).filter(i => i.kind === 'file');
  if (fileItems.length === 0) return true;
  return fileItems.some(i => !i.type || i.type.startsWith(accept));
};

export const useFileDrag = ({ accept, disabled, onDrop }: Options): FileDrag => {
  const [state, setState] = useState<DragState>('idle');

  /**
   * `dragenter`/`dragleave` fire for every descendant the pointer crosses, so a
   * target that toggled on the raw events would flicker off the moment the
   * pointer moved onto its own preview image. Counting enters against leaves
   * tracks the subtree as one region.
   */
  const depth = useRef(0);

  const reset = useCallback(() => {
    depth.current = 0;
    setState(current => (current === 'idle' ? current : 'idle'));
  }, []);

  /**
   * A file dropped anywhere else on the page would otherwise navigate away and
   * discard whatever the user was writing. Only file drags are neutralised, so
   * dragging text into the editor still works.
   */
  useEffect(() => {
    if (disabled) return;

    let windowDepth = 0;

    const onWindowDragEnter = (e: DragEvent) => {
      if (!isFileDrag(e.dataTransfer)) return;
      windowDepth += 1;
      setState(current => (current === 'idle' ? 'armed' : current));
    };
    const onWindowDragLeave = (e: DragEvent) => {
      if (!isFileDrag(e.dataTransfer)) return;
      windowDepth = Math.max(0, windowDepth - 1);
      if (windowDepth === 0) reset();
    };
    const onWindowDragOver = (e: DragEvent) => {
      if (isFileDrag(e.dataTransfer)) e.preventDefault();
    };
    const onWindowDrop = (e: DragEvent) => {
      if (!isFileDrag(e.dataTransfer)) return;
      e.preventDefault();
      windowDepth = 0;
      reset();
    };
    // Cancelling a drag with Escape fires neither `dragleave` nor `drop`, which
    // would strand every target in `armed` until the next drag.
    const onWindowDragEnd = () => { windowDepth = 0; reset(); };

    window.addEventListener('dragenter', onWindowDragEnter);
    window.addEventListener('dragleave', onWindowDragLeave);
    window.addEventListener('dragover', onWindowDragOver);
    window.addEventListener('drop', onWindowDrop);
    window.addEventListener('dragend', onWindowDragEnd);
    return () => {
      window.removeEventListener('dragenter', onWindowDragEnter);
      window.removeEventListener('dragleave', onWindowDragLeave);
      window.removeEventListener('dragover', onWindowDragOver);
      window.removeEventListener('drop', onWindowDrop);
      window.removeEventListener('dragend', onWindowDragEnd);
    };
  }, [disabled, reset]);

  useEffect(() => { if (disabled) reset(); }, [disabled, reset]);

  const handleDragEnter = (e: React.DragEvent) => {
    if (disabled || !isFileDrag(e.dataTransfer)) return;
    e.preventDefault();
    depth.current += 1;
    setState(acceptsDrag(e.dataTransfer, accept) ? 'over' : 'reject');
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled || !isFileDrag(e.dataTransfer)) return;
    // Without this the drop event never fires at all.
    e.preventDefault();
    const ok = acceptsDrag(e.dataTransfer, accept);
    // Drives the cursor badge, so the refusal is visible at the pointer and not
    // only in the target's own styling.
    e.dataTransfer.dropEffect = ok ? 'copy' : 'none';
    setState(current => {
      const next = ok ? 'over' : 'reject';
      return current === next ? current : next;
    });
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (disabled || !isFileDrag(e.dataTransfer)) return;
    depth.current = Math.max(0, depth.current - 1);
    // Still inside the target, just over a different child.
    if (depth.current > 0) return;
    setState('armed');
  };

  const handleDrop = (e: React.DragEvent) => {
    if (disabled || !isFileDrag(e.dataTransfer)) return;
    e.preventDefault();
    e.stopPropagation();
    depth.current = 0;
    setState('idle');
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length > 0) onDrop(files);
  };

  return {
    state,
    handlers: {
      onDragEnter: handleDragEnter,
      onDragOver:  handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop:      handleDrop,
    },
  };
};
