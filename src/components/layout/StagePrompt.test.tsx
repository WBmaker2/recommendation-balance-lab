import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StagePrompt } from './StagePrompt';

afterEach(cleanup);

describe('StagePrompt', () => {
  it('renders one current-action prompt in learner reading order', () => {
    render(
      <StagePrompt
        eyebrow="미션 2"
        title="표의 변화를 읽어 보세요"
        description="두 목록의 카드 수를 비교합니다."
        completionHint="두 문장을 고르면 다음 미션으로 갑니다."
      >
        <button type="button">확인</button>
      </StagePrompt>,
    );

    const prompt = screen.getByRole('region');
    expect(prompt).toHaveAttribute('data-prompt-kind', 'current-action');
    expect(prompt).toHaveClass('stage-prompt');
    expect(prompt).toHaveTextContent('미션 2');
    expect(prompt).toHaveTextContent('표의 변화를 읽어 보세요');
    expect(prompt).toHaveTextContent('완료 조건: 두 문장을 고르면 다음 미션으로 갑니다.');
    expect(within(prompt).getByRole('button', { name: '확인' })).toBeInTheDocument();
  });
});
