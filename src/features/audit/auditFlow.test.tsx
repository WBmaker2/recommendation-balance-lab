import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CARDS } from '../../data/cards';
import { SUPPLY_PROFILES } from '../../data/supplyProfiles';
import { buildAuditPair } from '../../domain/auditComparison';
import { SupplyAuditPanel } from './SupplyAuditPanel';

afterEach(cleanup);

const pair = buildAuditPair({
  interest: { science: 3, art: 0, sports: 0, nature: 0, history: 0 },
  diversityLevel: 0,
  memoryMode: 'keep',
  supplyProfileId: 'balanced',
  round: 1,
  feedSize: 8,
}, CARDS, SUPPLY_PROFILES);

describe('미션 5 공급 조건 감사 learner flow', () => {
  it('shows two complete evidence tables and revisable causal choice', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(<SupplyAuditPanel pair={pair} onAnswer={onAnswer} />);
    expect(screen.getByText('선택과 설정은 같고, 공급 목록의 기본 토큰만 달라졌습니다.')).toBeInTheDocument();
    expect(screen.getByText('사용자 선택은 여러 영향 요인 가운데 하나이며, 이 비교에서는 콘텐츠 공급만 바뀌었습니다.')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: '균형 공급 결과 표' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: '자연 풍부 공급 결과 표' })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(12);
    expect(screen.getByRole('button', { name: '변화 원인 확인' })).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: '다양성 설정' }));
    expect(screen.getByRole('status')).toHaveTextContent('바뀐 공급 조건');
    await user.click(screen.getByRole('button', { name: '변화 원인 확인' }));
    await user.click(screen.getByRole('radio', { name: '콘텐츠 공급' }));
    const submit = screen.getByRole('button', { name: '변화 원인 확인' });
    await user.click(submit);
    await user.click(submit);
    expect(onAnswer).toHaveBeenCalledTimes(2);
    expect(submit).not.toHaveAttribute('data-gi-pulse');
    expect(submit).not.toHaveClass('gi-pulse');
  });
});
