import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CARDS } from '../../data/cards';
import { SUPPLY_PROFILES } from '../../data/supplyProfiles';
import { recommend } from '../../domain/recommendationEngine';
import { ExplorationPanel } from './ExplorationPanel';

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'matchMedia');
  vi.restoreAllMocks();
});

const supply = SUPPLY_PROFILES.find((profile) => profile.id === 'balanced')!;
const currentResult = recommend({
  interest: { science: 3, art: 0, sports: 0, nature: 0, history: 0 },
  diversityLevel: 0,
  memoryMode: 'keep',
  supplyProfileId: 'balanced',
  round: 1,
  feedSize: 8,
}, CARDS, supply);

const setReducedMotion = (matches: boolean): void => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn(() => ({
      matches,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList)),
  });
};

describe('낯선 주제 탐색 learner flow', () => {
  it('highlights the first candidate action while leaving alternatives available', async () => {
    setReducedMotion(false);
    const user = userEvent.setup();
    render(<ExplorationPanel currentResult={currentResult} focusTopicId="science" onExplore={vi.fn()} />);

    const actions = screen.getAllByRole('button', { name: '낯선 주제 열기' });
    expect(actions).toHaveLength(3);
    expect(actions[0]).toHaveAttribute('data-gi-pulse', 'true');
    expect(actions[0]).toHaveClass('gi-pulse');
    expect(actions[1]).not.toHaveAttribute('data-gi-pulse');
    await user.click(actions[0]);
  });

  it('replaces the pulse with a static cue under reduced motion', () => {
    setReducedMotion(true);
    render(<ExplorationPanel currentResult={currentResult} focusTopicId="science" onExplore={vi.fn()} />);

    const actions = screen.getAllByRole('button', { name: '낯선 주제 열기' });
    expect(actions[0]).toHaveAttribute('data-gi-pulse', 'false');
    expect(actions[0]).not.toHaveClass('gi-pulse');
    expect(screen.getByText('지금 열어 볼 차례')).toHaveClass('motion-static-label');
  });
});
