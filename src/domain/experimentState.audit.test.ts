import { describe, expect, it } from 'vitest';
import { CARDS } from '../data/cards';
import { SUPPLY_PROFILES } from '../data/supplyProfiles';
import { buildAuditPair } from './auditComparison';
import { experimentReducer, initialExperimentState, type ExperimentState } from './experimentState';
import { recommend } from './recommendationEngine';

const request = {
  interest: { science: 3, art: 0, sports: 0, nature: 0, history: 0 },
  diversityLevel: 0 as const,
  memoryMode: 'keep' as const,
  supplyProfileId: 'balanced' as const,
  round: 1,
  feedSize: 8 as const,
};
const balanced = SUPPLY_PROFILES.find((supply) => supply.id === 'balanced')!;
const readyState = (): ExperimentState => ({
  ...initialExperimentState(),
  stage: 'audit',
  changedResult: recommend(request, CARDS, balanced),
  interest: { science: 99, art: 0, sports: 0, nature: 0, history: 0 },
});

describe('미션 5 감사 reducer gates', () => {
  it('rebuilds from Mission 1 changedResult request and records only matching evidence', () => {
    const state = readyState();
    const pair = buildAuditPair(request, CARDS, SUPPLY_PROFILES);
    const recorded = experimentReducer(state, { type: 'RECORD_AUDIT', pair });
    expect(recorded.auditPair).toEqual(pair);
    expect(recorded.lastError).toBeNull();
    expect(experimentReducer(recorded, { type: 'RECORD_AUDIT', pair })).toEqual(recorded);
    const tampered = { ...pair, invariantInterest: { ...pair.invariantInterest, science: 99 } };
    const rejected = experimentReducer(state, { type: 'RECORD_AUDIT', pair: tampered });
    expect(rejected.auditPair).toBeNull();
    expect(rejected.lastError).toBe('감사 비교가 가상 규칙과 일치하지 않습니다.');
  });

  it('stores wrong choices for revision and opens report only for supply condition', () => {
    const pair = buildAuditPair(request, CARDS, SUPPLY_PROFILES);
    const recorded = experimentReducer(readyState(), { type: 'RECORD_AUDIT', pair });
    const wrong = experimentReducer(recorded, { type: 'SUBMIT_AUDIT_ANSWER', answer: 'balance-setting' });
    expect(wrong.stage).toBe('audit');
    expect(wrong.auditAnswer).toBe('balance-setting');
    expect(wrong.lastError).toBe('선택과 설정은 같았습니다. 바뀐 공급 조건을 다시 찾아보세요.');
    const right = experimentReducer(wrong, { type: 'SUBMIT_AUDIT_ANSWER', answer: 'supply-condition' });
    expect(right.stage).toBe('report');
    expect(right.auditPair).toEqual(recorded.auditPair);
    expect(experimentReducer(right, { type: 'SUBMIT_AUDIT_ANSWER', answer: 'supply-condition' })).toEqual(right);
  });

  it('rejects an action pair that shares nested evidence references', () => {
    const expected = buildAuditPair(request, CARDS, SUPPLY_PROFILES);
    const aliased = {
      ...expected,
      natureRich: {
        ...expected.natureRich,
        request: { ...expected.natureRich.request, interest: expected.balanced.request.interest },
      },
    };
    const rejected = experimentReducer(readyState(), { type: 'RECORD_AUDIT', pair: aliased });
    expect(rejected.auditPair).toBeNull();
    expect(rejected.lastError).toBe('감사 비교가 가상 규칙과 일치하지 않습니다.');
  });
});
