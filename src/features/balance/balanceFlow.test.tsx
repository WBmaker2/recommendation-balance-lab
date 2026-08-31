import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';
import { BalanceControlPanel } from './BalanceControlPanel';
import { CARDS } from '../../data/cards';
import { SUPPLY_PROFILES } from '../../data/supplyProfiles';
import { createBalancePreview, saveBalanceSnapshot, type BalanceSnapshot } from '../../domain/balanceScenarios';

afterEach(cleanup);

const openBalance = async (): Promise<ReturnType<typeof userEvent.setup>> => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: '실험 시작' }));
  const slot = screen.getAllByRole('article', { name: /추천 카드/ })[0];
  for (let count = 0; count < 3; count += 1) await user.click(slot.querySelector<HTMLButtonElement>('button')!);
  await user.click(screen.getAllByRole('radio', { name: '늘어난다' })[0]);
  await user.click(screen.getAllByRole('radio', { name: '줄어든다' })[1]);
  await user.click(screen.getByRole('button', { name: '다음 목록 예측' }));
  await user.click(screen.getAllByRole('radio', { name: /^늘었다$/ })[0]);
  await user.click(screen.getAllByRole('radio', { name: /^줄었다$/ })[1]);
  await user.click(screen.getByRole('button', { name: '분포 문장 확인' }));
  await user.click(screen.getAllByRole('button', { name: '낯선 주제 열기' })[0]);
  return user;
};

describe('미션 4: 균형 설정 비교 learner flow', () => {
  it('saves exact A/B/C settings, compares without ranking, and keeps clear evidence', async () => {
    const user = await openBalance();
    expect(screen.getByRole('heading', { name: '미션 4. 균형 조정' })).toBeInTheDocument();
    expect(screen.getByLabelText('다양성 토큰 설정')).toHaveValue('0');
    expect(screen.getByRole('radio', { name: '관심 기록 유지' })).toBeChecked();
    expect(screen.getByRole('button', { name: '균형 비교' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '균형 비교' })).toHaveAttribute('data-gi-pulse', 'false');

    await user.click(screen.getByRole('button', { name: '현재 설정 저장' }));
    const slider = screen.getByLabelText('다양성 토큰 설정');
    fireEvent.change(slider, { target: { value: '2' } });
    await user.click(screen.getByRole('button', { name: '현재 설정 저장' }));
    fireEvent.change(slider, { target: { value: '1' } });
    await user.click(screen.getByRole('radio', { name: '관심 기록 비우기' }));
    await user.click(screen.getByRole('button', { name: '현재 설정 저장' }));

    expect(screen.getByText('서로 다른 설정 3/3개 저장됨')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '균형 비교' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '균형 비교' })).toHaveAttribute('data-gi-pulse', 'true');
    expect(screen.getByText('관심 기록 비우기는 이전 미션 증거를 삭제하지 않고 이번 계산에서만 관심 토큰을 0으로 둡니다.')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: /^설정 [123]$/ })).toHaveLength(3);
    expect(screen.queryByText(/scenario-[abc]/)).not.toBeInTheDocument();
    expect(screen.getByText('하나의 가장 좋은 비율을 정답으로 두지 않습니다.')).toBeInTheDocument();
    expect(screen.queryByText(/추천 설정|권장|공정|정답 설정|최고|최적/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '균형 비교' }));
    expect(screen.getByRole('heading', { name: '미션 5. 모델 감사' })).toBeInTheDocument();
    expect(screen.getByText('가상의 단순 규칙이며 실제 서비스 추천을 판정하지 않습니다')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '기록 지우기' }));
    await user.click(screen.getByRole('button', { name: '기록을 지우고 처음으로' }));
    expect(screen.getByRole('button', { name: '실험 시작' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '균형 비교' })).not.toBeInTheDocument();
  });
});

describe('BalanceControlPanel activation guard', () => {
  it('calls compare once and turns off pulse immediately after double activation', () => {
    const onCompare = vi.fn();
    const supply = SUPPLY_PROFILES.find((profile) => profile.id === 'balanced')!;
    const request = {
      interest: { science: 3, art: 0, sports: 0, nature: 0, history: 1 },
      diversityLevel: 0 as const,
      memoryMode: 'keep' as const,
      supplyProfileId: 'balanced' as const,
      round: 2,
      feedSize: 8 as const,
    };
    const configs = ([
      { diversityLevel: 0, memoryMode: 'keep' },
      { diversityLevel: 1, memoryMode: 'keep' },
      { diversityLevel: 2, memoryMode: 'keep' },
    ] as const);
    let snapshots: readonly BalanceSnapshot[] = [];
    for (const config of configs) {
      const saved = saveBalanceSnapshot(snapshots, config, createBalancePreview(request, config, CARDS, supply));
      if (saved.ok) snapshots = saved.snapshots;
    }
    render(<BalanceControlPanel config={{ diversityLevel: 0, memoryMode: 'keep' }} snapshots={snapshots} onConfigChange={vi.fn()} onSave={vi.fn()} onCompare={onCompare} />);
    const save = screen.getByRole('button', { name: '현재 설정 저장' });
    expect(save).toBeDisabled();
    expect(save).not.toHaveAttribute('data-gi-pulse');
    const compare = screen.getByRole('button', { name: '균형 비교' });
    expect(compare).toBeEnabled();
    act(() => {
      compare.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      compare.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onCompare).toHaveBeenCalledTimes(1);
    expect(compare).toHaveAttribute('data-gi-pulse', 'false');
    expect(compare).toBeDisabled();
  });

  it('highlights a new save action and replaces motion with a static cue when reduced motion is enabled', async () => {
    const onSave = vi.fn();
    const original = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    const media = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn(() => media) });
    const config = { diversityLevel: 0 as const, memoryMode: 'keep' as const };

    const { rerender } = render(
      <BalanceControlPanel config={config} snapshots={[]} onConfigChange={vi.fn()} onSave={onSave} onCompare={vi.fn()} />,
    );
    const slider = screen.getByLabelText('다양성 토큰 설정');
    expect(screen.getByText(/다양성 토큰은 다른 주제를 보여 주는 점수예요/)).toBeInTheDocument();
    expect(slider).toHaveAttribute('aria-describedby', 'diversity-level-help');
    const save = screen.getByRole('button', { name: '현재 설정 저장' });
    expect(save).toHaveAttribute('data-gi-pulse', 'true');
    expect(save).toHaveClass('gi-pulse');
    expect(screen.queryByText('지금 저장할 차례')).not.toBeInTheDocument();

    media.matches = true;
    act(() => media.addEventListener.mock.calls[0][1]({ matches: true }));
    rerender(<BalanceControlPanel config={config} snapshots={[]} onConfigChange={vi.fn()} onSave={onSave} onCompare={vi.fn()} />);
    expect(save).toHaveAttribute('data-gi-pulse', 'false');
    expect(save).not.toHaveClass('gi-pulse');
    expect(screen.getByText('지금 저장할 차례')).toBeInTheDocument();

    if (original) Object.defineProperty(window, 'matchMedia', original);
    else Reflect.deleteProperty(window, 'matchMedia');
  });
});
