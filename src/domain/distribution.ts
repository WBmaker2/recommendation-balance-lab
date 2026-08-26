import { CARDS } from '../data/cards';
import { TOPIC_ORDER, TOPICS } from '../data/topics';
import type { ContentCard, TopicCounts, TopicId } from './types';
import type { DirectionAnswer, DistributionAnswer } from './experimentState';

const FEED_SIZE = 8;

export interface DistributionDelta {
  before: TopicCounts;
  after: TopicCounts;
  delta: TopicCounts;
  beforeVariety: number;
  afterVariety: number;
  missingTopics: readonly TopicId[];
}

export class InvalidDistributionError extends Error {
  constructor() {
    super('분포 자료가 올바르지 않습니다.');
    this.name = 'InvalidDistributionError';
  }
}

const invalid = (): never => {
  throw new InvalidDistributionError();
};

const isTopicId = (value: string): value is TopicId =>
  (TOPIC_ORDER as readonly string[]).includes(value);

const validateCounts = (counts: TopicCounts): TopicCounts => {
  if (!counts || typeof counts !== 'object') return invalid();
  const keys = Object.keys(counts);
  if (keys.length !== TOPIC_ORDER.length || keys.some((key) => !isTopicId(key))) return invalid();
  const copy = {} as TopicCounts;
  let total = 0;
  for (const topicId of TOPIC_ORDER) {
    const value = counts[topicId];
    if (!Number.isInteger(value) || value < 0) return invalid();
    copy[topicId] = value;
    total += value;
  }
  if (total !== FEED_SIZE) return invalid();
  return copy;
};

export const countTopicCards = (cards: readonly ContentCard[]): TopicCounts => {
  if (!Array.isArray(cards) || cards.length !== FEED_SIZE) return invalid();
  const knownCards = new Map(CARDS.map((card) => [card.id, card]));
  const seen = new Set<string>();
  const counts = Object.fromEntries(TOPIC_ORDER.map((topicId) => [topicId, 0])) as TopicCounts;
  for (const card of cards) {
    const known = knownCards.get(card.id);
    if (!known || seen.has(card.id) || card.topicId !== known.topicId || !isTopicId(card.topicId)) return invalid();
    seen.add(card.id);
    counts[card.topicId as TopicId] += 1;
  }
  return counts;
};

export const compareDistributions = (
  before: TopicCounts,
  after: TopicCounts,
): DistributionDelta => {
  const beforeCopy = validateCounts(before);
  const afterCopy = validateCounts(after);
  const delta = {} as TopicCounts;
  for (const topicId of TOPIC_ORDER) delta[topicId] = afterCopy[topicId] - beforeCopy[topicId];
  return {
    before: beforeCopy,
    after: afterCopy,
    delta,
    beforeVariety: TOPIC_ORDER.filter((topicId) => beforeCopy[topicId] > 0).length,
    afterVariety: TOPIC_ORDER.filter((topicId) => afterCopy[topicId] > 0).length,
    missingTopics: TOPIC_ORDER.filter((topicId) => afterCopy[topicId] === 0),
  };
};

const direction = (before: number, after: number): DirectionAnswer =>
  after > before ? 'increase' : after < before ? 'decrease' : 'same';

const topicLabel = (topicId: TopicId): string =>
  TOPICS.find((topic) => topic.id === topicId)?.label ?? topicId;

export const buildDistributionSummary = (delta: DistributionDelta, focusTopicId: TopicId): string => {
  const focusChange = delta.delta[focusTopicId];
  const focusText = focusChange > 0
    ? `${topicLabel(focusTopicId)} 카드는 ${focusChange}장 늘고`
    : focusChange < 0
      ? `${topicLabel(focusTopicId)} 카드는 ${Math.abs(focusChange)}장 줄고`
      : `${topicLabel(focusTopicId)} 카드는 그대로이고`;
  const varietyText = delta.afterVariety > delta.beforeVariety
    ? `나타난 주제는 ${delta.beforeVariety}개에서 ${delta.afterVariety}개로 늘었습니다`
    : delta.afterVariety < delta.beforeVariety
      ? `나타난 주제는 ${delta.beforeVariety}개에서 ${delta.afterVariety}개로 줄었습니다`
      : `나타난 주제는 ${delta.beforeVariety}개로 같습니다`;
  return `${focusText}, ${varietyText}.`;
};

export const isDistributionAnswerCorrect = (
  answer: DistributionAnswer,
  delta: DistributionDelta,
  focusTopicId: TopicId,
): boolean => {
  const validDirection = (value: unknown): value is DirectionAnswer =>
    value === 'increase' || value === 'same' || value === 'decrease';
  if (!answer || !validDirection(answer.focusDirection) || !validDirection(answer.varietyDirection)) return false;
  const actualFocus = delta.delta[focusTopicId];
  if (!Number.isInteger(actualFocus)) return false;
  return answer.focusDirection === direction(0, actualFocus)
    && answer.varietyDirection === direction(delta.beforeVariety, delta.afterVariety);
};
