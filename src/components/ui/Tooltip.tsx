import React from 'react';

interface TooltipProps {
  /** Tooltip text. The wrapped control still needs its own accessible name. */
  label: string;
  side?: 'bottom' | 'top';
  children: React.ReactNode;
}

/**
 * Label shown on hover or keyboard focus of the control it wraps.
 *
 * Gated behind `hover: hover` so it never sticks open after a tap on a
 * touchscreen, and driven by `group-focus-within` so keyboard users get it too.
 * Purely visual — it is hidden from assistive tech, which reads the control's
 * own `aria-label` instead of hearing the same text twice.
 */
const Tooltip: React.FC<TooltipProps> = ({ label, side = 'bottom', children }) => (
  <span className="relative inline-flex group">
    {children}
    <span
      aria-hidden="true"
      className={
        'pointer-events-none absolute left-1/2 -translate-x-1/2 z-50 whitespace-nowrap ' +
        'rounded-md bg-wilde-black px-2 py-1 text-[11px] font-medium text-white ' +
        'opacity-0 transition-opacity duration-150 ' +
        '[@media(hover:hover)]:group-hover:opacity-100 group-focus-within:opacity-100 ' +
        (side === 'bottom' ? 'top-full mt-1' : 'bottom-full mb-1')
      }
    >
      {label}
    </span>
  </span>
);

export default Tooltip;
