import React, { lazy } from 'react';

/**
 * `React.lazy` for route components, with recovery from the stale-HTML problem
 * that lazy loading introduces.
 *
 * Vite emits content-hashed chunk names, and a deploy replaces them. A browser
 * holding the previous `index.html` — from its own cache, a CDN edge, or a tab
 * that has been open across the deploy — asks for a chunk filename that no
 * longer exists. The import rejects, the route renders nothing, and the user
 * sees a blank page that only a cache-bypassing reload fixes. Eagerly-imported
 * apps don't have this failure mode, because everything is in the entry file
 * the HTML already named.
 *
 * A plain reload is enough: it re-requests the document, picks up the current
 * chunk names, and carries on. The session flag is what stops that becoming a
 * reload loop when the import is failing for some other reason — offline, or a
 * genuine runtime error inside the module.
 */

type PageModule = { default: React.ComponentType };

const RELOAD_FLAG = 'wilde_chunk_reload';

/** True for the "module went missing" family, not for errors thrown inside a module. */
const isChunkLoadFailure = (error: unknown): boolean => {
  const message = (error as Error | null)?.message ?? '';
  return /dynamically imported module|Importing a module script failed|Loading chunk|Failed to fetch/i
    .test(message);
};

export const lazyPage = (load: () => Promise<PageModule>) =>
  lazy(() =>
    load().then(module => {
      // Cleared here, not when the app mounts. `App` renders before any route
      // chunk resolves, so clearing it there released the guard every time and
      // turned a permanently-missing chunk into an endless reload loop. A chunk
      // that actually loaded is the only proof the document is current.
      markChunkLoadHealthy();
      return module;
    }).catch((error: unknown) => {
      if (!isChunkLoadFailure(error)) throw error;

      let alreadyRetried = true;
      try {
        alreadyRetried = sessionStorage.getItem(RELOAD_FLAG) === '1';
        if (!alreadyRetried) sessionStorage.setItem(RELOAD_FLAG, '1');
      } catch {
        // Storage can be unavailable (private mode, blocked cookies). Without
        // somewhere to record the attempt there is no safe way to reload
        // without risking a loop, so surface the error instead.
        throw error;
      }

      if (alreadyRetried) throw error;

      window.location.reload();
      // The document is being torn down; resolving would flash a component
      // that is about to be discarded.
      return new Promise<PageModule>(() => {});
    }),
  );

/**
 * Clears the retry flag once a route chunk has genuinely loaded, so a later
 * deploy is allowed its own single recovery reload.
 */
const markChunkLoadHealthy = () => {
  try {
    sessionStorage.removeItem(RELOAD_FLAG);
  } catch {
    // Nothing to clear if storage isn't available.
  }
};
