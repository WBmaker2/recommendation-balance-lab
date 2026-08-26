import { TOPIC_ORDER } from '../data/topics';
import type { ContentCard } from './types';
import type { RecommendationResult } from './recommendationEngine';

const cloneCard = (card: ContentCard): ContentCard => ({ ...card });

export const cloneRecommendationResult = (result: RecommendationResult): RecommendationResult => ({
  ...result,
  request: { ...result.request, interest: { ...result.request.interest } },
  cards: result.cards.map(cloneCard),
  topicCounts: { ...result.topicCounts },
  tokenBreakdown: Object.fromEntries(
    TOPIC_ORDER.map((topicId) => [topicId, { ...result.tokenBreakdown[topicId] }]),
  ) as RecommendationResult['tokenBreakdown'],
  explanations: result.explanations.map((explanation) => ({ ...explanation })),
});

export const recommendationResultsEqual = (left: RecommendationResult, right: RecommendationResult): boolean => {
  const deepEqual = (a: unknown, b: unknown): boolean => {
    if (Object.is(a, b)) return true;
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
    if (Array.isArray(a) || Array.isArray(b)) {
      if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
      return a.every((item, index) => deepEqual(item, b[index]));
    }
    const aRecord = a as Record<string, unknown>;
    const bRecord = b as Record<string, unknown>;
    const aKeys = Object.keys(aRecord);
    const bKeys = Object.keys(bRecord);
    return aKeys.length === bKeys.length
      && aKeys.every((key) => Object.hasOwn(bRecord, key) && deepEqual(aRecord[key], bRecord[key]));
  };
  return deepEqual(left, right);
};
