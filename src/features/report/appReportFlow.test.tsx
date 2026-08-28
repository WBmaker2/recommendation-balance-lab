import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../../App';
import { LEARNING_GOALS, MODEL_WARNING } from '../../data/learningCopy';

afterEach(cleanup);

const completeToReport = async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: '실험 시작' }));
  const choose = () => screen.getAllByRole('button', { name: '이 카드 선택' })[0];
  await user.click(choose());
  await user.click(choose());
  await user.click(choose());
  await user.click(screen.getAllByRole('radio', { name: '늘어난다' })[0]);
  await user.click(screen.getAllByRole('radio', { name: '줄어든다' })[1]);
  await user.click(screen.getByRole('button', { name: '다음 목록 예측' }));
  await user.click(screen.getAllByRole('radio', { name: /^늘었다$/ })[0]);
  await user.click(screen.getAllByRole('radio', { name: /^줄었다$/ })[1]);
  await user.click(screen.getByRole('button', { name: '분포 문장 확인' }));
  await user.click(screen.getAllByRole('button', { name: '낯선 주제 열기' })[0]);
  await user.click(screen.getByRole('button', { name: '현재 설정 저장' }));
  const slider = screen.getByLabelText('다양성 토큰 설정');
  fireEvent.change(slider, { target: { value: '2' } });
  await user.click(screen.getByRole('button', { name: '현재 설정 저장' }));
  fireEvent.change(slider, { target: { value: '1' } });
  await user.click(screen.getByRole('radio', { name: '관심 기록 비우기' }));
  await user.click(screen.getByRole('button', { name: '현재 설정 저장' }));
  await user.click(screen.getByRole('button', { name: '균형 비교' }));
  await user.click(screen.getByRole('radio', { name: '콘텐츠 공급' }));
  await user.click(screen.getByRole('button', { name: '변화 원인 확인' }));
  return user;
};

describe('App report learner flow', () => {
  it('shows the first missing choice inside the report after an empty submit', async () => {
    const user = await completeToReport();
    await user.click(screen.getByRole('button', { name: '모델 보고서 제출' }));

    expect(screen.getByText('포커스 주제 카드 수 변화를 골라 주세요.')).toBeVisible();
    expect(document.activeElement).toBe(document.getElementById('report-focus-direction'));
    expect(screen.queryByRole('heading', { name: '실험 완료' })).not.toBeInTheDocument();
  });

  it('completes the report using observed controls and resets to a clean intro', async () => {
    const user = await completeToReport();
    expect(screen.getByRole('heading', { name: '모델 보고서' })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: '포커스 주제 카드 수가 늘어납니다' }));
    await user.click(screen.getByRole('radio', { name: '나타난 주제 수가 줄어듭니다' }));
    for (const factor of ['선택 기록', '균형 설정', '콘텐츠 공급']) {
      await user.click(screen.getByRole('checkbox', { name: factor }));
    }
    await user.click(screen.getByRole('radio', { name: '새로운 주제를 찾기' }));
    await user.click(screen.getByRole('radio', { name: /설정 1의 실제 카드 수 사용/ }));
    await user.click(screen.getByRole('radio', { name: '나타난 주제 수' }));
    await user.click(screen.getByRole('radio', { name: /나타난 주제 수: \d+개/ }));
    await user.click(screen.getByRole('radio', { name: '가상의 단순 규칙' }));
    await user.click(screen.getByRole('button', { name: '모델 보고서 제출' }));

    expect(screen.getByRole('heading', { name: '실험 완료' })).toBeInTheDocument();
    expect(screen.getAllByText(MODEL_WARNING).length).toBeGreaterThanOrEqual(1);
    for (const goal of LEARNING_GOALS) expect(screen.getByText(goal)).toBeInTheDocument();
    expect(screen.getByText(/새로운 주제를 찾는 목적에서.*설정 1.*선택 기록·균형 설정·콘텐츠 공급/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '새 실험 시작' }));
    expect(screen.getByRole('button', { name: '실험 시작' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '실험 완료' })).not.toBeInTheDocument();
    expect(screen.queryByText(/관심 토큰 [1-9]/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '모델 보고서 제출' })).not.toBeInTheDocument();
  });
});
