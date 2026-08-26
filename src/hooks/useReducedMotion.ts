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
    let unsubscribe: (() => void) | undefined;
    try {
      if (typeof media.addEventListener === 'function') {
        media.addEventListener('change', update);
        unsubscribe = () => {
          if (typeof media.removeEventListener !== 'function') return;
          try { media.removeEventListener('change', update); } catch { /* cleanup must not escape */ }
        };
      } else if (typeof media.addListener === 'function') {
        media.addListener(update);
        unsubscribe = () => {
          if (typeof media.removeListener !== 'function') return;
          try { media.removeListener(update); } catch { /* cleanup must not escape */ }
        };
      }
    } catch {
      return undefined;
    }
    return unsubscribe;
  }, []);

  return reduced;
}
