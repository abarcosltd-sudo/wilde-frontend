import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  /** Tooltip text. The wrapped control still needs its own accessible name. */
  label: string;
  side?: 'bottom' | 'top';
  children: React.ReactNode;
}

/** Breathing room between the control and the label, and between label and screen edge. */
const GAP = 6;
const EDGE = 8;

/**
 * Label shown on hover or keyboard focus of the control it wraps.
 *
 * It is drawn in a portal on `document.body` with fixed positioning rather than
 * inside the control's own wrapper. Page headers are `IonToolbar`s, which clip
 * anything that overflows them, so a tooltip positioned just below a back button
 * was cut off at the toolbar's edge. Out here nothing can clip it, and it is
 * clamped to the viewport so a control at the left edge doesn't push it off screen.
 *
 * Hover only counts on devices that really hover, so a tap never leaves it
 * stuck open; focus only counts for keyboard focus (`:focus-visible`), for the
 * same reason. It is hidden from assistive tech, which reads the control's own
 * `aria-label` instead of hearing the same text twice.
 */
const Tooltip: React.FC<TooltipProps> = ({ label, side = 'bottom', children }) => {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  // Left edge of the label, once measured and clamped. Hidden until then, so it
  // never flashes at the unclamped position.
  const [left, setLeft] = useState<number | null>(null);

  const open = useCallback(() => {
    if (anchorRef.current) setAnchor(anchorRef.current.getBoundingClientRect());
  }, []);
  const close = useCallback(() => { setAnchor(null); setLeft(null); }, []);

  const onEnter = () => {
    if (window.matchMedia('(hover: hover)').matches) open();
  };
  const onFocus = (e: React.FocusEvent) => {
    // `:focus-visible` is true for keyboard focus and false after a tap or click.
    if ((e.target as HTMLElement).matches(':focus-visible')) open();
  };

  // Measure the label and clamp it inside the viewport.
  useLayoutEffect(() => {
    if (!anchor || !tipRef.current) return;
    const width = tipRef.current.offsetWidth;
    const centre = anchor.left + anchor.width / 2;
    const max = window.innerWidth - width - EDGE;
    setLeft(Math.max(EDGE, Math.min(centre - width / 2, max)));
  }, [anchor, label]);

  // A fixed label doesn't follow its control, so drop it if the page moves.
  useEffect(() => {
    if (!anchor) return;
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [anchor, close]);

  const style: React.CSSProperties | undefined = anchor
    ? {
        position: 'fixed',
        left: left ?? 0,
        top: side === 'bottom' ? anchor.bottom + GAP : undefined,
        bottom: side === 'top' ? window.innerHeight - anchor.top + GAP : undefined,
        // Measured off-screen-invisible on the first pass, then revealed.
        visibility: left === null ? 'hidden' : 'visible',
      }
    : undefined;

  return (
    <span ref={anchorRef} className="relative inline-flex"
      onMouseEnter={onEnter} onMouseLeave={close}
      onFocus={onFocus} onBlur={close}>
      {children}
      {anchor && createPortal(
        <span ref={tipRef} aria-hidden="true" style={style}
          className="pointer-events-none z-[100000] whitespace-nowrap rounded-md bg-wilde-black
            px-2 py-1 text-[11px] font-medium text-wilde-on-ink shadow-lift animate-fade-in">
          {label}
        </span>,
        document.body,
      )}
    </span>
  );
};

export default Tooltip;
