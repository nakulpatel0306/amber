import { useEffect } from 'react';

export const SITE_TITLE = 'Amber - Culture-first job matching';

/** "Page · Amber", or the full site title for an empty string. */
export function formatTitle(page: string): string {
  return page ? `${page} · Amber` : SITE_TITLE;
}

/** Sets document.title for the lifetime of the calling component. */
export function usePageTitle(page: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = formatTitle(page);
    return () => {
      document.title = prev;
    };
  }, [page]);
}
