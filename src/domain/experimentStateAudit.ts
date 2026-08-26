import { CARDS } from '../data/cards';
import { SUPPLY_PROFILES } from '../data/supplyProfiles';
import {
  auditPairsEqual,
  buildAuditPair,
  cloneAuditPair,
  validateAuditPair,
  type AuditPair,
} from './auditComparison';
import type { ExperimentState } from './experimentState';
import type { InfluenceFactor } from './types';

const AUDIT_MISMATCH = '감사 비교가 가상 규칙과 일치하지 않습니다.';
const WRONG_FACTOR = '선택과 설정은 같았습니다. 바뀐 공급 조건을 다시 찾아보세요.';

const withError = (state: ExperimentState, message: string): ExperimentState => ({ ...state, lastError: message });

const expectedPairFor = (state: ExperimentState): AuditPair | null => {
  if (!state.changedResult) return null;
  try {
    return buildAuditPair(state.changedResult.request, CARDS, SUPPLY_PROFILES);
  } catch {
    return null;
  }
};

export const reduceAuditRecord = (state: ExperimentState, supplied: AuditPair): ExperimentState => {
  if (state.stage !== 'audit') return withError(state, '지금은 모델 감사 단계가 아닙니다.');
  const expected = expectedPairFor(state);
  if (!expected || validateAuditPair(expected).length > 0 || !auditPairsEqual(supplied, expected)) {
    return withError(state, AUDIT_MISMATCH);
  }
  if (state.auditPair) {
    if (auditPairsEqual(state.auditPair, expected)) return state;
    return withError(state, AUDIT_MISMATCH);
  }
  return { ...state, auditPair: cloneAuditPair(expected), lastError: null };
};

const isInfluenceFactor = (value: unknown): value is InfluenceFactor => (
  value === 'choice-record' || value === 'balance-setting' || value === 'supply-condition'
);

export const reduceAuditAnswer = (state: ExperimentState, answer: InfluenceFactor): ExperimentState => {
  if (state.stage === 'report' || state.stage === 'complete') return state;
  if (state.stage !== 'audit') return withError(state, '먼저 모델 감사 비교를 기록해 주세요.');
  if (!state.auditPair || validateAuditPair(state.auditPair).length > 0) return withError(state, AUDIT_MISMATCH);
  if (!isInfluenceFactor(answer)) return withError(state, '감사 원인을 선택해 주세요.');
  if (answer !== 'supply-condition') {
    return { ...state, auditAnswer: answer, lastError: WRONG_FACTOR };
  }
  return { ...state, stage: 'report', auditAnswer: answer, lastError: null };
};

export { AUDIT_MISMATCH, WRONG_FACTOR };
