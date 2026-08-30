import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MISSIONS } from '../../data/missions';
import { StageProgress } from './StageProgress';

afterEach(cleanup);

describe('StageProgress', () => {
  it('marks completed, current, and upcoming missions in curriculum order', () => {
    render(<StageProgress stage="balance" />);

    const items = within(screen.getByRole('navigation', { name: '미션 진행' })).getAllByRole('listitem');
    expect(items).toHaveLength(MISSIONS.length);
    expect(items.map((item) => item.getAttribute('data-stage-state'))).toEqual([
      'complete', 'complete', 'complete', 'current', 'upcoming',
    ]);
    expect(items[3]).toHaveAttribute('aria-current', 'step');
    expect(items[0]).not.toHaveAttribute('aria-current');
    expect(items[0]).toHaveTextContent('완료');
    expect(items[3]).toHaveTextContent('진행 중');
    expect(items[4]).toHaveTextContent('예정');
    expect(within(items[3]).getByText('미션 4. 균형 조정')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '미션 진행' })).toHaveClass('app-header__progress');
    expect(items[0]).toHaveClass('stage-progress__item');
    expect(items[3]).toHaveClass('stage-progress__item--current');
  });
});
