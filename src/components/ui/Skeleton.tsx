import React from 'react';

/**
 * Grey placeholder bars used while data loads. A skeleton should mirror the
 * shape of the content it stands in for, so the layout doesn't jump when the
 * real thing arrives.
 *
 * Skeletons are decorative: the surrounding `<SkeletonScreen>` owns the single
 * `role="status"` announcement, and every bar is hidden from assistive tech.
 */

interface SkeletonProps {
  className?: string;
  /** Renders a pill instead of a rounded rectangle — for avatars and chips. */
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', circle }) => (
  <span
    aria-hidden="true"
    className={
      'relative block overflow-hidden bg-gray-200 ' +
      (circle ? 'rounded-full ' : 'rounded ') +
      className
    }
  >
    {/* Sweeping highlight. Hidden when the user has asked for reduced motion —
        the static grey bar still reads as a loading placeholder on its own. */}
    <span className="absolute inset-0 -translate-x-full animate-shimmer motion-reduce:hidden
      bg-gradient-to-r from-transparent via-white/70 to-transparent" />
  </span>
);

/**
 * Wraps a set of skeletons with one polite announcement, so a screen reader
 * hears "Loading <label>" once rather than reading out every placeholder bar.
 */
export const SkeletonScreen: React.FC<{ label: string; children: React.ReactNode }> = ({
  label, children,
}) => (
  <div role="status" aria-busy="true" aria-live="polite">
    <span className="sr-only">Loading {label}…</span>
    {children}
  </div>
);

/** Mirrors `WorkCard`: cover block, type label, title, excerpt, author, stats. */
export const WorkCardSkeleton: React.FC = () => (
  <div className="rounded-lg border border-wilde-border overflow-hidden">
    <Skeleton className="h-32 w-full rounded-none" />
    <div className="p-3">
      <Skeleton className="h-2.5 w-12" />
      <Skeleton className="h-3.5 w-4/5 mt-1.5" />
      <Skeleton className="h-2.5 w-full mt-2" />
      <Skeleton className="h-2.5 w-2/3 mt-1" />
      <div className="flex items-center gap-1.5 mt-2.5">
        <Skeleton circle className="h-8 w-8 shrink-0" />
        <Skeleton className="h-2.5 w-20" />
      </div>
      <div className="flex gap-3 mt-2">
        <Skeleton className="h-2.5 w-8" />
        <Skeleton className="h-2.5 w-8" />
      </div>
    </div>
  </div>
);

export const WorkGridSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-2 gap-3">
    {Array.from({ length: count }, (_, i) => <WorkCardSkeleton key={i} />)}
  </div>
);

/** Mirrors the horizontal "Trending Creatives" rail on Home. */
export const CreatorRailSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="flex gap-3 pb-2">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="flex flex-col items-center gap-1 min-w-16">
        <Skeleton circle className="h-16 w-16" />
        <Skeleton className="h-2.5 w-12 mt-0.5" />
        <Skeleton className="h-2.5 w-6" />
      </div>
    ))}
  </div>
);

/** Mirrors the creator grid tiles on Explore. */
export const CreatorGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-2 gap-3">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="flex flex-col items-center gap-1.5 p-3 border border-wilde-border rounded-lg">
        <Skeleton circle className="h-16 w-16" />
        <Skeleton className="h-3 w-20 mt-0.5" />
        <Skeleton className="h-2.5 w-16" />
      </div>
    ))}
  </div>
);

/**
 * Mirrors the thumbnail + two-line + action rows used by Marketplace, Jobs and
 * the review list.
 */
export const ListRowSkeleton: React.FC<{ count?: number; thumb?: boolean }> = ({
  count = 5, thumb = true,
}) => (
  <>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="flex items-center gap-3 py-3 border-b border-wilde-border">
        {thumb && <Skeleton className="w-12 h-10 shrink-0 rounded-md" />}
        <div className="flex-1">
          <Skeleton className="h-3 w-2/5" />
          <Skeleton className="h-2.5 w-1/4 mt-1.5" />
          <Skeleton className="h-3 w-16 mt-1.5" />
        </div>
        <Skeleton className="h-7 w-14 rounded-md shrink-0" />
      </div>
    ))}
  </>
);

/** Mirrors the notification rows: icon, message, timestamp. */
export const NotificationSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="flex items-start gap-3 py-3 border-b border-wilde-border">
        <Skeleton circle className="h-6 w-6 shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-2.5 w-1/2 mt-1.5" />
        </div>
        <Skeleton className="h-2.5 w-12 shrink-0" />
      </div>
    ))}
  </>
);

/** Mirrors the avatar + name + stat-row header on the creator profile. */
export const ProfileHeaderSkeleton: React.FC = () => (
  <>
    <div className="flex flex-col items-center gap-2">
      <Skeleton circle className="h-20 w-20" />
      <Skeleton className="h-4 w-32 mt-1" />
      <Skeleton className="h-2.5 w-24" />
      <Skeleton className="h-2.5 w-48 mt-1" />
    </div>
    <div className="grid grid-cols-3 gap-2 mt-4">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-2.5 w-14" />
        </div>
      ))}
    </div>
  </>
);

/** Mirrors a block of prose — the reader and collaboration document views. */
export const ProseSkeleton: React.FC<{ lines?: number }> = ({ lines = 8 }) => (
  <div className="space-y-2.5">
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton key={i} className={'h-3 ' + (i % 4 === 3 ? 'w-2/3' : 'w-full')} />
    ))}
  </div>
);

export default Skeleton;
