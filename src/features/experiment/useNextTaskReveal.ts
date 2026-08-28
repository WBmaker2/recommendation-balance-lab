import { useEffect, useRef } from 'react';

export interface NextTaskRevealOptions {
  active: boolean;
  targetId: string;
}

export function useNextTaskReveal({ active, targetId }: NextTaskRevealOptions): void {
  const revealed = useRef(false);

  useEffect(() => {
    if (!active) {
      revealed.current = false;
      return;
    }
    if (revealed.current) return;
    revealed.current = true;

    const target = document.getElementById(targetId);
    if (!(target instanceof HTMLElement)) return;
    target.focus({ preventScroll: true });
    if (typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, [active, targetId]);
}
