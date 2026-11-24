import { useEffect } from 'react';

const SUFFIX = 'Amber | Culture match';

/**
 * Sets document.title to "Page · Amber | Culture match".
 * Pass an empty string to show just the suffix.
 */
export function usePageTitle(page: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = page ? `${page} · ${SUFFIX}` : SUFFIX;
    return () => {
      document.title = prev;
    };
  }, [page]);
}
