import { CARDS } from '../data/cards';
import { SUPPLY_PROFILES } from '../data/supplyProfiles';
import { TOPIC_ORDER } from '../data/topics';
import type { ContentCard } from './types';
import { recommend, type RecommendationRequest, type RecommendationResult } from './recommendationEngine';

const cloneCard = (card: ContentCard): ContentCard => ({ ...card });

export const isDenseArray = (value: unknown): value is readonly unknown[] => {
  try {
    if (!Array.isArray(value)) return false;
    const keys = Object.keys(value);
    if (keys.length !== value.length) return false;
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index) || !Object.hasOwn(value, String(index))) return false;
    }
    return keys.every((key, index) => key === String(index));
  } catch {
    return false;
  }
};

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

const deepEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || !isDenseArray(a) || !isDenseArray(b)) return false;
    for (let index = 0; index < a.length; index += 1) {
      if (!deepEqual(a[index], b[index])) return false;
    }
    return true;
  }
  const aRecord = a as Record<string, unknown>;
  const bRecord = b as Record<string, unknown>;
  const aKeys = Object.keys(aRecord);
  const bKeys = Object.keys(bRecord);
  return aKeys.length === bKeys.length
    && aKeys.every((key) => Object.hasOwn(bRecord, key) && deepEqual(aRecord[key], bRecord[key]));
};

export const recommendationResultsEqual = (left: RecommendationResult, right: RecommendationResult): boolean => {
  return deepEqual(left, right);
};

const isRequestShape = (value: unknown): value is RecommendationRequest => {
  if (!value || typeof value !== 'object') return false;
  const request = value as Partial<RecommendationRequest>;
  if (!request.interest || typeof request.interest !== 'object') return false;
  if (typeof request.round !== 'number' || !Number.isInteger(request.round) || request.round < 0 || request.feedSize !== 8) return false;
  if (request.diversityLevel !== 0 && request.diversityLevel !== 1 && request.diversityLevel !== 2) return false;
  if (request.memoryMode !== 'keep' && request.memoryMode !== 'clear') return false;
  if (!SUPPLY_PROFILES.some((supply) => supply.id === request.supplyProfileId)) return false;
  return TOPIC_ORDER.every((topicId) => {
    const interest = request.interest as Record<string, unknown>;
    return Object.hasOwn(interest, topicId) && Number.isFinite(interest[topicId]) && (interest[topicId] as number) >= 0;
  });
};

const isCanonicalCardList = (value: unknown): value is readonly ContentCard[] => {
  if (!isDenseArray(value) || value.length !== 8) return false;
  const ids = new Set<string>();
  for (let index = 0; index < value.length; index += 1) {
    const card = value[index] as ContentCard;
    if (!card || typeof card !== 'object' || ids.has(card.id)) return false;
    const canonical = CARDS.find((item) => item.id === card.id);
    if (!canonical || !deepEqual(card, canonical)) return false;
    ids.add(card.id);
  }
  return true;
};

export const isValidRecommendationResult = (value: unknown): value is RecommendationResult => {
  try {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const result = value as Partial<RecommendationResult>;
    const request = result.request;
    if (!isRequestShape(request) || !isCanonicalCardList(result.cards)) return false;
    const supply = SUPPLY_PROFILES.find((item) => item.id === request.supplyProfileId);
    if (!supply) return false;
    const expected = recommend(request, CARDS, supply);
    return deepEqual(result, expected);
  } catch {
    return false;
  }
};
