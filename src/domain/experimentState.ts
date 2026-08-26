import { CARDS } from '../data/cards';
import { MISSIONS } from '../data/missions';
import { SUPPLY_PROFILES } from '../data/supplyProfiles';
import { recommend, type RecommendationResult } from './recommendationEngine';
import type {
  CardId,
  ContentCard,
  InterestRecord,
  MissionDefinition,
  TopicId,
} from './types';

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
  lastError: string | null;
}

export type ExperimentAction =
  | { type: 'START' }
  | { type: 'SELECT_CARD'; card: ContentCard; replacement: ContentCard }
  | { type: 'SUBMIT_PREDICTION'; answer: PredictionAnswer; result: RecommendationResult }
  | { type: 'SUBMIT_DISTRIBUTION'; answer: DistributionAnswer }
  | { type: 'RECORD_EXPLORATION'; topicId: TopicId; result: RecommendationResult }
  | { type: 'RESET' };

export class PracticeCardExhaustedError extends Error {
  constructor() {
    super('연습 카드가 소진되었습니다.');
    this.name = 'PracticeCardExhaustedError';
  }
}

const topics: readonly TopicId[] = ['science', 'art', 'sports', 'nature', 'history'];
const zeroInterest = (): InterestRecord => ({
  science: 0,
  art: 0,
  sports: 0,
  nature: 0,
  history: 0,
});

const balancedSupply = SUPPLY_PROFILES.find((item) => item.id === 'balanced');
if (!balancedSupply) throw new Error('균형 공급 프로필이 필요합니다.');

const isSameCard = (left: ContentCard, right: ContentCard): boolean =>
  left.id === right.id &&
  left.topicId === right.topicId &&
  left.title === right.title &&
  left.summary === right.summary;

const toIdSet = (usedIds: Iterable<string>): Set<string> => new Set(usedIds);

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

const cloneInitialResult = (result: RecommendationResult): RecommendationResult => ({
  ...result,
  request: { ...result.request, interest: { ...result.request.interest } },
  cards: result.cards.map(cloneCard),
  topicCounts: { ...result.topicCounts },
  tokenBreakdown: Object.fromEntries(
    topics.map((topicId) => [topicId, { ...result.tokenBreakdown[topicId] }]),
  ) as RecommendationResult['tokenBreakdown'],
  explanations: result.explanations.map((explanation) => ({ ...explanation })),
});

export const initialExperimentState = (): ExperimentState => {
  const initialResult = cloneInitialResult(initialRecommendation());
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
    lastError: null,
  };
};

const withError = (state: ExperimentState, message: string): ExperimentState => ({
  ...state,
  lastError: message,
});

const direction = (before: number, after: number): DirectionAnswer =>
  after > before ? 'increase' : after < before ? 'decrease' : 'same';

const varietyCount = (result: RecommendationResult): number =>
  topics.filter((topicId) => result.topicCounts[topicId] > 0).length;

const factualDistributionAnswer = (
  initialResult: RecommendationResult,
  changedResult: RecommendationResult,
  focusTopicId: TopicId,
): DistributionAnswer => ({
  focusDirection: direction(
    initialResult.topicCounts[focusTopicId],
    changedResult.topicCounts[focusTopicId],
  ),
  varietyDirection: direction(varietyCount(initialResult), varietyCount(changedResult)),
});

const validDirection = (value: unknown): value is DirectionAnswer =>
  value === 'increase' || value === 'same' || value === 'decrease';

const validAnswer = (answer: PredictionAnswer): boolean =>
  validDirection(answer.focusDirection) && validDirection(answer.varietyDirection);

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
    choiceFeed: state.choiceFeed.map((item) => (item.id === card.id ? replacement : item)),
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
    prediction: { ...answer },
    changedResult: result,
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
      distributionAnswer: { ...answer },
      lastError: '두 목록의 주제 수를 다시 관찰해 보세요.',
    };
  }
  return { ...state, stage: 'exploration', distributionAnswer: { ...answer }, lastError: null };
};

const reduceExploration = (
  state: ExperimentState,
  topicId: TopicId,
  result: RecommendationResult,
): ExperimentState => {
  if (state.stage !== 'exploration' || !state.focusTopicId) {
    return withError(state, '먼저 분포 확인을 완료해 주세요.');
  }
  if (topicId === state.focusTopicId) {
    return withError(state, '포커스가 아닌 주제를 한 번 탐색해 주세요.');
  }
  if (state.explorationResult) return withError(state, '탐색은 한 번만 기록할 수 있습니다.');
  return { ...state, stage: 'balance', explorationResult: result, lastError: null };
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
    default:
      return state;
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
