import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CARDS } from '../../data/cards';
import { SUPPLY_PROFILES } from '../../data/supplyProfiles';
import { recommend } from '../../domain/recommendationEngine';
import { RecommendationFeed } from './RecommendationFeed';

afterEach(cleanup);

const supply = SUPPLY_PROFILES.find((profile) => profile.id === 'balanced')!;
const request = {
  interest: { science: 0, art: 0, sports: 0, nature: 0, history: 0 },
  diversityLevel: 0 as const, memoryMode: 'keep' as const, supplyProfileId: 'balanced' as const, round: 0, feedSize: 8 as const,
};
const initial = recommend(request, CARDS, supply);
const changed = recommend({ ...request, interest: { ...request.interest, science: 1 }, round: 1 }, CARDS, supply);

const renderFeed = (reduced: boolean) => {
  const original = Object.getOwnPropertyDescriptor(window, 'matchMedia');
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({ matches: reduced, media: '(prefers-reduced-motion: reduce)', addEventListener: () => undefined, removeEventListener: () => undefined }),
  });
  const view = render(<RecommendationFeed result={initial} selectedIds={[]} focusTopicId="science" onSelect={() => undefined} />);
  return { original, view };
};

describe('RecommendationFeed transitions', () => {
  it('marks the feed compact and groups each card action pair', () => {
    render(<RecommendationFeed result={initial} selectedIds={[]} focusTopicId="science" onSelect={() => undefined} />);

    const feed = screen.getByRole('region', { name: '현재 추천 피드' });
    expect(feed).toHaveClass('recommendation-feed');
    expect(feed).toHaveAttribute('data-feed-density', 'compact');
    expect(feed.querySelectorAll('.recommendation-card__actions')).toHaveLength(8);
    expect(feed.querySelectorAll('.recommendation-card__actions button')).toHaveLength(16);
  });

  it('mounts the before/after transition after an accepted replacement, not initially', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const view = render(<RecommendationFeed result={initial} selectedIds={[]} focusTopicId="science" onSelect={onSelect} />);
    expect(screen.queryByLabelText('카드 재배치 장면')).not.toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: '이 카드 선택' })[0]);
    view.rerender(<RecommendationFeed result={changed} selectedIds={[changed.cards[0].id]} focusTopicId="science" onSelect={onSelect} />);
    expect(screen.getByLabelText('카드 재배치 장면')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: '추천 주제 분포 전후 비교' })).toBeInTheDocument();
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('uses the same static table and sentence under reduced motion', async () => {
    const user = userEvent.setup();
    const { original, view } = renderFeed(true);
    await user.click(screen.getAllByRole('button', { name: '이 카드 선택' })[0]);
    view.rerender(<RecommendationFeed result={changed} selectedIds={[changed.cards[0].id]} focusTopicId="science" onSelect={() => undefined} />);
    expect(screen.queryByLabelText('카드 재배치 장면')).not.toBeInTheDocument();
    expect(screen.getByText('지금 할 차례')).toHaveClass('motion-static-label');
    expect(screen.getByRole('table', { name: '추천 주제 분포 전후 비교' })).toBeInTheDocument();
    if (original) Object.defineProperty(window, 'matchMedia', original);
    else Reflect.deleteProperty(window, 'matchMedia');
  });
});
