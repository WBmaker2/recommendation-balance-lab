import { CARDS } from '../data/cards';
import { SUPPLY_PROFILES } from '../data/supplyProfiles';
import { TOPIC_ORDER } from '../data/topics';
import { auditPairsEqual, buildAuditPair, validateAuditPair, type AuditPair } from './auditComparison';
import { canCompareBalance, createBalancePreview } from './balanceScenarios';
import { compareDistributions, countTopicCards, isDistributionAnswerCorrect, type DistributionDelta } from './distribution';
import { isExactInterestRecord, isSafeReportEvidenceGraph } from './reportEvidenceValidation';
import { recommendationResultsEqual } from './recommendationResult';
import { recommend, type RecommendationResult } from './recommendationEngine';
import type { ExperimentState } from './experimentState';
import type { InfluenceFactor, InterestRecord, TopicId } from './types';

const zeroInterest = (): InterestRecord => ({ science: 0, art: 0, sports: 0, nature: 0, history: 0 });
const balanced = SUPPLY_PROFILES.find((profile) => profile.id === 'balanced');

const canonicalResult = (request: Parameters<typeof recommend>[0]): RecommendationResult | null => {
  try {
    if (!balanced || request.supplyProfileId !== 'balanced') return null;
    return recommend(request, CARDS, balanced);
  } catch {
    return null;
  }
};

const exactResult = (candidate: unknown, request: Parameters<typeof recommend>[0]): candidate is RecommendationResult => {
  try {
    const expected = canonicalResult(request);
    return Boolean(expected && isSafeReportEvidenceGraph([candidate]) && recommendationResultsEqual(candidate as RecommendationResult, expected));
  } catch {
    return false;
  }
};

const exactInitialResult = (candidate: unknown): candidate is RecommendationResult => exactResult(candidate, {
  interest: zeroInterest(), diversityLevel: 0, memoryMode: 'keep', supplyProfileId: 'balanced', round: 0, feedSize: 8,
});

const exactChangedResult = (candidate: unknown, focusTopicId: TopicId): candidate is RecommendationResult => {
  const interest = zeroInterest();
  interest[focusTopicId] = 3;
  return exactResult(candidate, {
    interest, diversityLevel: 0, memoryMode: 'keep', supplyProfileId: 'balanced', round: 1, feedSize: 8,
  });
};

const validFocus = (delta: DistributionDelta): TopicId | null => {
  const positive = TOPIC_ORDER.filter((topicId) => delta.delta[topicId] > 0);
  return positive.length === 1 ? positive[0] : null;
};

const distributionFor = (state: ExperimentState): DistributionDelta | null => {
  try {
    if (!exactInitialResult(state.initialResult) || !state.changedResult) return null;
    return compareDistributions(countTopicCards(state.initialResult.cards), countTopicCards(state.changedResult.cards));
  } catch {
    return null;
  }
};

const validDirections = (answer: unknown): boolean => {
  try {
    const keys = answer && typeof answer === 'object' ? Reflect.ownKeys(answer) : [];
    return Boolean(answer) && typeof answer === 'object' && keys.length === 2
      && keys.every((key) => key === 'focusDirection' || key === 'varietyDirection')
      && (answer as { focusDirection?: unknown }).focusDirection !== undefined
      && ['increase', 'same', 'decrease'].includes((answer as { focusDirection: string }).focusDirection)
      && ['increase', 'same', 'decrease'].includes((answer as { varietyDirection: string }).varietyDirection);
  } catch {
    return false;
  }
};

const exactSelectionEvent = (event: unknown, focus: TopicId, ordinal: number): boolean => {
  try {
    if (!event || typeof event !== 'object') return false;
    const keys = Reflect.ownKeys(event);
    return keys.length === 3 && keys.every((key) => key === 'cardId' || key === 'topicId' || key === 'ordinal')
      && (event as { ordinal: unknown }).ordinal === ordinal
      && (event as { topicId: unknown }).topicId === focus;
  } catch {
    return false;
  }
};

const hasChoiceEvidence = (state: ExperimentState, delta: DistributionDelta | null): boolean => {
  try {
    const focus = delta && validFocus(delta);
    if (!focus || state.focusTopicId !== focus || !state.changedResult || !exactChangedResult(state.changedResult, focus)) return false;
    if (!isSafeReportEvidenceGraph([state.selectionHistory, state.prediction, state.distributionAnswer])) return false;
    if (!Array.isArray(state.selectionHistory) || state.selectionHistory.length !== 3
      || !state.selectionHistory.every((event, index) => exactSelectionEvent(event, focus, index + 1)
        && CARDS.some((card) => card.id === event.cardId && card.topicId === focus))
      || new Set(state.selectionHistory.map((event) => event.cardId)).size !== 3) return false;
    return validDirections(state.prediction) && validDirections(state.distributionAnswer)
      && isDistributionAnswerCorrect(state.distributionAnswer!, delta, focus);
  } catch {
    return false;
  }
};

const sameInterest = (left: InterestRecord, right: InterestRecord): boolean => (
  TOPIC_ORDER.every((topicId) => left[topicId] === right[topicId])
);

const balanceEvidence = (state: ExperimentState, delta: DistributionDelta | null): boolean => {
  try {
    if (!delta || !state.changedResult || !state.explorationResult || !state.balanceCompared
      || !validFocus(delta) || state.focusTopicId !== validFocus(delta)
      || !isExactInterestRecord(state.interest)
      || !isSafeReportEvidenceGraph([state.changedResult, state.explorationResult, state.interest, state.balanceSnapshots])) return false;
    const focus = validFocus(delta)!;
    if (!exactChangedResult(state.changedResult, focus)) return false;
    const changedInterest = state.changedResult.request.interest;
    const changes = TOPIC_ORDER.filter((topicId) => state.interest[topicId] !== changedInterest[topicId]);
    if (changes.length !== 1 || changes[0] === focus || state.interest[changes[0]] !== changedInterest[changes[0]] + 1
      || TOPIC_ORDER.some((topicId) => topicId !== changes[0] && state.interest[topicId] !== changedInterest[topicId])) return false;
    const expectedExplorationRequest = { ...state.changedResult.request, interest: { ...state.interest }, round: state.changedResult.request.round + 1 };
    if (!exactResult(state.explorationResult, expectedExplorationRequest) || !sameInterest(state.explorationResult.request.interest, state.interest)) return false;
    if (!canCompareBalance(state.balanceSnapshots)) return false;
    const supply = SUPPLY_PROFILES.find((item) => item.id === state.explorationResult!.request.supplyProfileId);
    if (!supply) return false;
    return state.balanceSnapshots.every((snapshot) => {
      const expected = createBalancePreview(state.explorationResult!.request, snapshot.config, CARDS, supply);
      return recommendationResultsEqual(snapshot.result, expected);
    });
  } catch {
    return false;
  }
};

const auditEvidence = (state: ExperimentState): boolean => {
  try {
    if (!state.changedResult || !state.auditPair || state.auditAnswer !== 'supply-condition'
      || !isSafeReportEvidenceGraph([state.auditPair])) return false;
    const expected: AuditPair = buildAuditPair(state.changedResult.request, CARDS, SUPPLY_PROFILES);
    return validateAuditPair(state.auditPair).length === 0 && auditPairsEqual(state.auditPair, expected);
  } catch {
    return false;
  }
};

export const strictCompletedFactorsForState = (state: ExperimentState): readonly InfluenceFactor[] => {
  const delta = distributionFor(state);
  const factors: InfluenceFactor[] = [];
  if (hasChoiceEvidence(state, delta)) factors.push('choice-record');
  if (balanceEvidence(state, delta)) factors.push('balance-setting');
  if (auditEvidence(state)) factors.push('supply-condition');
  return factors;
};

export { distributionFor };
