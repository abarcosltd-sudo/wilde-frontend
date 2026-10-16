import React from 'react';

/** "Wilde" in the italic display face with a brand-coloured full stop. */
const Wordmark: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span aria-label="Wilde"
    className={`font-display italic font-medium text-[30px] leading-none tracking-tight ${className}`}>
    Wilde<span className="text-brand" aria-hidden="true">.</span>
  </span>
);

export default Wordmark;
