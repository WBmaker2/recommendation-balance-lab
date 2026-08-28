import { LEARNING_GOALS, PURPOSE_SENTENCE_LABELS } from '../data/learningCopy';
import { learnerMetricLabel, metricUnit, scenarioLabel } from '../data/learnerPresentation';
import { TOPIC_ORDER, TOPICS } from '../data/topics';
import { canCompareBalance, type BalanceSnapshot } from './balanceScenarios';
import { countTopicCards, type DistributionDelta } from './distribution';
import { isSafeReportEvidenceGraph } from './reportEvidenceValidation';
import type { InfluenceFactor, LearningPurpose, TopicId } from './types';

export type EvidenceMetric = 'focus-card-count' | 'topic-variety';
export type LimitationChoice = 'virtual-simple-model' | 'actual-platform-measurement' | 'habit-diagnosis';

export interface ReportDraft {
  focusDirection: 'increase' | 'same' | 'decrease' | null;
  varietyDirection: 'increase' | 'same' | 'decrease' | null;
  acknowledgedFactors: readonly InfluenceFactor[];
  purpose: LearningPurpose | null;
  chosenSnapshotId: BalanceSnapshot['id'] | null;
  evidenceMetric: EvidenceMetric | null;
  evidenceValue: number | null;
  limitationChoice: LimitationChoice | null;
}

export interface ReportEvidence {
  distributionDelta: DistributionDelta;
  snapshots: readonly BalanceSnapshot[];
  completedFactors: readonly InfluenceFactor[];
}

export interface ReportAssessment {
  changeReading: boolean;
  causeSeparation: boolean;
  tradeoffJudgment: boolean;
  limitationAwareness: boolean;
  complete: boolean;
  feedback: readonly string[];
}

export interface ModelReportProps {
  draft: ReportDraft;
  evidence: ReportEvidence;
  errorMessage?: string | null;
  onChange(draft: ReportDraft): void;
  onSubmit(): void;
}

const FACTORS: readonly InfluenceFactor[] = ['choice-record', 'balance-setting', 'supply-condition'];
const SNAPSHOT_IDS: readonly BalanceSnapshot['id'][] = ['scenario-a', 'scenario-b', 'scenario-c'];
const DIRECTIONS = ['increase', 'same', 'decrease'] as const;
const METRICS = ['focus-card-count', 'topic-variety'] as const;
const LIMITATIONS = ['virtual-simple-model', 'actual-platform-measurement', 'habit-diagnosis'] as const;
const hasOwn = (value: object, key: PropertyKey): boolean => Object.hasOwn(value, key);

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  try {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
      && Object.getPrototypeOf(value) === Object.prototype;
  } catch {
    return false;
  }
};

const hasExactKeys = (value: unknown, keys: readonly string[]): value is Record<string, unknown> => {
  if (!isPlainObject(value)) return false;
  try {
    const ownKeys = Reflect.ownKeys(value);
    return ownKeys.length === keys.length
      && ownKeys.every((key) => typeof key === 'string' && keys.includes(key))
      && keys.every((key) => hasOwn(value, key) && isEnumerableDataProperty(value, key));
  } catch {
    return false;
  }
};

const isEnumerableDataProperty = (value: object, key: PropertyKey): boolean => {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return Boolean(descriptor?.enumerable && 'value' in descriptor);
};

const isDenseArray = (value: unknown): value is readonly unknown[] => {
  if (!Array.isArray(value)) return false;
  try {
    const keys = Reflect.ownKeys(value);
    if (keys.length !== value.length + 1 || !keys.includes('length')) return false;
    return Array.from({ length: value.length }, (_, index) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      return descriptor?.enumerable === true && 'value' in descriptor;
    }).every(Boolean) && keys.every((key) => key === 'length' || (
      typeof key === 'string' && Number.isInteger(Number(key)) && Number(key) >= 0 && Number(key) < value.length
    ));
  } catch {
    return false;
  }
};

const isTopicCounts = (value: unknown, allowNegative = false): value is Record<TopicId, number> => {
  if (!hasExactKeys(value, TOPIC_ORDER)) return false;
  try {
    const counts = value as Record<TopicId, unknown>;
    const values = TOPIC_ORDER.map((topicId) => counts[topicId]);
    return values.every((item) => Number.isInteger(item) && (allowNegative || (item as number) >= 0))
      && (allowNegative || values.reduce<number>((sum, item) => sum + (item as number), 0) === 8);
  } catch {
    return false;
  }
};

const validDelta = (value: unknown): value is DistributionDelta => {
  if (!hasExactKeys(value, ['before', 'after', 'delta', 'beforeVariety', 'afterVariety', 'missingTopics'])) return false;
  try {
    const delta = value as unknown as DistributionDelta;
    if (!isTopicCounts(delta.before) || !isTopicCounts(delta.after) || !isTopicCounts(delta.delta, true)) return false;
    if (!Number.isInteger(delta.beforeVariety) || !Number.isInteger(delta.afterVariety)
      || !isDenseArray(delta.missingTopics) || delta.missingTopics.length > TOPIC_ORDER.length) return false;
    const missing = TOPIC_ORDER.filter((topicId) => delta.after[topicId] === 0);
    return TOPIC_ORDER.every((topicId) => delta.delta[topicId] === delta.after[topicId] - delta.before[topicId])
      && delta.beforeVariety === TOPIC_ORDER.filter((topicId) => delta.before[topicId] > 0).length
      && delta.afterVariety === TOPIC_ORDER.filter((topicId) => delta.after[topicId] > 0).length
      && delta.missingTopics.length === missing.length
      && delta.missingTopics.every((topicId, index) => topicId === missing[index]);
  } catch {
    return false;
  }
};

const validFactors = (value: unknown): value is readonly InfluenceFactor[] => {
  if (!isDenseArray(value) || value.length !== FACTORS.length) return false;
  try {
    return value.every((factor) => FACTORS.includes(factor as InfluenceFactor))
      && new Set(value).size === FACTORS.length
      && FACTORS.every((factor) => value.includes(factor));
  } catch {
    return false;
  }
};

const validFactorSelection = (value: unknown): value is readonly InfluenceFactor[] => {
  if (!isDenseArray(value) || value.length > FACTORS.length) return false;
  try {
    return value.every((factor) => FACTORS.includes(factor as InfluenceFactor)) && new Set(value).size === value.length;
  } catch {
    return false;
  }
};

const validDraft = (value: unknown): value is ReportDraft => {
  if (!hasExactKeys(value, [
    'focusDirection', 'varietyDirection', 'acknowledgedFactors', 'purpose',
    'chosenSnapshotId', 'evidenceMetric', 'evidenceValue', 'limitationChoice',
  ])) return false;
  try {
    const draft = value as unknown as ReportDraft;
    return (draft.focusDirection === null || DIRECTIONS.includes(draft.focusDirection))
      && (draft.varietyDirection === null || DIRECTIONS.includes(draft.varietyDirection))
      && validFactorSelection(draft.acknowledgedFactors)
      && (draft.purpose === null || draft.purpose === 'discover' || draft.purpose === 'deepen')
      && (draft.chosenSnapshotId === null || SNAPSHOT_IDS.includes(draft.chosenSnapshotId))
      && (draft.evidenceMetric === null || METRICS.includes(draft.evidenceMetric))
      && (draft.evidenceValue === null || (Number.isInteger(draft.evidenceValue) && draft.evidenceValue >= 0 && draft.evidenceValue <= 8))
      && (draft.limitationChoice === null || LIMITATIONS.includes(draft.limitationChoice));
  } catch {
    return false;
  }
};

const focusTopicFromDelta = (delta: DistributionDelta): TopicId | null => {
  const positive = TOPIC_ORDER.filter((topicId) => delta.delta[topicId] > 0);
  return positive.length === 1 ? positive[0] : null;
};

const direction = (amount: number): 'increase' | 'same' | 'decrease' => (
  amount > 0 ? 'increase' : amount < 0 ? 'decrease' : 'same'
);

type GoalFlags = Pick<ReportAssessment, 'changeReading' | 'causeSeparation' | 'tradeoffJudgment' | 'limitationAwareness'>;

const feedbackFor = (assessment: GoalFlags): readonly string[] => [
  assessment.changeReading
    ? '변화 읽기: 실제 전후 카드 수와 주제 수를 근거로 읽었습니다.'
    : '변화 읽기: 선택 전후의 포커스 카드 수와 나타난 주제 수를 다시 확인해 주세요.',
  assessment.causeSeparation
    ? '원인 구분: 선택 기록·균형 설정·콘텐츠 공급의 세 조건을 모두 구분했습니다.'
    : '원인 구분: 선택 기록·균형 설정·콘텐츠 공급의 세 조건을 모두 확인해 주세요.',
  assessment.tradeoffJudgment
    ? '절충 판단: 선택한 목적과 실제 카드 수 근거를 연결했습니다.'
    : '절충 판단: 저장된 설정의 실제 카드 수를 관찰한 값으로 선택해 주세요.',
  assessment.limitationAwareness
    ? '모형 한계: 가상의 단순 규칙이라는 경계를 확인했습니다.'
    : '모형 한계: 이 활동은 가상의 단순 규칙이며 실제 서비스 측정이나 습관 진단이 아닙니다.',
];

const failedAssessment = (): ReportAssessment => {
  const flags = { changeReading: false, causeSeparation: false, tradeoffJudgment: false, limitationAwareness: false };
  return { ...flags, complete: false, feedback: feedbackFor(flags) };
};

export const emptyReportDraft = (): ReportDraft => ({
  focusDirection: null,
  varietyDirection: null,
  acknowledgedFactors: [],
  purpose: null,
  chosenSnapshotId: null,
  evidenceMetric: null,
  evidenceValue: null,
  limitationChoice: null,
});

export const isReportDraft = (value: unknown): value is ReportDraft => validDraft(value);

export const cloneReportDraft = (draft: ReportDraft): ReportDraft => ({
  focusDirection: draft.focusDirection,
  varietyDirection: draft.varietyDirection,
  acknowledgedFactors: [...draft.acknowledgedFactors],
  purpose: draft.purpose,
  chosenSnapshotId: draft.chosenSnapshotId,
  evidenceMetric: draft.evidenceMetric,
  evidenceValue: draft.evidenceValue,
  limitationChoice: draft.limitationChoice,
});

export const assessReport = (
  draft: ReportDraft,
  distributionDelta: DistributionDelta,
  snapshots: readonly BalanceSnapshot[],
  completedFactors: readonly InfluenceFactor[],
): ReportAssessment => {
  try {
    if (!isSafeReportEvidenceGraph([draft, distributionDelta, snapshots, completedFactors])
      || !validDraft(draft) || !validDelta(distributionDelta) || !validFactors(completedFactors)
      || !isDenseArray(snapshots) || snapshots.length !== 3 || !canCompareBalance(snapshots)) return failedAssessment();
    const focusTopicId = focusTopicFromDelta(distributionDelta);
    if (!focusTopicId) return failedAssessment();

    const changeReading = draft.focusDirection === direction(distributionDelta.delta[focusTopicId])
      && draft.varietyDirection === direction(distributionDelta.afterVariety - distributionDelta.beforeVariety);
    const chosen = snapshots.find((snapshot) => snapshot.id === draft.chosenSnapshotId);
    let tradeoffJudgment = false;
    if (chosen && draft.purpose && draft.evidenceMetric && Number.isInteger(draft.evidenceValue)) {
      const counts = countTopicCards(chosen.result.cards);
      const expected = draft.evidenceMetric === 'focus-card-count'
        ? counts[focusTopicId]
        : TOPIC_ORDER.filter((topicId) => counts[topicId] > 0).length;
      tradeoffJudgment = draft.evidenceValue === expected;
    }
    const result = {
      changeReading,
      causeSeparation: validFactors(draft.acknowledgedFactors) && validFactors(completedFactors),
      tradeoffJudgment,
      limitationAwareness: draft.limitationChoice === 'virtual-simple-model',
    };
    return { ...result, complete: Object.values(result).every(Boolean), feedback: feedbackFor(result) };
  } catch {
    return failedAssessment();
  }
};

const topicLabel = (topicId: TopicId): string => TOPICS.find((topic) => topic.id === topicId)?.label ?? topicId;
const factorLabel = (factor: InfluenceFactor): string => ({
  'choice-record': '선택 기록',
  'balance-setting': '균형 설정',
  'supply-condition': '콘텐츠 공급',
}[factor]);

export const buildReportSentence = (draft: ReportDraft, evidence: ReportEvidence): string => {
  try {
    const focusTopicId = focusTopicFromDelta(evidence.distributionDelta);
    const snapshot = evidence.snapshots.find((item) => item.id === draft.chosenSnapshotId);
    if (!focusTopicId || !snapshot || !draft.purpose || !draft.evidenceMetric || !Number.isInteger(draft.evidenceValue)) return '관찰한 증거를 모두 선택하면 모델 보고서가 완성됩니다.';
    const metric = learnerMetricLabel(draft.evidenceMetric, topicLabel(focusTopicId));
    const unit = metricUnit(draft.evidenceMetric);
    const memory = snapshot.config.memoryMode === 'keep' ? '관심 기록 유지' : '관심 기록 비우기';
    const factors = FACTORS.map(factorLabel).join('·');
    return `${PURPOSE_SENTENCE_LABELS[draft.purpose]} 목적에서 ${scenarioLabel(snapshot.id)}(다양성 토큰 ${snapshot.config.diversityLevel}, ${memory})의 ${metric}는 ${draft.evidenceValue}${unit}입니다. 영향을 살핀 조건은 ${factors}입니다.`;
  } catch {
    return '관찰한 증거를 모두 선택하면 모델 보고서가 완성됩니다.';
  }
};

export { FACTORS as REPORT_FACTORS, LEARNING_GOALS };
