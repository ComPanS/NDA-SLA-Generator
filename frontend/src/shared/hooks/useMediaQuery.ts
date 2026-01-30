import { useEffect, useState } from 'react';

/**
 * Hook для работы с media queries
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// Готовые хуки для распространенных breakpoints
export const useIsMobile = () => useMediaQuery('(max-width: 600px)');
export const useIsTablet = () => useMediaQuery('(max-width: 960px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 961px)');
