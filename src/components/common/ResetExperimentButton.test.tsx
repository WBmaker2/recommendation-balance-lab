import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResetExperimentButton } from './ResetExperimentButton';

const nativeShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
const nativeClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value(this: HTMLDialogElement) { this.setAttribute('open', ''); },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    },
  });
});

afterEach(() => {
  cleanup();
  if (nativeShowModal) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', nativeShowModal);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  if (nativeClose) Object.defineProperty(HTMLDialogElement.prototype, 'close', nativeClose);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});

describe('기록 지우기 native modal', () => {
  it('enters focus, cycles Tab directions, and restores trigger after Escape', async () => {
    const user = userEvent.setup();
    render(<ResetExperimentButton onReset={vi.fn()} />);
    const trigger = screen.getByRole('button', { name: '기록 지우기' });

    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: '실험 기록 지우기 확인' });
    const cancel = screen.getByRole('button', { name: '취소' });
    const confirm = screen.getByRole('button', { name: '기록을 지우고 처음으로' });
    expect(dialog).toBeInstanceOf(HTMLDialogElement);
    expect(document.activeElement).toBe(cancel);

    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(confirm);
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(cancel);
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(confirm);

    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it('restores trigger after cancel and calls reset once after confirm', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(<ResetExperimentButton onReset={onReset} />);
    const trigger = screen.getByRole('button', { name: '기록 지우기' });

    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: '취소' }));
    expect(document.activeElement).toBe(trigger);
    expect(onReset).not.toHaveBeenCalled();

    await user.click(trigger);
    const confirm = screen.getByRole('button', { name: '기록을 지우고 처음으로' });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(trigger);
  });
});
