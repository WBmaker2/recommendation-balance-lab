import { useEffect, useState } from 'react';

const query = '(prefers-reduced-motion: reduce)';

const currentPreference = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
};

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(currentPreference);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    let media: MediaQueryList;
    try {
      media = window.matchMedia(query);
    } catch {
      return undefined;
    }
    const update = (event: MediaQueryListEvent): void => setReduced(event.matches);
    if (typeof media.addEventListener === 'function') media.addEventListener('change', update);
    else if (typeof media.addListener === 'function') media.addListener(update);
    return () => {
      if (typeof media.removeEventListener === 'function') media.removeEventListener('change', update);
      else if (typeof media.removeListener === 'function') media.removeListener(update);
    };
  }, []);

  return reduced;
}
