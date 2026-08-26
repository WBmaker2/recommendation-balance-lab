import { describe, expect, it } from 'vitest';
import { CARDS } from '../data/cards';
import { SUPPLY_PROFILES } from '../data/supplyProfiles';
import { PURPOSE_LABELS } from '../data/learningCopy';
import { TOPIC_ORDER } from '../data/topics';
import { compareDistributions, countTopicCards } from './distribution';
import { createBalancePreview, saveBalanceSnapshot, type BalanceSnapshot } from './balanceScenarios';
import { assessReport, buildReportSentence, emptyReportDraft, type ReportDraft } from './reportAssessment';
import { recommend } from './recommendationEngine';
import type { InfluenceFactor, LearningPurpose, TopicId } from './types';

const balanced = SUPPLY_PROFILES.find((profile) => profile.id === 'balanced')!;
const initial = recommend({
  interest: { science: 0, art: 0, sports: 0, nature: 0, history: 0 },
  diversityLevel: 0, memoryMode: 'keep', supplyProfileId: 'balanced', round: 0, feedSize: 8,
}, CARDS, balanced);
const changed = recommend({
  interest: { science: 3, art: 0, sports: 0, nature: 0, history: 0 },
  diversityLevel: 0, memoryMode: 'keep', supplyProfileId: 'balanced', round: 1, feedSize: 8,
}, CARDS, balanced);
const delta = compareDistributions(countTopicCards(initial.cards), countTopicCards(changed.cards));
const allFactors: readonly InfluenceFactor[] = ['choice-record', 'balance-setting', 'supply-condition'];

const snapshots = ((): readonly BalanceSnapshot[] => {
  const configs = [
    { diversityLevel: 0 as const, memoryMode: 'keep' as const },
    { diversityLevel: 1 as const, memoryMode: 'keep' as const },
    { diversityLevel: 2 as const, memoryMode: 'clear' as const },
  ];
  let saved: readonly BalanceSnapshot[] = [];
  for (const config of configs) {
    const result = createBalancePreview(changed.request, config, CARDS, balanced);
    const next = saveBalanceSnapshot(saved, config, result);
    if (!next.ok) throw new Error('test snapshot setup failed');
    saved = next.snapshots;
  }
  return saved;
})();

const focusFor = (snapshot: BalanceSnapshot): TopicId => {
  return TOPIC_ORDER.reduce((best, topicId) => (
    snapshot.result.request.interest[topicId] > snapshot.result.request.interest[best] ? topicId : best
  ), TOPIC_ORDER[0]);
};

const observedValue = (snapshot: BalanceSnapshot, metric: ReportDraft['evidenceMetric']): number => {
  const counts = countTopicCards(snapshot.result.cards);
  if (metric === 'focus-card-count') return counts[focusFor(snapshot)];
  return TOPIC_ORDER.filter((topicId) => counts[topicId] > 0).length;
};

const validDraft = (snapshot: BalanceSnapshot, purpose: LearningPurpose, metric: ReportDraft['evidenceMetric'] = 'focus-card-count'): ReportDraft => ({
  ...emptyReportDraft(),
  focusDirection: 'increase',
  varietyDirection: 'decrease',
  acknowledgedFactors: [...allFactors],
  purpose,
  chosenSnapshotId: snapshot.id,
  evidenceMetric: metric,
  evidenceValue: observedValue(snapshot, metric),
  limitationChoice: 'virtual-simple-model',
});

describe('evidence-based model report assessment', () => {
  it('accepts every saved snapshot, purpose, and factual metric combination', () => {
    for (const snapshot of snapshots) {
      for (const purpose of ['discover', 'deepen'] as const) {
        for (const metric of ['focus-card-count', 'topic-variety'] as const) {
          expect(assessReport(validDraft(snapshot, purpose, metric), delta, snapshots, allFactors).complete).toBe(true);
        }
      }
    }
    expect(PURPOSE_LABELS.discover).toBe('새로운 주제를 찾기');
  });

  it('requires observed counts and the virtual-model limitation', () => {
    const draft = validDraft(snapshots[0], 'discover');
    expect(assessReport({ ...draft, evidenceValue: draft.evidenceValue! + 1 }, delta, snapshots, allFactors).tradeoffJudgment).toBe(false);
    expect(assessReport({ ...draft, limitationChoice: 'actual-platform-measurement' }, delta, snapshots, allFactors).limitationAwareness).toBe(false);
    expect(assessReport({ ...draft, limitationChoice: 'habit-diagnosis' }, delta, snapshots, allFactors).limitationAwareness).toBe(false);
  });

  it('requires exactly three distinct completed factors', () => {
    const draft = validDraft(snapshots[0], 'deepen');
    for (const factors of [[], ['choice-record', 'balance-setting'], ['choice-record', 'choice-record', 'supply-condition'], ['choice-record', 'balance-setting', 'unknown']]) {
      expect(assessReport(draft, delta, snapshots, factors as never).causeSeparation).toBe(false);
    }
  });

  it('is total for malformed, sparse, and inaccessible inputs', () => {
    const malformed = [null, undefined, {}, [], { get focusDirection() { throw new Error('blocked'); } }];
    for (const value of malformed) {
      expect(() => assessReport(value as never, delta, snapshots, allFactors)).not.toThrow();
      expect(assessReport(value as never, delta, snapshots, allFactors).complete).toBe(false);
    }
    const sparse = [...snapshots] as BalanceSnapshot[];
    delete sparse[1];
    expect(() => assessReport(validDraft(snapshots[0], 'discover'), delta, sparse, allFactors)).not.toThrow();
    expect(assessReport(validDraft(snapshots[0], 'discover'), delta, sparse, allFactors).tradeoffJudgment).toBe(false);
  });

  it('does not trust a malformed delta or a stored topicCounts value', () => {
    const draft = validDraft(snapshots[0], 'discover');
    const malformed = { ...delta, delta: { ...delta.delta, science: 99 } };
    expect(assessReport(draft, malformed, snapshots, allFactors).changeReading).toBe(false);
    const tampered = { ...snapshots[0], result: { ...snapshots[0].result, topicCounts: { ...snapshots[0].result.topicCounts, science: 0 } } };
    const altered = [tampered, snapshots[1], snapshots[2]] as readonly BalanceSnapshot[];
    expect(assessReport(validDraft(tampered, 'discover'), delta, altered, allFactors).tradeoffJudgment).toBe(false);
  });

  it('returns a fresh empty draft each time', () => {
    const first = emptyReportDraft();
    const second = emptyReportDraft();
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first.acknowledgedFactors).not.toBe(second.acknowledgedFactors);
  });

  it('rejects accessor and non-enumerable properties across report evidence', () => {
    const draft = validDraft(snapshots[0], 'discover');
    const getterDraft = { ...draft } as Record<string, unknown>;
    Object.defineProperty(getterDraft, 'focusDirection', { enumerable: true, get: () => 'increase' });
    expect(assessReport(getterDraft as never, delta, snapshots, allFactors).complete).toBe(false);
    const hiddenDraft = { ...draft } as Record<string, unknown>;
    Object.defineProperty(hiddenDraft, 'purpose', { enumerable: false, value: 'discover' });
    expect(assessReport(hiddenDraft as never, delta, snapshots, allFactors).complete).toBe(false);

    const getterDelta = { ...delta } as Record<string, unknown>;
    Object.defineProperty(getterDelta, 'delta', { enumerable: true, get: () => delta.delta });
    expect(assessReport(draft, getterDelta as never, snapshots, allFactors).complete).toBe(false);
    const hiddenSnapshots = snapshots.map((snapshot) => ({ ...snapshot })) as typeof snapshots;
    Object.defineProperty(hiddenSnapshots[0], 'config', { enumerable: false, value: snapshots[0].config });
    expect(assessReport(draft, delta, hiddenSnapshots, allFactors).complete).toBe(false);

    const accessorFactors = [...allFactors] as InfluenceFactor[];
    Object.defineProperty(accessorFactors, '0', { enumerable: true, get: () => 'choice-record' });
    expect(assessReport(draft, delta, snapshots, accessorFactors).complete).toBe(false);
  });

  it('generates a factual sentence with purpose, configuration, metric, factors, and warning only', () => {
    const draft = validDraft(snapshots[0], 'discover', 'topic-variety');
    const sentence = buildReportSentence(draft, { distributionDelta: delta, snapshots, completedFactors: allFactors });
    expect(sentence).toContain('새로운 주제를 찾기');
    expect(sentence).toContain('scenario-a');
    expect(sentence).toContain('다양성 토큰 0');
    expect(sentence).toContain('관심 기록 유지');
    expect(sentence).toContain('나타난 주제 수');
    expect(sentence).toContain(String(draft.evidenceValue));
    expect(sentence).toContain('선택 기록·균형 설정·콘텐츠 공급');
    expect(sentence).toContain('가상의 단순 규칙이며 실제 서비스 추천을 판정하지 않습니다');
    expect(sentence).not.toMatch(/이름|계정|학생|공유|다운로드|점수|순위|최고|공정/);
  });
});
