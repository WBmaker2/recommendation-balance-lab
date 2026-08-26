import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';
import { useExperimentController } from './useExperimentController';

afterEach(cleanup);

function ControllerProbe(): React.JSX.Element {
  const { state } = useExperimentController();
  return (
    <output data-testid="controller-state">
      {JSON.stringify({ stage: state.stage, interest: state.interest, snapshots: state.balanceSnapshots, auditPair: state.auditPair, reportAssessment: state.reportAssessment })}
    </output>
  );
}

async function reachBalanceWithSnapshots(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole('button', { name: '실험 시작' }));
  const slot = screen.getAllByRole('article', { name: /추천 카드/ })[0];
  for (let count = 0; count < 3; count += 1) await user.click(slot.querySelector<HTMLButtonElement>('button')!);
  await user.click(screen.getAllByRole('radio', { name: '늘어난다' })[0]);
  await user.click(screen.getAllByRole('radio', { name: '줄어든다' })[1]);
  await user.click(screen.getByRole('button', { name: '다음 목록 예측' }));
  await user.click(screen.getAllByRole('radio', { name: '늘었다' })[0]);
  await user.click(screen.getAllByRole('radio', { name: '줄었다' })[1]);
  await user.click(screen.getByRole('button', { name: '분포 문장 확인' }));
  await user.click(screen.getAllByRole('button', { name: '낯선 주제 열기' })[0]);
  const slider = screen.getByLabelText('다양성 토큰 설정');
  await user.click(screen.getByRole('button', { name: '현재 설정 저장' }));
  fireEvent.change(slider, { target: { value: '1' } });
  await user.click(screen.getByRole('button', { name: '현재 설정 저장' }));
  fireEvent.change(slider, { target: { value: '2' } });
  await user.click(screen.getByRole('radio', { name: '관심 기록 비우기' }));
  await user.click(screen.getByRole('button', { name: '현재 설정 저장' }));
}

describe('controller fresh mount', () => {
  it('remounts an empty owned graph after an in-memory balance session', async () => {
    const user = userEvent.setup();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    if (!('sendBeacon' in navigator)) Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: vi.fn() });
    const sendBeacon = vi.spyOn(navigator, 'sendBeacon');
    const mounted = render(<App />);
    await reachBalanceWithSnapshots(user);
    expect(screen.getByText('서로 다른 설정 3/3개 저장됨')).toBeInTheDocument();
    mounted.unmount();

    render(<><App /><ControllerProbe /></>);
    expect(screen.getByRole('button', { name: '실험 시작' })).toBeInTheDocument();
    expect(JSON.parse(screen.getByTestId('controller-state').textContent ?? '{}')).toEqual({
      stage: 'intro',
      interest: { science: 0, art: 0, sports: 0, nature: 0, history: 0 },
      snapshots: [],
      auditPair: null,
      reportAssessment: null,
    });
    expect(setItem).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it('exports the exact controller contract', () => {
    expect(useExperimentController).toBeTypeOf('function');
  });
});
