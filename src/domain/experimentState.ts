import { CARDS } from '../data/cards';
import { MISSIONS } from '../data/missions';
import { SUPPLY_PROFILES } from '../data/supplyProfiles';
import { TOPIC_ORDER } from '../data/topics';
import { recommend, type RecommendationResult } from './recommendationEngine';
import { countTopicCards } from './distribution';
import { applyExploration, InvalidExplorationError } from './exploration';
import { cloneRecommendationResult, recommendationResultsEqual } from './recommendationResult';
import { reduceAuditAnswer, reduceAuditRecord } from './experimentStateAudit';
import { reduceReportCompletion, reduceReportUpdate } from './experimentStateReport';
import { emptyReportDraft, type ReportAssessment, type ReportDraft } from './reportAssessment';
import { auditPairsEqual, buildAuditPair, cloneAuditPair, validateAuditPair, type AuditPair } from './auditComparison';
import { cloneDirectionAnswer, isExactDirectionAnswer } from './answerValidation';
import { canAdvanceToAudit } from './balanceEvidenceValidation';
import {
  canCompareBalance,
  createBalancePreview,
  isBalanceConfig,
  saveBalanceSnapshot,
  type BalanceConfig,
  type BalanceSnapshot,
} from './balanceScenarios';
import type {
  CardId,
  ContentCard,
  InterestRecord,
  MissionDefinition,
  TopicId,
} from './types';

export { applyExploration, findExplorationCandidates, InvalidExplorationError } from './exploration';
export type { BalanceConfig, BalanceSnapshot } from './balanceScenarios';

export type ExperimentStage =
  | 'intro'
  | 'choice'
  | 'comparison'
  | 'exploration'
  | 'balance'
  | 'audit'
  | 'report'
  | 'complete';

export type DirectionAnswer = 'increase' | 'same' | 'decrease';

export interface PredictionAnswer {
  focusDirection: DirectionAnswer;
  varietyDirection: DirectionAnswer;
}

export type DistributionAnswer = PredictionAnswer;

export interface SelectionEvent {
  cardId: CardId;
  topicId: TopicId;
  ordinal: 1 | 2 | 3;
}

export interface ExperimentState {
  stage: ExperimentStage;
  initialResult: RecommendationResult;
  choiceFeed: readonly ContentCard[];
  focusTopicId: TopicId | null;
  interest: InterestRecord;
  selectionHistory: readonly SelectionEvent[];
  prediction: PredictionAnswer | null;
  changedResult: RecommendationResult | null;
  distributionAnswer: DistributionAnswer | null;
  explorationResult: RecommendationResult | null;
  balanceConfig: BalanceConfig;
  balanceSnapshots: readonly BalanceSnapshot[];
  balanceCompared: boolean;
  auditPair: AuditPair | null;
  auditAnswer: import('./types').InfluenceFactor | null;
  reportDraft: ReportDraft;
  reportAssessment: ReportAssessment | null;
  lastError: string | null;
}

export type ExperimentAction =
  | { type: 'START' }
  | { type: 'SELECT_CARD'; card: ContentCard; replacement: ContentCard }
  | { type: 'SUBMIT_PREDICTION'; answer: PredictionAnswer; result: RecommendationResult }
  | { type: 'SUBMIT_DISTRIBUTION'; answer: DistributionAnswer }
  | { type: 'RECORD_EXPLORATION'; topicId: TopicId; result: RecommendationResult }
  | { type: 'SET_BALANCE_CONFIG'; config: BalanceConfig }
  | { type: 'SAVE_BALANCE_SNAPSHOT'; snapshot: BalanceSnapshot }
  | { type: 'COMPLETE_BALANCE_COMPARISON'; pair?: AuditPair }
  | { type: 'RECORD_AUDIT'; pair: AuditPair }
  | { type: 'SUBMIT_AUDIT_ANSWER'; answer: import('./types').InfluenceFactor }
  | { type: 'UPDATE_REPORT'; draft: ReportDraft }
  | { type: 'COMPLETE_REPORT'; assessment: ReportAssessment }
  | { type: 'RESET' };

export class PracticeCardExhaustedError extends Error {
  constructor() {
    super('연습 카드가 소진되었습니다.');
    this.name = 'PracticeCardExhaustedError';
  }
}

const zeroInterest = (): InterestRecord => ({
  science: 0,
  art: 0,
  sports: 0,
  nature: 0,
  history: 0,
});

const balancedSupply = SUPPLY_PROFILES.find((item) => item.id === 'balanced');
if (!balancedSupply) throw new Error('균형 공급 프로필이 필요합니다.');

const toIdSet = (usedIds: Iterable<string>): Set<string> => new Set(usedIds);
const isSameCard = (left: ContentCard, right: ContentCard): boolean =>
  left.id === right.id && left.topicId === right.topicId && left.title === right.title && left.summary === right.summary;

export const nextPracticeCard = (
  topicId: TopicId,
  usedIds: Iterable<string>,
  cards: readonly ContentCard[] = CARDS,
): ContentCard => {
  const used = toIdSet(usedIds);
  const next = cards.find((item) => item.topicId === topicId && !used.has(item.id));
  if (!next) throw new PracticeCardExhaustedError();
  return next;
};

const copyInterest = (interest: InterestRecord): InterestRecord => ({ ...interest });

const initialRecommendation = (): RecommendationResult =>
  recommend(
    {
      interest: zeroInterest(),
      diversityLevel: 0,
      memoryMode: 'keep',
      supplyProfileId: 'balanced',
      round: 0,
      feedSize: 8,
    },
    CARDS,
    balancedSupply,
  );

const cloneCard = (card: ContentCard): ContentCard => ({ ...card });

const cloneResult = cloneRecommendationResult;

export const initialExperimentState = (): ExperimentState => {
  const initialResult = cloneResult(initialRecommendation());
  return {
    stage: 'intro',
    initialResult,
    choiceFeed: initialResult.cards.map(cloneCard),
    focusTopicId: null,
    interest: zeroInterest(),
    selectionHistory: [],
    prediction: null,
    changedResult: null,
    distributionAnswer: null,
    explorationResult: null,
    balanceConfig: { diversityLevel: 0, memoryMode: 'keep' },
    balanceSnapshots: [],
    balanceCompared: false,
    auditPair: null,
    auditAnswer: null,
    reportDraft: emptyReportDraft(),
    reportAssessment: null,
    lastError: null,
  };
};

const withError = (state: ExperimentState, message: string): ExperimentState => ({
  ...state,
  lastError: message,
});

const direction = (before: number, after: number): DirectionAnswer =>
  after > before ? 'increase' : after < before ? 'decrease' : 'same';

const varietyCount = (result: RecommendationResult): number => {
  const counts = countTopicCards(result.cards);
  return TOPIC_ORDER.filter((topicId) => counts[topicId] > 0).length;
};

const factualDistributionAnswer = (
  initialResult: RecommendationResult,
  changedResult: RecommendationResult,
  focusTopicId: TopicId,
): DistributionAnswer => ({
  focusDirection: direction(
    countTopicCards(initialResult.cards)[focusTopicId],
    countTopicCards(changedResult.cards)[focusTopicId],
  ),
  varietyDirection: direction(varietyCount(initialResult), varietyCount(changedResult)),
});

const validAnswer = (answer: unknown): answer is PredictionAnswer => isExactDirectionAnswer(answer);

const reduceStart = (state: ExperimentState): ExperimentState => {
  if (state.stage !== 'intro') return withError(state, '실험은 처음 화면에서 시작해 주세요.');
  return { ...state, stage: 'choice', lastError: null };
};

const reduceSelection = (
  state: ExperimentState,
  card: ContentCard,
  replacement: ContentCard,
): ExperimentState => {
  if (state.stage !== 'choice') return withError(state, '지금은 카드를 고르는 단계가 아닙니다.');
  if (state.selectionHistory.length >= 3) return withError(state, '카드 선택은 세 번까지입니다.');

  const displayed = state.choiceFeed.find((item) => item.id === card.id);
  if (!displayed || !isSameCard(displayed, card)) {
    return withError(state, '현재 목록에 있는 카드만 선택해 주세요.');
  }

  const focusTopicId = state.focusTopicId ?? card.topicId;
  if (card.topicId !== focusTopicId) {
    return withError(state, '같은 주제 카드를 세 번 선택해 주세요.');
  }

  const usedIds = new Set<CardId>([
    ...state.selectionHistory.map((item) => item.cardId),
    ...state.choiceFeed.map((item) => item.id),
  ]);
  let expected: ContentCard;
  try {
    expected = nextPracticeCard(card.topicId, usedIds, CARDS);
  } catch (error) {
    if (error instanceof PracticeCardExhaustedError) return withError(state, error.message);
    throw error;
  }
  if (replacement.topicId !== card.topicId || usedIds.has(replacement.id)) {
    return withError(state, '교체 카드는 같은 주제의 새 카드여야 합니다.');
  }
  if (!isSameCard(expected, replacement)) {
    return withError(state, '다음 연습 카드 순서가 올바르지 않습니다.');
  }

  const selectionHistory: readonly SelectionEvent[] = [
    ...state.selectionHistory,
    { cardId: card.id, topicId: card.topicId, ordinal: (state.selectionHistory.length + 1) as 1 | 2 | 3 },
  ];
  const interest = copyInterest(state.interest);
  interest[card.topicId] += 1;
  return {
    ...state,
    choiceFeed: state.choiceFeed.map((item) => (item.id === card.id ? cloneCard(replacement) : item)),
    focusTopicId,
    interest,
    selectionHistory,
    lastError: null,
  };
};

const reducePrediction = (
  state: ExperimentState,
  answer: PredictionAnswer,
  result: RecommendationResult,
): ExperimentState => {
  if (!canRunPrediction(state)) return withError(state, '카드를 세 장 선택한 뒤 예측해 주세요.');
  if (!validAnswer(answer)) return withError(state, '예측 답을 선택해 주세요.');
  return {
    ...state,
    stage: 'comparison',
    prediction: cloneDirectionAnswer(answer),
    changedResult: cloneResult(result),
    lastError: null,
  };
};

const reduceDistribution = (state: ExperimentState, answer: DistributionAnswer): ExperimentState => {
  if (state.stage !== 'comparison' || !state.changedResult || !state.focusTopicId) {
    return withError(state, '먼저 다음 목록을 확인해 주세요.');
  }
  if (!validAnswer(answer)) return withError(state, '분포 답을 선택해 주세요.');
  const expected = factualDistributionAnswer(state.initialResult, state.changedResult, state.focusTopicId);
  if (answer.focusDirection !== expected.focusDirection || answer.varietyDirection !== expected.varietyDirection) {
    return {
      ...state,
      distributionAnswer: cloneDirectionAnswer(answer),
      lastError: '두 목록의 주제 수를 다시 관찰해 보세요.',
    };
  }
  return { ...state, stage: 'exploration', distributionAnswer: cloneDirectionAnswer(answer), lastError: null };
};

const reduceExploration = (
  state: ExperimentState,
  topicId: TopicId,
  result: RecommendationResult,
): ExperimentState => {
  if (state.explorationResult) return withError(state, '탐색은 한 번만 기록할 수 있습니다.');
  if (state.stage !== 'exploration' || !state.focusTopicId) {
    return withError(state, '먼저 분포 확인을 완료해 주세요.');
  }
  let interest: InterestRecord;
  try {
    interest = applyExploration(state.interest, topicId, state.focusTopicId);
  } catch (error) {
    return withError(state, error instanceof InvalidExplorationError ? error.message : '탐색 주제가 올바르지 않습니다.');
  }
  if (topicId === state.focusTopicId) {
    return withError(state, '포커스가 아닌 주제를 한 번 탐색해 주세요.');
  }
  if (!state.changedResult) return withError(state, '먼저 다음 목록을 확인해 주세요.');

  const sourceRequest = state.changedResult.request;
  const expectedRequest = {
    ...sourceRequest,
    interest,
    round: sourceRequest.round + 1,
  };
  const supply = SUPPLY_PROFILES.find((item) => item.id === expectedRequest.supplyProfileId);
  if (!supply) return withError(state, '탐색 결과가 가상 규칙과 일치하지 않습니다.');

  let expectedResult: RecommendationResult;
  try {
    expectedResult = recommend(expectedRequest, CARDS, supply);
  } catch {
    return withError(state, '탐색 결과가 가상 규칙과 일치하지 않습니다.');
  }
  if (!recommendationResultsEqual(result, expectedResult)) {
    return withError(state, '탐색 결과가 가상 규칙과 일치하지 않습니다.');
  }
  return {
    ...state,
    stage: 'balance',
    interest,
    explorationResult: cloneResult(expectedResult),
    lastError: null,
  };
};

const reduceBalanceConfig = (state: ExperimentState, config: BalanceConfig): ExperimentState => {
  if (state.stage !== 'balance') return withError(state, '지금은 균형을 조절하는 단계가 아닙니다.');
  if (!isBalanceConfig(config)) return withError(state, '균형 설정이 올바르지 않습니다.');
  return { ...state, balanceConfig: { ...config }, lastError: null };
};

const reduceBalanceSnapshot = (state: ExperimentState, snapshot: BalanceSnapshot): ExperimentState => {
  if (state.stage !== 'balance') return withError(state, '지금은 균형을 조절하는 단계가 아닙니다.');
  if (!state.explorationResult || !snapshot || typeof snapshot !== 'object' || !isBalanceConfig(snapshot.config)) {
    return withError(state, '저장할 설정 결과가 가상 규칙과 일치하지 않습니다.');
  }
  const expectedId = `scenario-${String.fromCharCode(97 + state.balanceSnapshots.length)}`;
  let expectedResult: RecommendationResult;
  try {
    const supply = SUPPLY_PROFILES.find((item) => item.id === state.explorationResult!.request.supplyProfileId);
    if (!supply) throw new Error('missing supply');
    expectedResult = createBalancePreview(state.explorationResult.request, snapshot.config, CARDS, supply);
  } catch {
    return withError(state, '저장할 설정 결과가 가상 규칙과 일치하지 않습니다.');
  }
  if (snapshot.id !== expectedId || !recommendationResultsEqual(snapshot.result, expectedResult)) {
    return withError(state, '저장할 설정 결과가 가상 규칙과 일치하지 않습니다.');
  }
  try {
    const saved = saveBalanceSnapshot(state.balanceSnapshots, snapshot.config, expectedResult);
    if (!saved.ok) {
      return withError(
        state,
        saved.reason === 'duplicate-config' ? '이미 저장한 설정입니다.' : '세 개의 설정만 저장할 수 있습니다.',
      );
    }
    return { ...state, balanceSnapshots: saved.snapshots, lastError: null };
  } catch {
    return withError(state, '저장할 설정 결과가 가상 규칙과 일치하지 않습니다.');
  }
};

const reduceBalanceCompletion = (state: ExperimentState, supplied?: AuditPair): ExperimentState => {
  if (state.stage !== 'balance') return state;
  if (!canCompareBalance(state.balanceSnapshots)) return withError(state, '서로 다른 설정 세 개를 저장해 주세요.');
  if (!canAdvanceToAudit(state)) return withError(state, '감사 비교에 필요한 실험 근거가 올바르지 않습니다.');
  if (!state.changedResult) return withError(state, '감사 비교에 필요한 선택 결과가 없습니다.');
  let expected: AuditPair;
  try {
    expected = buildAuditPair(state.changedResult.request, CARDS, SUPPLY_PROFILES);
  } catch {
    return withError(state, '감사 비교를 만들 수 없습니다.');
  }
  if (validateAuditPair(expected).length > 0 || (supplied && !auditPairsEqual(supplied, expected))) {
    return withError(state, '감사 비교가 가상 규칙과 일치하지 않습니다.');
  }
  return {
    ...state,
    stage: 'audit',
    balanceCompared: true,
    auditPair: cloneAuditPair(expected),
    lastError: null,
  };
};

export const canRunPrediction = (state: ExperimentState): boolean =>
  state.stage === 'choice' &&
  state.selectionHistory.length === 3 &&
  state.focusTopicId !== null &&
  state.selectionHistory.every((item) => item.topicId === state.focusTopicId);

export const experimentReducer = (
  state: ExperimentState,
  action: ExperimentAction,
): ExperimentState => {
  switch (action.type) {
    case 'RESET':
      return initialExperimentState();
    case 'START':
      return reduceStart(state);
    case 'SELECT_CARD':
      return reduceSelection(state, action.card, action.replacement);
    case 'SUBMIT_PREDICTION':
      return reducePrediction(state, action.answer, action.result);
    case 'SUBMIT_DISTRIBUTION':
      return reduceDistribution(state, action.answer);
    case 'RECORD_EXPLORATION':
      return reduceExploration(state, action.topicId, action.result);
    case 'SET_BALANCE_CONFIG':
      return reduceBalanceConfig(state, action.config);
    case 'SAVE_BALANCE_SNAPSHOT':
      return reduceBalanceSnapshot(state, action.snapshot);
    case 'COMPLETE_BALANCE_COMPARISON':
      return reduceBalanceCompletion(state, action.pair);
    case 'RECORD_AUDIT':
      return reduceAuditRecord(state, action.pair);
    case 'SUBMIT_AUDIT_ANSWER':
      return reduceAuditAnswer(state, action.answer);
    case 'UPDATE_REPORT':
      return reduceReportUpdate(state, action.draft);
    case 'COMPLETE_REPORT':
      return reduceReportCompletion(state, action.assessment);
    default:
      return withError(state, '알 수 없는 실험 동작입니다.');
  }
};

export const missionForStage = (stage: ExperimentStage): MissionDefinition | null => {
  const orderByStage: Partial<Record<ExperimentStage, 1 | 2 | 3 | 4 | 5>> = {
    choice: 1,
    comparison: 2,
    exploration: 3,
    balance: 4,
    audit: 5,
  };
  const order = orderByStage[stage];
  return order ? MISSIONS.find((mission) => mission.order === order) ?? null : null;
};
