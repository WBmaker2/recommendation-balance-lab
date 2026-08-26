import { CARDS } from '../data/cards';
import { TOPIC_ORDER } from '../data/topics';
import { countTopicCards } from './distribution';
import type { RecommendationResult } from './recommendationEngine';
import type { CardId, ContentCard, InterestRecord, TopicId } from './types';

export class InvalidExplorationError extends Error {
  constructor() {
    super('탐색 주제가 올바르지 않습니다.');
    this.name = 'InvalidExplorationError';
  }
}

const isTopicId = (value: unknown): value is TopicId =>
  typeof value === 'string' && (TOPIC_ORDER as readonly string[]).includes(value);

const isSameCard = (left: ContentCard, right: ContentCard): boolean =>
  left.id === right.id && left.topicId === right.topicId && left.title === right.title && left.summary === right.summary;

export const applyExploration = (
  interest: InterestRecord,
  topicId: TopicId,
  focusTopicId: TopicId,
): InterestRecord => {
  if (!isTopicId(topicId)) throw new InvalidExplorationError();
  if (topicId === focusTopicId) return interest;
  return Object.fromEntries(
    TOPIC_ORDER.map((id) => [id, interest[id] + (id === topicId ? 1 : 0)]),
  ) as InterestRecord;
};

export const findExplorationCandidates = (
  result: RecommendationResult,
  cards: readonly ContentCard[],
  focusTopicId: TopicId,
): readonly ContentCard[] => {
  const counts = countTopicCards(result.cards);
  const selectedIds = new Set(result.cards.map((item) => item.id));
  const seenProvidedIds = new Set<string>();
  const canonicalCards = new Map(CARDS.map((item) => [item.id, item]));
  const firstByTopic = new Map<TopicId, ContentCard>();
  for (const candidate of cards) {
    if (!candidate || typeof candidate !== 'object') continue;
    if (seenProvidedIds.has(candidate.id)) continue;
    seenProvidedIds.add(candidate.id);
    const canonical = canonicalCards.get(candidate.id);
    if (!canonical || selectedIds.has(candidate.id) || !isSameCard(canonical, candidate)) continue;
    if (!firstByTopic.has(canonical.topicId)) firstByTopic.set(canonical.topicId, candidate);
  }
  const orderedTopics = TOPIC_ORDER
    .filter((topicId) => topicId !== focusTopicId)
    .sort((left, right) => counts[left] - counts[right] || TOPIC_ORDER.indexOf(left) - TOPIC_ORDER.indexOf(right));
  return orderedTopics.flatMap((topicId) => {
    const candidate = firstByTopic.get(topicId);
    return candidate ? [{ ...candidate }] : [];
  });
};

export type { CardId };
