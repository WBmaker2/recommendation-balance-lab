import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { useState } from 'react';
import { CARDS } from '../../data/cards';
import { SUPPLY_PROFILES } from '../../data/supplyProfiles';
import { recommend } from '../../domain/recommendationEngine';
import { WhyThisCardDialog } from './WhyThisCardDialog';

afterEach(cleanup);

const supply = SUPPLY_PROFILES.find((profile) => profile.id === 'balanced')!;
const result = recommend({
  interest: { science: 0, art: 0, sports: 0, nature: 0, history: 0 },
  diversityLevel: 0,
  memoryMode: 'keep',
  supplyProfileId: 'balanced',
  round: 0,
  feedSize: 8,
}, CARDS, supply);

function Harness(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>왜 이 카드가 나왔나요?</button>
      {open ? <WhyThisCardDialog explanation={result.explanations[0]} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

describe('WhyThisCardDialog learner flow', () => {
  it('shows a child-friendly summary before technical details', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: '왜 이 카드가 나왔나요?' }));
    const dialog = screen.getByRole('dialog', { name: '추천 이유' });
    expect(dialog).toHaveTextContent('관심을 보인 주제에 점수를 더해 이 카드가 먼저 보였어요.');
    expect(dialog).toHaveTextContent('관심 토큰');
    expect(dialog).not.toHaveTextContent(/round|topicIndex|topicCandidateCount/);
    expect(screen.getByText('자세한 계산 보기')).toBeInTheDocument();
    expect(dialog.querySelector('details')).not.toHaveAttribute('open');

    await user.click(screen.getByText('자세한 계산 보기'));
    expect(dialog).toHaveTextContent('round × 2');
    expect(dialog).toHaveTextContent('topicCandidateCount');
  });

  it('keeps focus contained and restores the trigger after Escape', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: '왜 이 카드가 나왔나요?' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: '추천 이유' });
    expect(document.activeElement).toBe(dialog);
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: '닫기' }));
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(dialog);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: '추천 이유' })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });
});
