import React from 'react';
import { IonIcon } from '@ionic/react';
import Tooltip from './Tooltip';

interface IconButtonProps {
  icon: string;
  /** Doubles as the accessible name and the tooltip text — they must not drift apart. */
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  /** Unread-style count. Values over 9 render as "9+"; 0 hides the badge. */
  badge?: number;
  side?: 'bottom' | 'top';
  className?: string;
}

/**
 * Icon-only button with a hover/focus tooltip.
 *
 * An icon on its own is a guess for the user, so every instance carries a
 * visible label on pointer devices and an `aria-label` everywhere.
 */
const IconButton: React.FC<IconButtonProps> = ({
  icon, label, onClick, disabled, badge, side = 'bottom', className = '',
}) => (
  <Tooltip label={label} side={side}>
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={
        'relative min-w-11 min-h-11 flex items-center justify-center text-xl rounded-full shrink-0 ' +
        'transition-colors active:bg-wilde-subtle focus-visible:outline-none ' +
        // Gold focus ring rather than ink: it stays visible against both the
        // light and the dark surface, where a near-black ring disappears at
        // night and a cream one disappears by day.
        'focus-visible:ring-2 focus-visible:ring-gold-strong focus-visible:ring-offset-1 ' +
        'focus-visible:ring-offset-wilde-surface ' +
        'disabled:opacity-30 disabled:cursor-not-allowed ' + className
      }
    >
      <IonIcon icon={icon} aria-hidden="true" />
      {!!badge && badge > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 flex items-center justify-center
            rounded-full bg-red-500 text-white text-[10px] font-bold leading-none"
        >
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  </Tooltip>
);

export default IconButton;
