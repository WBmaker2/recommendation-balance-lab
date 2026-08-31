import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppShell } from '../layout/AppShell';
import type { ExperimentStage } from '../../domain/experimentState';
import { UPDATE_HISTORY } from '../../data/updateHistory';
import { UpdateHistoryDialog } from './UpdateHistoryDialog';

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

describe('업데이트 내역 dialog', () => {
  it('exports truthful ISO entries in chronological order', () => {
    expect(UPDATE_HISTORY[0]).toEqual({ date: '2026-08-26', category: '설계', summary: '최초 설계 문서 작성' });
    expect(UPDATE_HISTORY[1]).toEqual({ date: '2026-08-27', category: '개발', summary: 'MVP 구현과 디지털 시민성·접근성 검수' });
    expect(UPDATE_HISTORY[2]).toEqual({ date: '2026-08-27', category: '개선', summary: '네이티브 Escape 닫기 경로와 닫힘 후 포커스 복원을 단일화' });
    expect(UPDATE_HISTORY[3]).toEqual({ date: '2026-08-27', category: '개선', summary: '교실용 시각 체계와 모션 감소 대체 개선' });
    expect(UPDATE_HISTORY[4]).toEqual({ date: '2026-08-27', category: '개선', summary: '추천 전환·터치 영역·모션 감소 대체 검증 보강' });
    expect(UPDATE_HISTORY[5]).toEqual({ date: '2026-08-27', category: '개선', summary: '실제 추천 흐름 전환과 모션 환경 검증 보강' });
    expect(UPDATE_HISTORY[6]).toEqual({ date: '2026-08-27', category: '개선', summary: '모바일·키보드·스크린 리더 학습 흐름 개선' });
    expect(UPDATE_HISTORY.every((entry) => /^\d{4}-\d{2}-\d{2}$/.test(entry.date))).toBe(true);
    expect([...UPDATE_HISTORY].sort((left, right) => left.date.localeCompare(right.date))).toEqual(UPDATE_HISTORY);
  });

  it('opens an accessible native dialog, closes with button or Escape, and restores trigger focus', async () => {
    const user = userEvent.setup();
    render(<UpdateHistoryDialog entries={UPDATE_HISTORY} />);
    const trigger = screen.getByRole('button', { name: '업데이트 내역' });

    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: '업데이트 내역' }) as HTMLDialogElement;
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '업데이트 내역' })).toBeInTheDocument();
    expect([...dialog.querySelectorAll('time')].map((time) => time.dateTime)).toEqual(['2026-08-26', '2026-08-27', '2026-08-27', '2026-08-27', '2026-08-27', '2026-08-27', '2026-08-27', '2026-08-28', '2026-08-29', '2026-08-30', '2026-08-31']);
    expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '닫기' }));
    expect(screen.queryByRole('dialog', { name: '업데이트 내역' })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);

    await user.click(trigger);
    fireEvent.keyDown(screen.getByRole('dialog', { name: '업데이트 내역' }), { key: 'Escape' });
    expect(screen.getByRole('dialog', { name: '업데이트 내역' })).toBeInTheDocument();
    const cancelEvent = new Event('cancel', { cancelable: true });
    screen.getByRole('dialog', { name: '업데이트 내역' }).dispatchEvent(cancelEvent);
    expect(screen.queryByRole('dialog', { name: '업데이트 내역' })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it('restores focus when native close fires programmatically and cleans listeners on unmount', async () => {
    const user = userEvent.setup();
    const view = render(<UpdateHistoryDialog entries={UPDATE_HISTORY} />);
    const trigger = screen.getByRole('button', { name: '업데이트 내역' });

    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: '업데이트 내역' }) as HTMLDialogElement;
    dialog.close();
    expect(document.activeElement).toBe(trigger);

    view.unmount();
    dialog.dispatchEvent(new Event('close'));
    expect(document.activeElement).not.toBe(trigger);
  });

  it('keeps the trigger available in every experiment stage', () => {
    const stages: ExperimentStage[] = ['intro', 'choice', 'comparison', 'exploration', 'balance', 'audit', 'report', 'complete'];
    for (const stage of stages) {
      const view = render(<AppShell stage={stage} onReset={() => undefined}><p>stage</p></AppShell>);
      expect(screen.getByRole('button', { name: '업데이트 내역' })).toBeInTheDocument();
      view.unmount();
    }
  });
});
