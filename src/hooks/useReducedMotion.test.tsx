import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useReducedMotion } from './useReducedMotion';

afterEach(cleanup);

function Probe(): React.JSX.Element {
  return <output>{useReducedMotion() ? 'reduce' : 'full'}</output>;
}

const installMedia = (media: Partial<MediaQueryList>): PropertyDescriptor | undefined => {
  const original = Object.getOwnPropertyDescriptor(window, 'matchMedia');
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn(() => media) });
  return original;
};

const restoreMedia = (original: PropertyDescriptor | undefined): void => {
  if (original) Object.defineProperty(window, 'matchMedia', original);
  else Reflect.deleteProperty(window, 'matchMedia');
};

describe('useReducedMotion', () => {
  it('subscribes and cleans up modern change listeners', () => {
    const add = vi.fn();
    const remove = vi.fn();
    const original = installMedia({ matches: true, addEventListener: add, removeEventListener: remove });
    const view = render(<Probe />);
    expect(screen.getByText('reduce')).toBeInTheDocument();
    expect(add).toHaveBeenCalledWith('change', expect.any(Function));
    view.unmount();
    expect(remove).toHaveBeenCalledWith('change', add.mock.calls[0][1]);
    restoreMedia(original);
  });

  it('supports legacy listeners and safely handles absent or throwing APIs', () => {
    const add = vi.fn();
    const remove = vi.fn();
    let original = installMedia({ matches: true, addListener: add, removeListener: remove });
    const view = render(<Probe />);
    expect(screen.getByText('reduce')).toBeInTheDocument();
    view.unmount();
    expect(remove).toHaveBeenCalledWith(add.mock.calls[0][0]);
    restoreMedia(original);

    original = installMedia({ matches: false, addEventListener: () => { throw new Error('unsupported'); } });
    expect(() => render(<Probe />)).not.toThrow();
    cleanup();
    restoreMedia(original);

    original = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    Reflect.deleteProperty(window, 'matchMedia');
    expect(() => render(<Probe />)).not.toThrow();
    expect(screen.getByText('full')).toBeInTheDocument();
    restoreMedia(original);
  });
});
