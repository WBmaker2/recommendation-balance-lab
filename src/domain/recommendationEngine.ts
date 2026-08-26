import { CARDS } from '../data/cards';
import { TOPIC_ORDER } from '../data/topics';
import { allocateTopicCounts, InsufficientSupplyError } from './apportionment';
import type {
  CardId,
  ContentCard,
  DiversityLevel,
  InterestRecord,
  MemoryMode,
  SupplyProfile,
  SupplyProfileId,
  TopicCounts,
  TopicId,
} from './types';

export interface RecommendationRequest {
  interest: InterestRecord;
  diversityLevel: DiversityLevel;
  memoryMode: MemoryMode;
  supplyProfileId: SupplyProfileId;
  round: number;
  feedSize: 8;
}

export type TopicTokenBreakdown = Record<
  TopicId,
  {
    baseTokens: number;
    interestTokens: number;
    weightedInterestTokens: number;
    diversityTokens: number;
    totalTokens: number;
  }
>;

export interface RecommendationExplanation {
  cardId: CardId;
  topicId: TopicId;
  baseTokens: number;
  interestTokens: number;
  interestMultiplier: 2;
  weightedInterestTokens: number;
  diversityTokens: number;
  totalTokens: number;
  allocatedTopicCards: number;
  supplyProfileId: SupplyProfileId;
  deterministicPositionRule: string;
  limitation: '가상의 단순 규칙이며 실제 서비스 추천을 판정하지 않습니다';
}

export interface RecommendationResult {
  request: RecommendationRequest;
  cards: readonly ContentCard[];
  topicCounts: TopicCounts;
  tokenBreakdown: TopicTokenBreakdown;
  explanations: readonly RecommendationExplanation[];
  inputFingerprint: string;
}

export class SupplyProfileMismatchError extends Error {
  constructor(requested: SupplyProfileId, supplied: SupplyProfileId) {
    super(`요청 공급 프로필(${requested})과 실제 공급 프로필(${supplied})이 다릅니다.`);
    this.name = 'SupplyProfileMismatchError';
  }
}

const limitation = '가상의 단순 규칙이며 실제 서비스 추천을 판정하지 않습니다' as const;

const normalizedRequest = (request: RecommendationRequest): RecommendationRequest => ({
  interest: Object.fromEntries(TOPIC_ORDER.map((topicId) => [topicId, request.interest[topicId]])) as InterestRecord,
  diversityLevel: request.diversityLevel,
  memoryMode: request.memoryMode,
  supplyProfileId: request.supplyProfileId,
  round: request.round,
  feedSize: 8,
});

const assertRequest = (request: RecommendationRequest): void => {
  if (request.feedSize !== 8) {
    throw new InsufficientSupplyError('추천 피드 크기는 정확히 8장이어야 합니다.');
  }
  if (!Number.isInteger(request.round) || request.round < 0) {
    throw new InsufficientSupplyError('추천 라운드는 0 이상의 정수여야 합니다.');
  }
  for (const topicId of TOPIC_ORDER) {
    const value = request.interest[topicId];
    if (!Number.isFinite(value) || value < 0) {
      throw new InsufficientSupplyError(`관심 토큰이 올바르지 않습니다: ${topicId}.`);
    }
  }
};

const assertSupplyMatch = (request: RecommendationRequest, supply: SupplyProfile): void => {
  if (request.supplyProfileId !== supply.id) {
    throw new SupplyProfileMismatchError(request.supplyProfileId, supply.id);
  }
};

export const calculateTokenBreakdown = (
  request: RecommendationRequest,
  supply: SupplyProfile,
): TopicTokenBreakdown => {
  assertRequest(request);
  assertSupplyMatch(request, supply);
  return Object.fromEntries(
    TOPIC_ORDER.map((topicId) => {
      const interestTokens = request.memoryMode === 'clear' ? 0 : request.interest[topicId];
      const weightedInterestTokens = interestTokens * 2;
      const diversityTokens = request.diversityLevel;
      return [
        topicId,
        {
          baseTokens: supply.baseTokens[topicId],
          interestTokens,
          weightedInterestTokens,
          diversityTokens,
          totalTokens: supply.baseTokens[topicId] + weightedInterestTokens + diversityTokens,
        },
      ];
    }),
  ) as TopicTokenBreakdown;
};

const candidateCardsByTopic = (
  cards: readonly ContentCard[],
  supply: SupplyProfile,
): Record<TopicId, readonly ContentCard[]> => {
  const cardById = new Map<CardId, ContentCard>();
  for (const card of cards) {
    if (!cardById.has(card.id)) cardById.set(card.id, card);
  }
  const seen = new Set<CardId>();
  const candidates = Object.fromEntries(
    TOPIC_ORDER.map((topicId) => [topicId, [] as ContentCard[]]),
  ) as Record<TopicId, ContentCard[]>;
  for (const candidateId of supply.candidateCardIds) {
    if (seen.has(candidateId)) continue;
    const card = cardById.get(candidateId);
    if (!card || seen.has(card.id)) continue;
    seen.add(card.id);
    candidates[card.topicId] = [...candidates[card.topicId], card];
  }
  return candidates;
};

const topicIndex = (topicId: TopicId): number => TOPIC_ORDER.indexOf(topicId);

export const buildCardExplanation = (
  card: ContentCard,
  result: RecommendationResult,
): RecommendationExplanation => {
  const topicTokens = result.tokenBreakdown[card.topicId];
  if (!topicTokens) throw new InsufficientSupplyError(`알 수 없는 카드 주제입니다: ${card.topicId}.`);
  return {
    cardId: card.id,
    topicId: card.topicId,
    baseTokens: topicTokens.baseTokens,
    interestTokens: topicTokens.interestTokens,
    interestMultiplier: 2,
    weightedInterestTokens: topicTokens.weightedInterestTokens,
    diversityTokens: topicTokens.diversityTokens,
    totalTokens: topicTokens.totalTokens,
    allocatedTopicCards: result.topicCounts[card.topicId],
    supplyProfileId: result.request.supplyProfileId,
    deterministicPositionRule: '후보 목록에서 (round × 2 + topicIndex) % topicCandidateCount 위치부터 순서대로 선택',
    limitation,
  };
};

export const recommend = (
  request: RecommendationRequest,
  cards: readonly ContentCard[] = CARDS,
  supply: SupplyProfile,
): RecommendationResult => {
  assertRequest(request);
  assertSupplyMatch(request, supply);
  const normalized = normalizedRequest(request);
  const tokenBreakdown = calculateTokenBreakdown(normalized, supply);
  const candidates = candidateCardsByTopic(cards, supply);
  const caps = Object.fromEntries(
    TOPIC_ORDER.map((topicId) => [topicId, candidates[topicId].length]),
  ) as TopicCounts;
  const topicCounts = allocateTopicCounts(tokenBreakdown, normalized.feedSize, caps);
  const selectedCards: ContentCard[] = [];

  for (const topicId of TOPIC_ORDER) {
    const topicCandidates = candidates[topicId];
    const count = topicCounts[topicId];
    if (count === 0) continue;
    if (topicCandidates.length < count) {
      throw new InsufficientSupplyError(`주제 ${topicId}의 후보 카드가 부족합니다.`);
    }
    const start = (normalized.round * 2 + topicIndex(topicId)) % topicCandidates.length;
    for (let offset = 0; offset < count; offset += 1) {
      selectedCards.push(topicCandidates[(start + offset) % topicCandidates.length]);
    }
  }

  if (selectedCards.length !== normalized.feedSize) {
    throw new InsufficientSupplyError(`정확히 ${normalized.feedSize}장을 선택하지 못했습니다.`);
  }
  const resultWithoutExplanations: Omit<RecommendationResult, 'explanations'> = {
    request: normalized,
    cards: selectedCards,
    topicCounts,
    tokenBreakdown,
    inputFingerprint: JSON.stringify(normalized),
  };
  const result = {
    ...resultWithoutExplanations,
    explanations: selectedCards.map((card) =>
      buildCardExplanation(card, resultWithoutExplanations as RecommendationResult),
    ),
  } satisfies RecommendationResult;
  return result;
};

export { InsufficientSupplyError } from './apportionment';
