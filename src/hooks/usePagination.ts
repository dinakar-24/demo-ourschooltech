import { useState, useCallback, useMemo } from 'react';

export interface PaginationState {
  page: number;
  pageSize: number;
}

export interface PaginationResult extends PaginationState {
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  resetPage: () => void;
  totalPages: (totalCount: number) => number;
  range: (totalCount: number) => { from: number; to: number };
}

const DEFAULT_PAGE_SIZE = 25;

export function usePagination(initialPageSize = DEFAULT_PAGE_SIZE): PaginationResult {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPage(1);
  }, []);

  const nextPage = useCallback(() => setPage(p => p + 1), []);
  const prevPage = useCallback(() => setPage(p => Math.max(1, p - 1)), []);
  const resetPage = useCallback(() => setPage(1), []);

  const totalPages = useCallback(
    (totalCount: number) => Math.max(1, Math.ceil(totalCount / pageSize)),
    [pageSize]
  );

  const range = useCallback(
    (totalCount: number) => ({
      from: (page - 1) * pageSize,
      to: Math.min(page * pageSize - 1, totalCount - 1),
    }),
    [page, pageSize]
  );

  return useMemo(
    () => ({ page, pageSize, setPage, setPageSize, nextPage, prevPage, resetPage, totalPages, range }),
    [page, pageSize, setPage, setPageSize, nextPage, prevPage, resetPage, totalPages, range]
  );
}

/** Helper to apply Supabase range from pagination state */
export function getSupabaseRange(page: number, pageSize: number) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
}
