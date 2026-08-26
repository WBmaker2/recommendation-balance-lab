import { describe, expect, it } from 'vitest';
import { CARDS } from '../data/cards';
import { SUPPLY_PROFILES } from '../data/supplyProfiles';
import { buildAuditPair, cloneAuditPair } from './auditComparison';
import { createBalancePreview, saveBalanceSnapshot, type BalanceSnapshot } from './balanceScenarios';
import { countTopicCards } from './distribution';
import { completedFactorsForState } from './experimentStateReport';
import { emptyReportDraft } from './reportAssessment';
import { experimentReducer, initialExperimentState, type ExperimentState } from './experimentState';
import { recommend } from './recommendationEngine';
import { cloneRecommendationResult } from './recommendationResult';

const balanced = SUPPLY_PROFILES.find((profile) => profile.id === 'balanced')!;
const changed = recommend({ interest: { science: 3, art: 0, sports: 0, nature: 0, history: 0 }, diversityLevel: 0, memoryMode: 'keep', supplyProfileId: 'balanced', round: 1, feedSize: 8 }, CARDS, balanced);
const changedInterest = { science: 3, art: 0, sports: 0, nature: 1, history: 0 } as const;
const exploration = recommend({ ...changed.request, interest: changedInterest, round: 2 }, CARDS, balanced);

const snapshotsFor = (request: typeof exploration.request): readonly BalanceSnapshot[] => {
  let saved: readonly BalanceSnapshot[] = [];
  for (const [index, config] of [
    { diversityLevel: 0 as const, memoryMode: 'keep' as const },
    { diversityLevel: 1 as const, memoryMode: 'keep' as const },
    { diversityLevel: 2 as const, memoryMode: 'clear' as const },
  ].entries()) {
    const result = createBalancePreview(request, config, CARDS, balanced);
    const next = saveBalanceSnapshot(saved, config, result);
    if (!next.ok) throw new Error(`snapshot ${index} failed`);
    saved = next.snapshots;
  }
  return saved;
};

const readyState = (): ExperimentState => {
  const base = initialExperimentState();
  const snapshots = snapshotsFor(exploration.request);
  return {
    ...base,
    stage: 'report',
    changedResult: cloneRecommendationResult(changed),
    explorationResult: cloneRecommendationResult(exploration),
    focusTopicId: 'science',
    interest: { ...changedInterest },
    selectionHistory: [
      { cardId: 'science-1', topicId: 'science', ordinal: 1 },
      { cardId: 'science-2', topicId: 'science', ordinal: 2 },
      { cardId: 'science-3', topicId: 'science', ordinal: 3 },
    ],
    prediction: { focusDirection: 'increase', varietyDirection: 'decrease' },
    distributionAnswer: { focusDirection: 'increase', varietyDirection: 'decrease' },
    balanceSnapshots: snapshots,
    balanceCompared: true,
    auditPair: cloneAuditPair(buildAuditPair(changed.request, CARDS, SUPPLY_PROFILES)),
    auditAnswer: 'supply-condition',
    reportDraft: {
      ...emptyReportDraft(),
      focusDirection: 'increase', varietyDirection: 'decrease',
      acknowledgedFactors: ['choice-record', 'balance-setting', 'supply-condition'],
      purpose: 'discover', chosenSnapshotId: 'scenario-a', evidenceMetric: 'focus-card-count', evidenceValue: countTopicCards(snapshots[0].result.cards).science,
      limitationChoice: 'virtual-simple-model',
    },
    reportAssessment: null,
    lastError: null,
  };
};

describe('report evidence is bound to the current experiment chain', () => {
  it('accepts only a fully consistent choice, exploration, balance, and audit chain', () => {
    expect(completedFactorsForState(readyState())).toEqual(['choice-record', 'balance-setting', 'supply-condition']);
  });

  it('rejects canonical-looking evidence with a changed request that does not match the fixed choice contract', () => {
    const state = readyState();
    const altered = { ...state, changedResult: { ...state.changedResult!, request: { ...state.changedResult!.request, interest: { ...state.changedResult!.request.interest, science: 4 } } }, auditPair: buildAuditPair({ ...changed.request, interest: { science: 4, art: 0, sports: 0, nature: 0, history: 0 } }, CARDS, SUPPLY_PROFILES) };
    expect(completedFactorsForState(altered)).not.toContain('choice-record');
    expect(experimentReducer(altered, { type: 'COMPLETE_REPORT', assessment: { complete: true } as never }).stage).toBe('report');
    expect(completedFactorsForState({ ...state, focusTopicId: 'art' })).not.toContain('choice-record');
  });

  it('rejects balance snapshots when exploration is tampered or snapshots use another base request', () => {
    const state = readyState();
    const tamperedExploration = { ...state, explorationResult: { ...state.explorationResult!, request: { ...state.explorationResult!.request, interest: { ...state.explorationResult!.request.interest, nature: 0 } } } };
    expect(completedFactorsForState(tamperedExploration)).not.toContain('balance-setting');
    const unrelatedSnapshots = snapshotsFor(changed.request);
    const unrelated = { ...state, balanceSnapshots: unrelatedSnapshots };
    expect(completedFactorsForState(unrelated)).not.toContain('balance-setting');
    expect(experimentReducer(unrelated, { type: 'COMPLETE_REPORT', assessment: { complete: true } as never }).stage).toBe('report');
  });
});
