import React from 'react';

export interface Chip {
  id: string;
  label: string;
  /** A small format-coloured dot before the label. A full class, e.g. `bg-fmt-book`. */
  dot?: string;
}

interface Props {
  chips: Chip[];
  value: string;
  onChange: (id: string) => void;
  /** Names the group for assistive tech: "Filter by format". */
  label: string;
  className?: string;
}

/**
 * The scrolling filter row used on Home and the marketplace. The selected chip
 * is filled ink; the rest are outlined. Each is a toggle button, so the
 * selection is announced rather than only shown.
 */
const FilterChips: React.FC<Props> = ({ chips, value, onChange, label, className = '' }) => (
  <div role="group" aria-label={label}
    className={`flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 ${className}`}>
    {chips.map(c => {
      const selected = c.id === value;
      return (
        <button key={c.id} type="button" aria-pressed={selected} onClick={() => onChange(c.id)}
          className={'shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[15px] font-medium ' +
            'border transition-colors focus-visible:outline-none focus-visible:ring-2 ' +
            'focus-visible:ring-brand-strong ' +
            (selected
              ? 'bg-wilde-black text-wilde-on-ink border-wilde-black'
              : 'bg-wilde-panel border-wilde-border active:bg-wilde-subtle')}>
          {c.dot && <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />}
          {c.label}
        </button>
      );
    })}
  </div>
);

export default FilterChips;
