import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../../App';

afterEach(cleanup);

const openAudit = async (): Promise<ReturnType<typeof userEvent.setup>> => {
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
  await user.click(screen.getByRole('button', { name: '현재 설정 저장' }));
  const slider = screen.getByLabelText('다양성 토큰 설정');
  fireEvent.change(slider, { target: { value: '2' } });
  await user.click(screen.getByRole('button', { name: '현재 설정 저장' }));
  fireEvent.change(slider, { target: { value: '1' } });
  await user.click(screen.getByRole('radio', { name: '관심 기록 비우기' }));
  await user.click(screen.getByRole('button', { name: '현재 설정 저장' }));
  await user.click(screen.getByRole('button', { name: '균형 비교' }));
  return user;
};

describe('App Mission 5 learner flow', () => {
  it('records the changedResult-request pair, revises an answer, reports, and resets', async () => {
    const user = await openAudit();
    expect(screen.getByRole('heading', { name: '미션 5. 모델 감사' })).toBeInTheDocument();
    const balancedTable = screen.getByRole('table', { name: '균형 공급 결과 표' });
    const natureRichTable = screen.getByRole('table', { name: '자연 풍부 공급 결과 표' });
    expect(within(within(balancedTable).getByRole('row', { name: /과학/ })).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['8장', '1', '5장']);
    expect(within(within(natureRichTable).getByRole('row', { name: /과학/ })).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['5장', '1', '4장']);
    expect(screen.getByText('선택과 설정은 같고, 공급 목록의 기본 토큰만 달라졌습니다.')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: '선택 기록' }));
    await user.click(screen.getByRole('button', { name: '변화 원인 확인' }));
    expect(screen.getByRole('alert')).toHaveTextContent('선택과 설정은 같았습니다. 바뀐 공급 조건을 다시 찾아보세요.');
    await user.click(screen.getByRole('radio', { name: '콘텐츠 공급' }));
    await user.click(screen.getByRole('button', { name: '변화 원인 확인' }));
    expect(screen.getByRole('heading', { name: '모델 보고서' })).toBeInTheDocument();
    expect(screen.getByText('가상의 단순 규칙이며 실제 서비스 추천을 판정하지 않습니다')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '기록 지우기' }));
    await user.click(screen.getByRole('button', { name: '기록을 지우고 처음으로' }));
    expect(screen.getByRole('button', { name: '실험 시작' })).toBeInTheDocument();
  });
});
