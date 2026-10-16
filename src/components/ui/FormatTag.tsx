import React from 'react';
import { IonIcon } from '@ionic/react';
import { WorkType } from '@/types';
import { FORMATS } from '@/utils/formats';

interface Props {
  type: WorkType;
  /** Appended after the format name, e.g. "for sale". */
  note?: string;
  className?: string;
}

/**
 * The format chip: icon + name in the format's own hue. Both are always
 * present, so the colour is reinforcement and never the only signal.
 */
const FormatTag: React.FC<Props> = ({ type, note, className = '' }) => {
  const fmt = FORMATS[type];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px]
      font-medium leading-none ${fmt.tint} ${fmt.text} ${className}`}>
      <IonIcon icon={fmt.icon} aria-hidden="true" className="text-sm" />
      {fmt.label}{note ? ` · ${note}` : ''}
    </span>
  );
};

export default FormatTag;
