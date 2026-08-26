import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../../App';

afterEach(cleanup);

async function reachBalance(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole('button', { name: '실험 시작' }));
  expect(document.activeElement).toBe(screen.getByRole('heading', { name: '미션 1. 선택의 흔적' }));
  const firstSlot = screen.getAllByRole('article', { name: /추천 카드/ })[0];
  for (let count = 0; count < 3; count += 1) {
    await user.click(within(firstSlot).getByRole('button', { name: '이 카드 선택' }));
  }
  await user.click(screen.getAllByRole('radio', { name: '늘어난다' })[0]);
  await user.click(screen.getAllByRole('radio', { name: '줄어든다' })[1]);
  await user.click(screen.getByRole('button', { name: '다음 목록 예측' }));
  expect(document.activeElement).toBe(screen.getByRole('heading', { name: '미션 2. 좁아진 창' }));
  await user.click(screen.getAllByRole('radio', { name: '늘었다' })[0]);
  await user.click(screen.getAllByRole('radio', { name: '줄었다' })[1]);
  await user.click(screen.getByRole('button', { name: '분포 문장 확인' }));
  expect(document.activeElement).toBe(screen.getByRole('heading', { name: '미션 3. 탐색 버튼' }));
  await user.click(screen.getAllByRole('button', { name: '낯선 주제 열기' })[0]);
  expect(document.activeElement).toBe(screen.getByRole('heading', { name: '미션 4. 균형 조정' }));
}

describe('complete learner flow', () => {
  it('completes all missions and starts a fresh experiment from completion', async () => {
    const user = userEvent.setup();
    render(<App />);
    await reachBalance(user);

    await user.click(screen.getByRole('button', { name: '현재 설정 저장' }));
    const slider = screen.getByLabelText('다양성 토큰 설정');
    fireEvent.change(slider, { target: { value: '2' } });
    await user.click(screen.getByRole('button', { name: '현재 설정 저장' }));
    fireEvent.change(slider, { target: { value: '1' } });
    await user.click(screen.getByRole('radio', { name: '관심 기록 비우기' }));
    await user.click(screen.getByRole('button', { name: '현재 설정 저장' }));
    await user.click(screen.getByRole('button', { name: '균형 비교' }));
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: '미션 5. 모델 감사' }));

    await user.click(screen.getByRole('radio', { name: '콘텐츠 공급' }));
    await user.click(screen.getByRole('button', { name: '변화 원인 확인' }));
    expect(document.activeElement).toBe(document.getElementById('mission-stage-title'));

    await user.click(screen.getByRole('radio', { name: /포커스 주제 카드 수가 늘어납니다/ }));
    await user.click(screen.getByRole('radio', { name: /나타난 주제 수가 줄어듭니다/ }));
    await user.click(screen.getAllByRole('checkbox')[0]);
    await user.click(screen.getAllByRole('checkbox')[1]);
    await user.click(screen.getAllByRole('checkbox')[2]);
    await user.click(screen.getByRole('radio', { name: /새로운 주제를 찾기/ }));
    await user.click(screen.getByRole('radio', { name: /scenario-a 설정의 실제 카드 수 사용/ }));
    await user.click(screen.getByRole('radio', { name: /^포커스 주제 카드 수$/ }));
    await user.click(screen.getByRole('radio', { name: /관찰한 포커스 주제 카드 수/ }));
    await user.click(screen.getByRole('radio', { name: '가상의 단순 규칙' }));
    await user.click(screen.getByRole('button', { name: '모델 보고서 제출' }));

    expect(screen.getByRole('heading', { name: '실험 완료' })).toBeInTheDocument();
    expect(document.activeElement).toBe(document.getElementById('mission-stage-title'));
    await user.click(screen.getByRole('button', { name: '새 실험 시작' }));
    expect(screen.getByRole('button', { name: '실험 시작' })).toBeInTheDocument();
    expect(screen.queryByText(/관심 토큰 [1-9]/)).not.toBeInTheDocument();
  });
});
