import { TOPIC_ORDER } from '../data/topics';
import { recommend, type RecommendationRequest, type RecommendationResult } from './recommendationEngine';
import { cloneRecommendationResult } from './recommendationResult';
import type { ContentCard, DiversityLevel, MemoryMode, SupplyProfile } from './types';

export interface BalanceConfig {
  diversityLevel: DiversityLevel;
  memoryMode: MemoryMode;
}

export interface BalanceSnapshot {
  id: 'scenario-a' | 'scenario-b' | 'scenario-c';
  config: BalanceConfig;
  result: RecommendationResult;
}

export type SaveSnapshotResult =
  | { ok: true; snapshots: readonly BalanceSnapshot[] }
  | { ok: false; reason: 'duplicate-config' | 'three-snapshot-limit' };

export class InvalidBalanceConfigError extends Error {
  constructor() {
    super('균형 설정이 올바르지 않습니다.');
    this.name = 'InvalidBalanceConfigError';
  }
}

export class InvalidBalanceSnapshotError extends Error {
  constructor() {
    super('저장할 균형 결과가 올바르지 않습니다.');
    this.name = 'InvalidBalanceSnapshotError';
  }
}

const isDiversityLevel = (value: unknown): value is DiversityLevel => value === 0 || value === 1 || value === 2;
const isMemoryMode = (value: unknown): value is MemoryMode => value === 'keep' || value === 'clear';
const isBalanceConfig = (value: unknown): value is BalanceConfig => {
  if (!value || typeof value !== 'object') return false;
  const config = value as Partial<BalanceConfig>;
  const keys = Object.keys(config);
  return keys.length === 2 && keys.includes('diversityLevel') && keys.includes('memoryMode')
    && isDiversityLevel(config.diversityLevel) && isMemoryMode(config.memoryMode);
};
const cloneConfig = (config: BalanceConfig): BalanceConfig => ({ ...config });
const sameConfig = (left: BalanceConfig, right: BalanceConfig): boolean =>
  left.diversityLevel === right.diversityLevel && left.memoryMode === right.memoryMode;

export const createBalancePreview = (
  baseRequest: RecommendationRequest,
  config: BalanceConfig,
  cards: readonly ContentCard[],
  supply: SupplyProfile,
): RecommendationResult => {
  if (!isBalanceConfig(config)) throw new InvalidBalanceConfigError();
  const request: RecommendationRequest = {
    ...baseRequest,
    interest: Object.fromEntries(TOPIC_ORDER.map((topicId) => [topicId, baseRequest.interest[topicId]])) as RecommendationRequest['interest'],
    diversityLevel: config.diversityLevel,
    memoryMode: config.memoryMode,
  };
  return recommend(request, cards, supply);
};

const isSnapshotShape = (value: unknown): value is BalanceSnapshot => {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as Partial<BalanceSnapshot>;
  return (snapshot.id === 'scenario-a' || snapshot.id === 'scenario-b' || snapshot.id === 'scenario-c')
    && isBalanceConfig(snapshot.config)
    && isRecommendationResultShape(snapshot.result);
};

const isRecommendationResultShape = (value: unknown): value is RecommendationResult => {
  if (!value || typeof value !== 'object') return false;
  const result = value as Partial<RecommendationResult>;
  const request = result.request;
  return Boolean(request && typeof request === 'object')
    && isDiversityLevel(request?.diversityLevel)
    && isMemoryMode(request?.memoryMode)
    && Array.isArray(result.cards)
    && Boolean(result.topicCounts && typeof result.topicCounts === 'object')
    && Boolean(result.tokenBreakdown && typeof result.tokenBreakdown === 'object')
    && Array.isArray(result.explanations)
    && typeof result.inputFingerprint === 'string';
};

export const saveBalanceSnapshot = (
  existing: readonly BalanceSnapshot[],
  config: BalanceConfig,
  result: RecommendationResult,
): SaveSnapshotResult => {
  if (!Array.isArray(existing) || !isBalanceConfig(config) || !isRecommendationResultShape(result)) {
    throw new InvalidBalanceSnapshotError();
  }
  if (!result.request || !isDiversityLevel(result.request.diversityLevel) || !isMemoryMode(result.request.memoryMode)
    || !sameConfig(config, {
    diversityLevel: result.request.diversityLevel,
    memoryMode: result.request.memoryMode,
  })) throw new InvalidBalanceSnapshotError();
  if (existing.some((snapshot) => !isSnapshotShape(snapshot))) throw new InvalidBalanceSnapshotError();
  if (existing.some((snapshot) => sameConfig(snapshot.config, config))) {
    return { ok: false, reason: 'duplicate-config' };
  }
  if (existing.length >= 3) return { ok: false, reason: 'three-snapshot-limit' };
  const id = `scenario-${String.fromCharCode(97 + existing.length)}` as BalanceSnapshot['id'];
  const snapshot: BalanceSnapshot = {
    id,
    config: cloneConfig(config),
    result: cloneRecommendationResult(result),
  };
  return { ok: true, snapshots: [...existing.map((item) => ({
    id: item.id,
    config: cloneConfig(item.config),
    result: cloneRecommendationResult(item.result),
  })), snapshot] };
};

export const canCompareBalance = (snapshots: readonly BalanceSnapshot[]): boolean => {
  if (!Array.isArray(snapshots) || snapshots.length !== 3) return false;
  const expectedIds: BalanceSnapshot['id'][] = ['scenario-a', 'scenario-b', 'scenario-c'];
  const configs: BalanceConfig[] = [];
  try {
    return snapshots.every((snapshot, index) => {
      if (!isSnapshotShape(snapshot) || snapshot.id !== expectedIds[index]) return false;
      if (configs.some((config) => sameConfig(config, snapshot.config))) return false;
      configs.push(snapshot.config);
      return sameConfig(snapshot.config, {
        diversityLevel: snapshot.result.request.diversityLevel,
        memoryMode: snapshot.result.request.memoryMode,
      });
    });
  } catch {
    return false;
  }
};

export { isBalanceConfig };
