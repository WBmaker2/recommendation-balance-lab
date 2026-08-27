import { TOPIC_ORDER } from '../data/topics';
import type { RecommendationRequest } from './recommendationEngine';
import type { DiversityLevel, InterestRecord, MemoryMode, SupplyProfileId } from './types';

const REQUEST_KEYS = ['interest', 'diversityLevel', 'memoryMode', 'supplyProfileId', 'round', 'feedSize'] as const;

const isPlainDataObject = (value: unknown): value is Record<PropertyKey, unknown> => {
  try {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) return false;
    return Reflect.ownKeys(value).every((key) => {
      if (typeof key !== 'string') return false;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      return Boolean(descriptor?.enumerable && 'value' in descriptor && !('get' in descriptor) && !('set' in descriptor));
    });
  } catch {
    return false;
  }
};

const exactKeys = (value: Record<PropertyKey, unknown>, expected: readonly string[]): boolean => {
  try {
    const keys = Reflect.ownKeys(value);
    return keys.length === expected.length
      && keys.every((key) => typeof key === 'string' && expected.includes(key))
      && expected.every((key) => Object.hasOwn(value, key));
  } catch {
    return false;
  }
};

const dataValue = (value: Record<PropertyKey, unknown>, key: string): unknown => {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor || !('value' in descriptor)) return undefined;
  const actual = Reflect.get(value, key);
  return Object.is(actual, descriptor.value) ? descriptor.value : undefined;
};

const isDiversityLevel = (value: unknown): value is DiversityLevel => value === 0 || value === 1 || value === 2;
const isMemoryMode = (value: unknown): value is MemoryMode => value === 'keep' || value === 'clear';
const isSupplyProfileId = (value: unknown): value is SupplyProfileId => value === 'balanced' || value === 'nature-rich';

/** Accepts exactly five enumerable own integer data properties, with no symbols or extras. */
export const isExactInterestRecord = (value: unknown): value is InterestRecord => {
  try {
    if (!isPlainDataObject(value) || !exactKeys(value, TOPIC_ORDER)) return false;
    return TOPIC_ORDER.every((topicId) => {
      const token = dataValue(value, topicId);
      return typeof token === 'number' && Number.isInteger(token) && token >= 0;
    });
  } catch {
    return false;
  }
};

/** Accepts only the exact recommendation request fields and enum/range values. */
export const isExactRecommendationRequest = (value: unknown): value is RecommendationRequest => {
  try {
    if (!isPlainDataObject(value) || !exactKeys(value, REQUEST_KEYS)) return false;
    const request = value;
    const round = dataValue(request, 'round');
    return isExactInterestRecord(dataValue(request, 'interest'))
      && isDiversityLevel(dataValue(request, 'diversityLevel'))
      && isMemoryMode(dataValue(request, 'memoryMode'))
      && isSupplyProfileId(dataValue(request, 'supplyProfileId'))
      && typeof round === 'number'
      && Number.isInteger(round)
      && round >= 0
      && dataValue(request, 'feedSize') === 8;
  } catch {
    return false;
  }
};
