import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PredictionPanel } from './PredictionPanel';

afterEach(cleanup);

describe('다음 목록 예측 learner flow', () => {
  it('explains the focus topic before asking for two directions', () => {
    render(<PredictionPanel focusTopicId="science" selectionCount={3} onSubmit={vi.fn()} />);

    expect(screen.getByText('포커스 주제는 방금 같은 자리에 세 번 고른 주제예요.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음 목록 예측' })).toBeDisabled();
  });
});
