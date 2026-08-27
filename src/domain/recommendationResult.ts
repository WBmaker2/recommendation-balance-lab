import { CARDS } from '../data/cards';
import { SUPPLY_PROFILES } from '../data/supplyProfiles';
import { TOPIC_ORDER } from '../data/topics';
import type { ContentCard } from './types';
import { recommend, type RecommendationResult } from './recommendationEngine';
import { isExactRecommendationRequest } from './recommendationValidation';

const cloneCard = (card: ContentCard): ContentCard => ({ ...card });

export const isDenseArray = (value: unknown): value is readonly unknown[] => {
  try {
    if (!Array.isArray(value)) return false;
    const ownKeys = Reflect.ownKeys(value);
    if (ownKeys.length !== value.length + 1) return false;
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index) || !Object.hasOwn(value, String(index))) return false;
    }
    const expectedKeys = new Set(['length', ...Array.from({ length: value.length }, (_item, index) => String(index))]);
    return ownKeys.every((key) => typeof key === 'string' && expectedKeys.has(key));
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
  if (Object.getPrototypeOf(aRecord) !== Object.prototype || Object.getPrototypeOf(bRecord) !== Object.prototype) return false;
  const aKeys = Reflect.ownKeys(aRecord);
  const bKeys = Reflect.ownKeys(bRecord);
  return aKeys.length === bKeys.length
    && aKeys.every((key) => Object.hasOwn(bRecord, key) && deepEqual(aRecord[key as string], bRecord[key as string]));
};

export const recommendationResultsEqual = (left: RecommendationResult, right: RecommendationResult): boolean => {
  return deepEqual(left, right);
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
    if (!isExactRecommendationRequest(request) || !isCanonicalCardList(result.cards)) return false;
    const supply = SUPPLY_PROFILES.find((item) => item.id === request.supplyProfileId);
    if (!supply) return false;
    const expected = recommend(request, CARDS, supply);
    return deepEqual(result, expected);
  } catch {
    return false;
  }
};
