import React from 'react';
import { Work } from '@/types';
import WorkCard from './WorkCard';

/**
 * The one place that decides how a list of works is laid out.
 *
 * Every page previously wrote its own `grid grid-cols-2 gap-3`, which meant a
 * fixed two columns at every width — two very wide cards on a tablet, and the
 * same two on a desktop browser.
 */

interface Props {
  works: Work[];
  /**
   * Bento rhythm: the first work runs full width as a feature tile and the rest
   * fall into the normal grid beneath it. Reserved for the top of a feed, where
   * there is a genuine lead item — applying it to a filtered result list would
   * be promoting whatever happened to sort first.
   */
  bento?: boolean;
  className?: string;
}

const GRID_CLASS = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4';

const WorkGrid: React.FC<Props> = ({ works, bento, className = '' }) => {
  if (works.length === 0) return null;

  // One item makes a poor bento: a lone feature tile with nothing beside it is
  // just a big card, so it falls back to the plain grid.
  if (!bento || works.length < 3) {
    return (
      <div className={`${GRID_CLASS} animate-fade-in ${className}`}>
        {works.map(work => <WorkCard key={work.id} work={work} />)}
      </div>
    );
  }

  const [lead, ...rest] = works;

  return (
    <div className={`${GRID_CLASS} animate-fade-in ${className}`}>
      {/* Spans the full row at every breakpoint, so the bento reads the same
          on a phone as on a desktop instead of only working at one width. */}
      <div className="col-span-2 sm:col-span-3 lg:col-span-4">
        <WorkCard work={lead} size="feature" />
      </div>
      {rest.map(work => <WorkCard key={work.id} work={work} />)}
    </div>
  );
};

export default WorkGrid;
