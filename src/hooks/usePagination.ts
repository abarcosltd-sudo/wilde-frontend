import { useState, useCallback } from 'react';

export const usePagination = (pageSize = 20) => {
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
