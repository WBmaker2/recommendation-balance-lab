import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { CARDS } from '../../data/cards';
import { SUPPLY_PROFILES } from '../../data/supplyProfiles';
import { recommend } from '../../domain/recommendationEngine';
import { RuleTransparencyPanel } from './RuleTransparencyPanel';

afterEach(cleanup);

const supply = SUPPLY_PROFILES.find((profile) => profile.id === 'balanced')!;
const result = recommend({
  interest: { science: 3, art: 0, sports: 0, nature: 0, history: 0 },
  diversityLevel: 0,
  memoryMode: 'keep',
  supplyProfileId: 'balanced',
  round: 1,
  feedSize: 8,
}, CARDS, supply);

describe('추천 규칙 투명창 learner flow', () => {
  it('keeps the learner summary visible and technical token table collapsed', async () => {
    const user = userEvent.setup();
    render(<RuleTransparencyPanel result={result} />);

    expect(screen.getByText(/토큰은 주제마다 붙는 점수예요/)).toBeInTheDocument();
    const details = screen.getByText('토큰 계산표 자세히 보기').closest('details');
    expect(details).not.toHaveAttribute('open');
    expect(details?.querySelector('table[aria-label="현재 추천 규칙의 주제별 토큰"]')).toBeInTheDocument();

    await user.click(screen.getByText('토큰 계산표 자세히 보기'));
    expect(details).toHaveAttribute('open');
    expect(screen.getByRole('table', { name: '현재 추천 규칙의 주제별 토큰' })).toBeInTheDocument();
    for (const heading of ['주제', '기본 토큰', '관심 토큰', '관심 토큰 × 2', '다양성 토큰', '전체 토큰']) {
      expect(screen.getByRole('columnheader', { name: heading })).toBeInTheDocument();
    }
  });
});
