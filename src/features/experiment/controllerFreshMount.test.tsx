import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';
import type { ExperimentState, PredictionAnswer } from '../../domain/experimentState';
import { useExperimentController, type ExperimentController } from './useExperimentController';

type BrowserTarget = object;
type BrowserDescriptor = { target: BrowserTarget; key: PropertyKey; descriptor: PropertyDescriptor | undefined };

const browserDescriptors = (): BrowserDescriptor[] => [
  { target: Storage.prototype, key: 'setItem', descriptor: Object.getOwnPropertyDescriptor(Storage.prototype, 'setItem') },
  { target: globalThis, key: 'fetch', descriptor: Object.getOwnPropertyDescriptor(globalThis, 'fetch') },
  { target: navigator, key: 'sendBeacon', descriptor: Object.getOwnPropertyDescriptor(navigator, 'sendBeacon') },
];

const restoreDescriptors = (descriptors: readonly BrowserDescriptor[]): void => {
  for (const { target, key, descriptor } of descriptors) {
    if (descriptor) Object.defineProperty(target, key, descriptor);
    else Reflect.deleteProperty(target, key);
  }
};

const initialBrowserDescriptors = browserDescriptors();

afterEach(() => {
  vi.restoreAllMocks();
  restoreDescriptors(initialBrowserDescriptors);
  cleanup();
});

function ControllerProbe({ onState }: { onState?: (state: ExperimentState) => void }): React.JSX.Element {
  const { state } = useExperimentController();
  onState?.(state);
  return (
    <output data-testid="controller-state">
      {JSON.stringify({ stage: state.stage, interest: state.interest, snapshots: state.balanceSnapshots, auditPair: state.auditPair, reportAssessment: state.reportAssessment })}
    </output>
  );
}

async function reachBalanceWithSnapshots(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole('button', { name: '실험 시작' }));
  const slot = screen.getAllByRole('article', { name: /추천 카드/ })[0];
  for (let count = 0; count < 3; count += 1) {
    await user.click(within(slot).getByRole('button', { name: '이 카드 선택' }));
  }
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
    const before = browserDescriptors();
    const firstState: { current?: ExperimentState } = {};
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    if (!('sendBeacon' in navigator)) Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: vi.fn() });
    const sendBeacon = vi.spyOn(navigator, 'sendBeacon');
    const mounted = render(<><App /><ControllerProbe onState={(state) => { firstState.current = state; }} /></>);
    await reachBalanceWithSnapshots(user);
    expect(screen.getByText('서로 다른 설정 3/3개 저장됨')).toBeInTheDocument();
    mounted.unmount();

    const secondState: { current?: ExperimentState } = {};
    render(<><App /><ControllerProbe onState={(state) => { secondState.current = state; }} /></>);
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
    expect(firstState.current?.interest).not.toBe(secondState.current?.interest);
    expect(firstState.current?.balanceSnapshots).not.toBe(secondState.current?.balanceSnapshots);
    expect(firstState.current?.reportDraft).not.toBe(secondState.current?.reportDraft);
    expect(firstState.current?.initialResult).not.toBe(secondState.current?.initialResult);
    restoreDescriptors(before);
    expect(browserDescriptors()).toEqual(before);
  });

  it('exports the exact controller contract', () => {
    expect(useExperimentController).toBeTypeOf('function');
  });

  it('does not leak browser API descriptors between probes', () => {
    expect(browserDescriptors()).toEqual(initialBrowserDescriptors);
  });

  it('canonicalizes only the two answer fields before dispatch', async () => {
    let controller: ExperimentController | undefined;
    const capture = (current: ExperimentController): void => {
      controller = current;
    };
    function AnswerProbe(): React.JSX.Element {
      const current = useExperimentController();
      useEffect(() => capture(current), [current]);
      return <output data-testid="answer-state">{current.state.stage}</output>;
    }
    render(<AnswerProbe />);
    act(() => controller!.start());
    for (let count = 0; count < 3; count += 1) {
      const card = controller!.state.choiceFeed[0];
      act(() => controller!.selectCard(card.id));
    }
    const invalid = { focusDirection: 'increase', varietyDirection: 'same', extra: 'reject' } as PredictionAnswer;
    act(() => controller!.submitPrediction(invalid));
    expect(controller!.state.stage).toBe('choice');
    expect(controller!.state.prediction).toBeNull();
  });
});
