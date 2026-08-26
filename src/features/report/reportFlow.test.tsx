import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CARDS } from '../../data/cards';
import { LEARNING_GOALS, MODEL_WARNING } from '../../data/learningCopy';
import { SUPPLY_PROFILES } from '../../data/supplyProfiles';
import { compareDistributions, countTopicCards } from '../../domain/distribution';
import { createBalancePreview } from '../../domain/balanceScenarios';
import { recommend } from '../../domain/recommendationEngine';
import { emptyReportDraft } from '../../domain/reportAssessment';
import { CompletionScreen } from './CompletionScreen';
import { ModelReport } from './ModelReport';

afterEach(cleanup);

const balanced = SUPPLY_PROFILES.find((profile) => profile.id === 'balanced')!;
const initial = recommend({ interest: { science: 0, art: 0, sports: 0, nature: 0, history: 0 }, diversityLevel: 0, memoryMode: 'keep', supplyProfileId: 'balanced', round: 0, feedSize: 8 }, CARDS, balanced);
const changed = recommend({ interest: { science: 3, art: 0, sports: 0, nature: 0, history: 0 }, diversityLevel: 0, memoryMode: 'keep', supplyProfileId: 'balanced', round: 1, feedSize: 8 }, CARDS, balanced);
const snapshots = [0, 1, 2].map((level, index) => {
  const config = { diversityLevel: level as 0 | 1 | 2, memoryMode: 'keep' as const };
  const result = createBalancePreview(changed.request, config, CARDS, balanced);
  return { id: `scenario-${String.fromCharCode(97 + index)}` as 'scenario-a' | 'scenario-b' | 'scenario-c', config, result };
});

describe('model report controls', () => {
  it('renders controlled choices, all three scenarios, and no free-text/share controls', () => {
    const onChange = vi.fn();
    render(<ModelReport draft={emptyReportDraft()} evidence={{ distributionDelta: compareDistributions(countTopicCards(initial.cards), countTopicCards(changed.cards)), snapshots, completedFactors: ['choice-record', 'balance-setting', 'supply-condition'] }} onChange={onChange} onSubmit={vi.fn()} />);
    expect(screen.getByRole('heading', { name: '모델 보고서' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio').length).toBeGreaterThan(4);
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /공유|다운로드|점수|순위/ })).not.toBeInTheDocument();
  });

  it('completion preserves the warning, four goals, structured sentence, and reset only', () => {
    const onReset = vi.fn();
    render(<CompletionScreen draft={{ ...emptyReportDraft(), purpose: 'discover', chosenSnapshotId: 'scenario-a', evidenceMetric: 'topic-variety', evidenceValue: 5, limitationChoice: 'virtual-simple-model', acknowledgedFactors: ['choice-record', 'balance-setting', 'supply-condition'] }} evidence={{ distributionDelta: compareDistributions(countTopicCards(initial.cards), countTopicCards(changed.cards)), snapshots, completedFactors: ['choice-record', 'balance-setting', 'supply-condition'] }} onReset={onReset} />);
    expect(screen.getByRole('heading', { name: '실험 완료' })).toBeInTheDocument();
    for (const goal of LEARNING_GOALS) expect(screen.getByText(goal)).toBeInTheDocument();
    expect(screen.getByText(MODEL_WARNING)).toBeInTheDocument();
    const sentence = screen.getByText(/새로운 주제를 찾기/);
    expect(sentence).toHaveTextContent(/scenario-a/);
    expect(sentence).toHaveTextContent(/다양성 토큰 0/);
    expect(sentence).toHaveTextContent(/관심 기록 유지/);
    expect(sentence).toHaveTextContent(/나타난 주제 수/);
    expect(sentence).toHaveTextContent(/5/);
    expect(sentence).toHaveTextContent(/선택 기록·균형 설정·콘텐츠 공급/);
    expect(sentence).toHaveTextContent(MODEL_WARNING);
    expect(screen.getByRole('button', { name: '새 실험 시작' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});
