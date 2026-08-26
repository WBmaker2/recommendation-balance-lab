import { CARDS } from '../data/cards';
import { SUPPLY_PROFILES } from '../data/supplyProfiles';
import { TOPIC_ORDER } from '../data/topics';
import { countTopicCards } from './distribution';
import { hasOwnedAuditEvidence } from './auditEvidenceValidation';
import { recommend, type RecommendationRequest, type RecommendationResult } from './recommendationEngine';
import { cloneRecommendationResult, isValidRecommendationResult, recommendationResultsEqual } from './recommendationResult';
import type { ContentCard, DiversityLevel, InterestRecord, MemoryMode, SupplyProfile, TopicCounts } from './types';

export interface AuditPair {
  balanced: RecommendationResult;
  natureRich: RecommendationResult;
  invariantInterest: InterestRecord;
  invariantDiversityLevel: DiversityLevel;
  invariantMemoryMode: MemoryMode;
  changedField: 'supplyProfileId';
}

export type AuditIssueCode =
  | 'interest-mismatch'
  | 'diversity-mismatch'
  | 'memory-mismatch'
  | 'round-mismatch'
  | 'same-supply'
  | 'invalid-feed-size'
  | 'no-result-change';

export interface AuditIssue {
  code: AuditIssueCode;
}

export class InvalidAuditPairError extends Error {
  constructor() {
    super('감사 비교 입력이 올바르지 않습니다.');
    this.name = 'InvalidAuditPairError';
  }
}

const cloneInterest = (interest: InterestRecord): InterestRecord => (
  Object.fromEntries(TOPIC_ORDER.map((topicId) => [topicId, interest[topicId]])) as InterestRecord
);

const freezeDeep = <T>(value: T): T => {
  const isDevelopment = Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV);
  if (!isDevelopment || typeof value !== 'object' || value === null || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value as Record<string, unknown>)) freezeDeep(child);
  return value;
};

const cloneAuditResult = (result: RecommendationResult): RecommendationResult => cloneRecommendationResult(result);

const AUDIT_PAIR_KEYS = [
  'balanced',
  'natureRich',
  'invariantInterest',
  'invariantDiversityLevel',
  'invariantMemoryMode',
  'changedField',
] as const;

const hasExactOwnKeys = (value: unknown, requiredKeys: readonly string[]): boolean => {
  try {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) return false;
    const keys = Reflect.ownKeys(value);
    if (keys.length !== requiredKeys.length) return false;
    const required = new Set(requiredKeys);
    return keys.every((key) => typeof key === 'string' && required.has(key))
      && requiredKeys.every((key) => Object.hasOwn(value, key)
        && Object.getOwnPropertyDescriptor(value, key)?.enumerable === true);
  } catch {
    return false;
  }
};

const isExactAuditPairShape = (value: unknown): value is AuditPair => {
  if (!hasExactOwnKeys(value, AUDIT_PAIR_KEYS)) return false;
  const pair = value as AuditPair;
  return hasExactOwnKeys(pair.invariantInterest, TOPIC_ORDER)
    && pair.changedField === 'supplyProfileId';
};

const isOwnedAuditPair = (value: unknown): value is AuditPair => (
  isExactAuditPairShape(value) && hasOwnedAuditEvidence(value)
);

export const cloneAuditPair = (pair: AuditPair): AuditPair => ({
  balanced: cloneAuditResult(pair.balanced),
  natureRich: cloneAuditResult(pair.natureRich),
  invariantInterest: cloneInterest(pair.invariantInterest),
  invariantDiversityLevel: pair.invariantDiversityLevel,
  invariantMemoryMode: pair.invariantMemoryMode,
  changedField: pair.changedField,
});

const validBaseRequest = (request: RecommendationRequest): boolean => {
  if (!request || typeof request !== 'object' || request.feedSize !== 8) return false;
  if (request.diversityLevel !== 0 && request.diversityLevel !== 1 && request.diversityLevel !== 2) return false;
  if (request.memoryMode !== 'keep' && request.memoryMode !== 'clear') return false;
  if (!Number.isInteger(request.round) || request.round < 0) return false;
  return TOPIC_ORDER.every((topicId) => Number.isFinite(request.interest?.[topicId]) && request.interest[topicId] >= 0);
};

const requiredSupply = (supplies: readonly SupplyProfile[], id: SupplyProfile['id']): SupplyProfile => {
  const matches = supplies.filter((supply) => supply?.id === id);
  if (matches.length !== 1) throw new InvalidAuditPairError();
  return matches[0];
};

export const buildAuditPair = (
  baseRequest: RecommendationRequest,
  cards: readonly ContentCard[] = CARDS,
  supplies: readonly SupplyProfile[] = SUPPLY_PROFILES,
): AuditPair => {
  try {
    if (!validBaseRequest(baseRequest)) throw new InvalidAuditPairError();
    const balancedSupply = requiredSupply(supplies, 'balanced');
    const natureRichSupply = requiredSupply(supplies, 'nature-rich');
    const invariantInterest = cloneInterest(baseRequest.interest);
    const common = {
      interest: cloneInterest(invariantInterest),
      diversityLevel: baseRequest.diversityLevel,
      memoryMode: baseRequest.memoryMode,
      round: baseRequest.round,
      feedSize: 8 as const,
    };
    const balanced = recommend({ ...common, supplyProfileId: 'balanced' }, cards, balancedSupply);
    const natureRich = recommend({ ...common, supplyProfileId: 'nature-rich' }, cards, natureRichSupply);
    const pair: AuditPair = {
      balanced: cloneAuditResult(balanced),
      natureRich: cloneAuditResult(natureRich),
      invariantInterest,
      invariantDiversityLevel: baseRequest.diversityLevel,
      invariantMemoryMode: baseRequest.memoryMode,
      changedField: 'supplyProfileId',
    };
    return freezeDeep(pair);
  } catch {
    throw new InvalidAuditPairError();
  }
};

const hasInterestMismatch = (pair: Partial<AuditPair>): boolean => {
  try {
    const invariant = pair.invariantInterest;
    const left = pair.balanced?.request?.interest;
    const right = pair.natureRich?.request?.interest;
    if (!invariant || !left || !right) return true;
    return TOPIC_ORDER.some((topicId) => left[topicId] !== invariant[topicId] || right[topicId] !== invariant[topicId]);
  } catch {
    return true;
  }
};

const validDiversity = (value: unknown): value is DiversityLevel => value === 0 || value === 1 || value === 2;
const validMemory = (value: unknown): value is MemoryMode => value === 'keep' || value === 'clear';

export const validateAuditPair = (candidate: AuditPair): readonly AuditIssue[] => {
  const issues: AuditIssue[] = [];
  try {
    const pair = candidate as Partial<AuditPair>;
    const left = pair.balanced;
    const right = pair.natureRich;
    if (hasInterestMismatch(pair)) issues.push({ code: 'interest-mismatch' });
    if (!validDiversity(pair.invariantDiversityLevel)
      || left?.request?.diversityLevel !== pair.invariantDiversityLevel
      || right?.request?.diversityLevel !== pair.invariantDiversityLevel) {
      issues.push({ code: 'diversity-mismatch' });
    }
    if (!validMemory(pair.invariantMemoryMode)
      || left?.request?.memoryMode !== pair.invariantMemoryMode
      || right?.request?.memoryMode !== pair.invariantMemoryMode) {
      issues.push({ code: 'memory-mismatch' });
    }
    if (left?.request?.round !== right?.request?.round
      || typeof left?.request?.round !== 'number'
      || typeof right?.request?.round !== 'number') {
      issues.push({ code: 'round-mismatch' });
    }
    const leftSupply = left?.request?.supplyProfileId;
    const rightSupply = right?.request?.supplyProfileId;
    const isKnownSupply = (value: unknown): value is SupplyProfile['id'] => (
      typeof value === 'string' && SUPPLY_PROFILES.some((supply) => supply.id === value)
    );
    if (isKnownSupply(leftSupply) && leftSupply === rightSupply) issues.push({ code: 'same-supply' });
    const validResults = isOwnedAuditPair(candidate)
      && isValidRecommendationResult(left) && isValidRecommendationResult(right)
      && left.cards.length === 8 && right.cards.length === 8;
    if (!validResults) {
      issues.push({ code: 'invalid-feed-size' });
    } else if (JSON.stringify(countTopicCards(left.cards)) === JSON.stringify(countTopicCards(right.cards))) {
      issues.push({ code: 'no-result-change' });
    }
  } catch {
    if (!issues.some((issue) => issue.code === 'invalid-feed-size')) issues.push({ code: 'invalid-feed-size' });
  }
  return issues;
};

const stableObjectEqual = (left: unknown, right: unknown): boolean => {
  try {
    if (Object.is(left, right)) return true;
    if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;
    const leftRecord = left as Record<string, unknown>;
    const rightRecord = right as Record<string, unknown>;
    const leftKeys = Reflect.ownKeys(leftRecord);
    const rightKeys = Reflect.ownKeys(rightRecord);
    return leftKeys.length === rightKeys.length
      && leftKeys.every((key) => Object.hasOwn(rightRecord, key) && stableObjectEqual(leftRecord[key as string], rightRecord[key as string]));
  } catch {
    return false;
  }
};

export const auditPairsEqual = (left: AuditPair, right: AuditPair): boolean => {
  try {
    if (!isOwnedAuditPair(left) || !isOwnedAuditPair(right)) return false;
    if (!isValidRecommendationResult(left.balanced) || !isValidRecommendationResult(left.natureRich)
      || !isValidRecommendationResult(right.balanced) || !isValidRecommendationResult(right.natureRich)) return false;
    return stableObjectEqual(left.invariantInterest, right.invariantInterest)
      && left.invariantDiversityLevel === right.invariantDiversityLevel
      && left.invariantMemoryMode === right.invariantMemoryMode
      && left.changedField === right.changedField
      && recommendationResultsEqual(left.balanced, right.balanced)
      && recommendationResultsEqual(left.natureRich, right.natureRich);
  } catch {
    return false;
  }
};

export const countSupplyCandidates = (
  cards: readonly ContentCard[],
  supply: SupplyProfile,
): TopicCounts => {
  const byId = new Map(cards.map((card) => [card.id, card]));
  const seen = new Set<string>();
  const counts = Object.fromEntries(TOPIC_ORDER.map((topicId) => [topicId, 0])) as TopicCounts;
  for (const cardId of supply.candidateCardIds) {
    if (seen.has(cardId)) continue;
    const card = byId.get(cardId);
    if (!card) continue;
    seen.add(cardId);
    counts[card.topicId] += 1;
  }
  return counts;
};
