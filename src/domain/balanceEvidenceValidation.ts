import { CARDS } from '../data/cards';
import { SUPPLY_PROFILES } from '../data/supplyProfiles';
import { TOPIC_ORDER } from '../data/topics';
import { canCompareBalance, createBalancePreview, type BalanceSnapshot } from './balanceScenarios';
import { hasCompleteChoiceEvidence } from './experimentStateReportEvidence';
import { isExactInterestRecord, isSafeReportEvidenceGraph } from './reportEvidenceValidation';
import { recommendationResultsEqual } from './recommendationResult';
import { recommend, type RecommendationRequest, type RecommendationResult } from './recommendationEngine';
import type { ExperimentState } from './experimentState';
import type { InterestRecord, TopicId } from './types';

const balanced = SUPPLY_PROFILES.find((profile) => profile.id === 'balanced');

const sameInterest = (left: InterestRecord, right: InterestRecord): boolean => (
  TOPIC_ORDER.every((topicId) => left[topicId] === right[topicId])
);

const canonicalResult = (request: RecommendationRequest): RecommendationResult | null => {
  try {
    return balanced && request.supplyProfileId === 'balanced' ? recommend(request, CARDS, balanced) : null;
  } catch {
    return null;
  }
};

const isCanonicalResult = (candidate: unknown, request: RecommendationRequest): candidate is RecommendationResult => {
  const expected = canonicalResult(request);
  return Boolean(expected && recommendationResultsEqual(candidate as RecommendationResult, expected));
};

const isFocus = (value: unknown): value is TopicId => TOPIC_ORDER.includes(value as TopicId);

const hasExplorationDelta = (state: ExperimentState): boolean => {
  const changedInterest = state.changedResult?.request.interest;
  if (!changedInterest || !isExactInterestRecord(changedInterest) || !isExactInterestRecord(state.interest)) return false;
  const differences = TOPIC_ORDER.filter((topicId) => state.interest[topicId] !== changedInterest[topicId]);
  return differences.length === 1
    && differences[0] !== state.focusTopicId
    && state.interest[differences[0]] === changedInterest[differences[0]] + 1;
};

const isCurrentChain = (state: ExperimentState): boolean => {
  const changed = state.changedResult;
  const exploration = state.explorationResult;
  if (!hasCompleteChoiceEvidence(state)
    || !state.focusTopicId || !isFocus(state.focusTopicId) || !changed || !exploration || !hasExplorationDelta(state)) return false;
  if (!isSafeReportEvidenceGraph([state.explorationResult, state.interest, state.balanceSnapshots])) return false;
  if (!isCanonicalResult(changed, changed.request)) return false;
  const changedRequest = changed.request;
  const explorationRequest = exploration.request;
  if (explorationRequest.supplyProfileId !== changedRequest.supplyProfileId
    || explorationRequest.diversityLevel !== changedRequest.diversityLevel
    || explorationRequest.memoryMode !== changedRequest.memoryMode
    || explorationRequest.feedSize !== changedRequest.feedSize
    || explorationRequest.round !== changedRequest.round + 1
    || !sameInterest(explorationRequest.interest, state.interest)) return false;
  return isCanonicalResult(exploration, explorationRequest);
};

const isSnapshotFromCurrentExploration = (snapshot: BalanceSnapshot, state: ExperimentState): boolean => {
  const exploration = state.explorationResult;
  const supply = exploration && SUPPLY_PROFILES.find((profile) => profile.id === exploration.request.supplyProfileId);
  if (!exploration || !supply) return false;
  try {
    const expected = createBalancePreview(exploration.request, snapshot.config, CARDS, supply);
    return recommendationResultsEqual(snapshot.result, expected);
  } catch {
    return false;
  }
};

/** Gates the audit transition on the current experiment chain, not just valid-looking snapshots. */
export const canAdvanceToAudit = (state: ExperimentState): boolean => {
  try {
    if (state.stage !== 'balance' || state.balanceCompared || !state.balanceSnapshots || !canCompareBalance(state.balanceSnapshots)) return false;
    if (!isCurrentChain(state)) return false;
    return state.balanceSnapshots.every((snapshot) => isSnapshotFromCurrentExploration(snapshot, state));
  } catch {
    return false;
  }
};

export const hasPreAuditBalanceEvidence = canAdvanceToAudit;
