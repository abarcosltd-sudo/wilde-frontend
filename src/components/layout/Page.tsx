import React from 'react';

/**
 * The app's spacing and typography rhythm, in one place.
 *
 * Every page used to open with its own `p-4` and then pick from `mb-2`, `mb-3`,
 * `mb-4` and `mt-4` by feel, so no two screens shared a vertical rhythm. These
 * primitives fix the gutter, the measure and the heading scale so a new page
 * inherits them instead of re-deciding.
 *
 * They also carry the responsive behaviour: this is a mobile-first Capacitor
 * app, but the same build is served on the web, where a fixed two-column grid
 * stretched to whatever width the window happened to be.
 */

/**
 * The gutter and measure as a bare class, for pages whose existing wrapper
 * carries other responsibilities and can't simply become a `<Page>`.
 * Prefer the component; this exists so no page has to hand-roll the values.
 */
export const PAGE_CLASS = 'mx-auto w-full max-w-screen-lg px-4 py-4 sm:px-6 lg:px-8';

interface PageProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Page gutter and measure. The max-width stops the layout from sprawling on a
 * desktop browser; on a phone it never applies.
 */
export const Page: React.FC<PageProps> = ({ children, className = '' }) => (
  <div className={`${PAGE_CLASS} ${className}`}>{children}</div>
);

interface PageHeaderProps {
  title: string;
  /** Buttons aligned opposite the title. */
  actions?: React.ReactNode;
  /** One line under the title. Optional — most screens don't need one. */
  subtitle?: string;
}

/**
 * The top of a screen. Playfair is used here and on work titles only: it was
 * loaded and configured from the start but never actually applied to anything,
 * so the app shipped a display face it never showed.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, actions, subtitle }) => (
  <header className="flex items-start justify-between gap-3 mb-5">
    <div className="min-w-0">
      <h1 className="font-display text-2xl font-bold tracking-tight text-balance">{title}</h1>
      {subtitle && <p className="text-sm text-wilde-muted mt-0.5 text-pretty">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
  </header>
);

interface SectionProps {
  /** Omit for an unlabelled block that still keeps the rhythm. */
  title?: string;
  /** Typically a "See all" link. */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * A titled block. Sections are separated by their own top margin rather than by
 * each page remembering to add one.
 */
export const Section: React.FC<SectionProps> = ({ title, action, children, className = '' }) => (
  <section className={`mt-6 first:mt-0 ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between gap-3 mb-3">
        {title && <h2 className="font-semibold text-base tracking-tight">{title}</h2>}
        {action}
      </div>
    )}
    {children}
  </section>
);
