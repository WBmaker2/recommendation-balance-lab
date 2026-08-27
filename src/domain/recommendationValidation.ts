import { TOPIC_ORDER } from '../data/topics';
import type { RecommendationRequest } from './recommendationEngine';
import type { DiversityLevel, InterestRecord, MemoryMode, SupplyProfileId } from './types';

const REQUEST_KEYS = ['interest', 'diversityLevel', 'memoryMode', 'supplyProfileId', 'round', 'feedSize'] as const;
type Snapshot = Record<string, unknown>;

const readExactData = (value: unknown, keys: readonly string[]): Snapshot | null => {
  try {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) return null;
    const ownKeys = Reflect.ownKeys(value);
    if (ownKeys.length !== keys.length || ownKeys.some((key) => typeof key !== 'string' || !keys.includes(key))) return null;
    const snapshot: Snapshot = {};
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !descriptor.enumerable || !('value' in descriptor) || 'get' in descriptor || 'set' in descriptor) return null;
      if (!Object.is(Reflect.get(value, key), descriptor.value)) return null;
      snapshot[key] = descriptor.value;
    }
    return snapshot;
  } catch {
    return null;
  }
};

const isDiversityLevel = (value: unknown): value is DiversityLevel => value === 0 || value === 1 || value === 2;
const isMemoryMode = (value: unknown): value is MemoryMode => value === 'keep' || value === 'clear';
const isSupplyProfileId = (value: unknown): value is SupplyProfileId => value === 'balanced' || value === 'nature-rich';

/** Reads and validates an exact interest record into an immutable plain snapshot. */
export const parseExactInterestRecord = (value: unknown): InterestRecord | null => {
  const snapshot = readExactData(value, TOPIC_ORDER);
  if (!snapshot || !TOPIC_ORDER.every((topicId) => typeof snapshot[topicId] === 'number'
    && Number.isInteger(snapshot[topicId]) && (snapshot[topicId] as number) >= 0)) return null;
  return Object.freeze({ ...snapshot }) as InterestRecord;
};

/** Reads and validates an exact recommendation request without rereading its source. */
export const parseRecommendationRequest = (value: unknown): RecommendationRequest | null => {
  const snapshot = readExactData(value, REQUEST_KEYS);
  if (!snapshot) return null;
  const interest = parseExactInterestRecord(snapshot.interest);
  if (!interest || !isDiversityLevel(snapshot.diversityLevel) || !isMemoryMode(snapshot.memoryMode)
    || !isSupplyProfileId(snapshot.supplyProfileId) || typeof snapshot.round !== 'number'
    || !Number.isInteger(snapshot.round) || snapshot.round < 0 || snapshot.feedSize !== 8) return null;
  return Object.freeze({
    interest,
    diversityLevel: snapshot.diversityLevel,
    memoryMode: snapshot.memoryMode,
    supplyProfileId: snapshot.supplyProfileId,
    round: snapshot.round,
    feedSize: 8,
  }) as RecommendationRequest;
};

/** Accepts exactly five enumerable own integer data properties, with no symbols or extras. */
export const isExactInterestRecord = (value: unknown): value is InterestRecord => parseExactInterestRecord(value) !== null;

/** Accepts only the exact recommendation request fields and enum/range values. */
export const isExactRecommendationRequest = (value: unknown): value is RecommendationRequest => parseRecommendationRequest(value) !== null;
