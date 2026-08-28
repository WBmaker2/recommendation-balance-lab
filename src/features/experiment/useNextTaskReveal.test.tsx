import { cleanup, render } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useNextTaskReveal } from './useNextTaskReveal';

afterEach(cleanup);

function Probe({ active, targetId = 'next-task' }: { active: boolean; targetId?: string }): React.JSX.Element {
  useNextTaskReveal({ active, targetId });
  return <div id={targetId} tabIndex={-1}>다음 행동</div>;
}

describe('useNextTaskReveal', () => {
  it('does nothing while inactive and reveals the target once when activated', () => {
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    const scroll = vi.fn();
    const originalScroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scroll });

    const view = render(<Probe active={false} />);
    expect(focus).not.toHaveBeenCalled();
    expect(scroll).not.toHaveBeenCalled();

    view.rerender(<Probe active />);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(scroll).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });

    view.rerender(<Probe active />);
    expect(focus).toHaveBeenCalledTimes(1);
    expect(scroll).toHaveBeenCalledTimes(1);

    view.unmount();
    if (originalScroll) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', originalScroll);
    else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  });

  it('safely focuses when scrollIntoView is unavailable and supports a later activation', () => {
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    const originalScroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');

    const view = render(<Probe active />);
    expect(focus).toHaveBeenCalledTimes(1);

    view.rerender(<Probe active={false} />);
    view.rerender(<Probe active />);
    expect(focus).toHaveBeenCalledTimes(2);

    view.unmount();
    if (originalScroll) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', originalScroll);
  });

  it('does not repeat focus or scroll during StrictMode effect checks', () => {
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    const scroll = vi.fn();
    const originalScroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scroll });

    render(<StrictMode><Probe active /></StrictMode>);

    expect(focus).toHaveBeenCalledTimes(1);
    expect(scroll).toHaveBeenCalledTimes(1);
    if (originalScroll) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', originalScroll);
    else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  });
});
