import { describe, expect, it } from 'vitest';
import { CARDS } from '../data/cards';
import { SUPPLY_PROFILES } from '../data/supplyProfiles';
import { buildAuditPair, cloneAuditPair } from './auditComparison';
import { createBalancePreview, saveBalanceSnapshot, type BalanceSnapshot } from './balanceScenarios';
import { compareDistributions, countTopicCards } from './distribution';
import { assessReport, emptyReportDraft, type ReportAssessment } from './reportAssessment';
import { experimentReducer, initialExperimentState, type ExperimentState } from './experimentState';
import { recommend } from './recommendationEngine';
import { cloneRecommendationResult } from './recommendationResult';

const balanced = SUPPLY_PROFILES.find((profile) => profile.id === 'balanced')!;
const changed = recommend({ interest: { science: 3, art: 0, sports: 0, nature: 0, history: 0 }, diversityLevel: 0, memoryMode: 'keep', supplyProfileId: 'balanced', round: 1, feedSize: 8 }, CARDS, balanced);
const exploration = recommend({ ...changed.request, interest: { science: 3, art: 0, sports: 0, nature: 1, history: 0 }, round: 2 }, CARDS, balanced);

const snapshotsFor = (): readonly BalanceSnapshot[] => {
  let saved: readonly BalanceSnapshot[] = [];
  for (const [index, config] of [
    { diversityLevel: 0 as const, memoryMode: 'keep' as const },
    { diversityLevel: 1 as const, memoryMode: 'keep' as const },
    { diversityLevel: 2 as const, memoryMode: 'clear' as const },
  ].entries()) {
    const result = createBalancePreview(exploration.request, config, CARDS, balanced);
    const next = saveBalanceSnapshot(saved, config, result);
    if (!next.ok) throw new Error(`snapshot ${index} failed`);
    saved = next.snapshots;
  }
  return saved;
};

const reportReadyState = (): ExperimentState => {
  const base = initialExperimentState();
  const snapshots = snapshotsFor();
  const auditPair = buildAuditPair(changed.request, CARDS, SUPPLY_PROFILES);
  return {
    ...base,
    stage: 'report',
    changedResult: cloneRecommendationResult(changed),
    explorationResult: cloneRecommendationResult(exploration),
    focusTopicId: 'science',
    interest: { science: 3, art: 0, sports: 0, nature: 1, history: 0 },
    selectionHistory: [
      { cardId: 'science-1', topicId: 'science', ordinal: 1 },
      { cardId: 'science-2', topicId: 'science', ordinal: 2 },
      { cardId: 'science-3', topicId: 'science', ordinal: 3 },
    ],
    prediction: { focusDirection: 'increase', varietyDirection: 'decrease' },
    distributionAnswer: { focusDirection: 'increase', varietyDirection: 'decrease' },
    balanceSnapshots: snapshots,
    balanceCompared: true,
    auditPair: cloneAuditPair(auditPair),
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

describe('모델 보고서 state gates', () => {
  it('starts with isolated report draft and reset clears assessment evidence', () => {
    const first = initialExperimentState();
    const second = initialExperimentState();
    expect(first.reportDraft).toEqual(emptyReportDraft());
    expect(first.reportDraft).not.toBe(second.reportDraft);
    expect(first.reportDraft.acknowledgedFactors).not.toBe(second.reportDraft.acknowledgedFactors);
    const ready = reportReadyState();
    const complete = experimentReducer(ready, { type: 'COMPLETE_REPORT', assessment: { complete: true } as ReportAssessment });
    const reset = experimentReducer(complete, { type: 'RESET' });
    expect(reset.stage).toBe('intro');
    expect(reset.reportAssessment).toBeNull();
    expect(reset.reportDraft).toEqual(emptyReportDraft());
    expect(reset.reportDraft).not.toBe(complete.reportDraft);
  });

  it('owns report updates only at report stage and preserves prior evidence', () => {
    const ready = reportReadyState();
    const draft = { ...ready.reportDraft, purpose: 'deepen' as const, acknowledgedFactors: [...ready.reportDraft.acknowledgedFactors] };
    const updated = experimentReducer(ready, { type: 'UPDATE_REPORT', draft });
    expect(updated.reportDraft).toEqual(draft);
    expect(updated.reportDraft).not.toBe(draft);
    expect(updated.changedResult).toBe(ready.changedResult);
    const rejected = experimentReducer({ ...ready, stage: 'audit' }, { type: 'UPDATE_REPORT', draft });
    expect(rejected.reportDraft).toBe(ready.reportDraft);
    expect(rejected.lastError).toBe('지금은 모델 보고서 단계가 아닙니다.');
  });

  it('recomputes canonical assessment and rejects forged completion', () => {
    const ready = reportReadyState();
    const forged = experimentReducer(ready, { type: 'COMPLETE_REPORT', assessment: {
      changeReading: true, causeSeparation: true, tradeoffJudgment: true, limitationAwareness: true, complete: true, feedback: [],
    } });
    expect(forged.stage).toBe('complete');
    const incomplete = reportReadyState();
    incomplete.reportDraft.evidenceValue = 0;
    const rejected = experimentReducer(incomplete, { type: 'COMPLETE_REPORT', assessment: { complete: true } as ReportAssessment });
    expect(rejected.stage).toBe('report');
    expect(rejected.reportAssessment?.tradeoffJudgment).toBe(false);
    expect(rejected.lastError).toContain('절충 판단');
    expect(experimentReducer(forged, { type: 'COMPLETE_REPORT', assessment: { complete: false } as ReportAssessment })).toEqual(forged);
  });

  it('does not fabricate cause evidence for a hand-crafted state', () => {
    const ready = reportReadyState();
    const missing = { ...ready, balanceCompared: false, balanceSnapshots: [] };
    const canonical = assessReport(missing.reportDraft, compareDistributions(countTopicCards(missing.initialResult.cards), countTopicCards(missing.changedResult!.cards)), [], []);
    expect(canonical.causeSeparation).toBe(false);
    expect(experimentReducer(missing, { type: 'COMPLETE_REPORT', assessment: { complete: true } as ReportAssessment }).stage).toBe('report');
  });
});
