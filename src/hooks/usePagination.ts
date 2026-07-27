import { useState, useCallback } from 'react';

// Page size is the caller's business — this only tracks which page is current
// and whether another one exists.
export const usePagination = () => {
  const [page, setPage]       = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const nextPage = useCallback(() => {
    if (hasMore) setPage(p => p + 1);
  }, [hasMore]);

  const reset = useCallback(() => {
    setPage(1);
    setHasMore(true);
  }, []);

  return { page, hasMore, nextPage, reset, setHasMore };
};
