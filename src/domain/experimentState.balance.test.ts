import { describe, expect, it } from 'vitest';
import { CARDS } from '../data/cards';
import { SUPPLY_PROFILES } from '../data/supplyProfiles';
import { canCompareBalance, createBalancePreview, type BalanceSnapshot } from './balanceScenarios';
import { experimentReducer, initialExperimentState, type ExperimentState } from './experimentState';

const supply = SUPPLY_PROFILES.find((profile) => profile.id === 'balanced')!;
const baseRequest = {
  interest: { science: 3, art: 0, sports: 0, nature: 0, history: 1 },
  diversityLevel: 0 as const,
  memoryMode: 'keep' as const,
  supplyProfileId: 'balanced' as const,
  round: 2,
  feedSize: 8 as const,
};
const readyState = (): ExperimentState => {
  const state = initialExperimentState();
  const changedRequest = { ...baseRequest, interest: { science: 3, art: 0, sports: 0, nature: 0, history: 0 }, round: 1 };
  const explorationRequest = { ...changedRequest, interest: { ...changedRequest.interest, art: 1 }, round: 2 };
  const changed = createBalancePreview(changedRequest, { diversityLevel: 0, memoryMode: 'keep' }, CARDS, supply);
  const exploration = createBalancePreview(explorationRequest, { diversityLevel: 0, memoryMode: 'keep' }, CARDS, supply);
  return {
    ...state,
    stage: 'balance',
    interest: { ...explorationRequest.interest },
    focusTopicId: 'science',
    explorationResult: exploration,
    changedResult: changed,
  };
};
const snapshotFor = (state: ExperimentState, id: BalanceSnapshot['id'], diversityLevel: 0 | 1 | 2, memoryMode: 'keep' | 'clear'): BalanceSnapshot => {
  const result = createBalancePreview(state.explorationResult!.request, { diversityLevel, memoryMode }, CARDS, supply);
  return { id, config: { diversityLevel, memoryMode }, result };
};

const snapshotForRequest = (request: typeof baseRequest, id: BalanceSnapshot['id'], diversityLevel: 0 | 1 | 2): BalanceSnapshot => ({
  id,
  config: { diversityLevel, memoryMode: 'keep' },
  result: createBalancePreview(request, { diversityLevel, memoryMode: 'keep' }, CARDS, supply),
});

describe('balance reducer gates', () => {
  it('starts with isolated balance state and changes config without changing interest', () => {
    const first = initialExperimentState();
    const second = initialExperimentState();
    expect(first.balanceConfig).toEqual({ diversityLevel: 0, memoryMode: 'keep' });
    expect(first.balanceSnapshots).toEqual([]);
    expect(first.balanceCompared).toBe(false);
    expect(first.balanceSnapshots).not.toBe(second.balanceSnapshots);
    const state = readyState();
    const changed = experimentReducer(state, { type: 'SET_BALANCE_CONFIG', config: { diversityLevel: 2, memoryMode: 'clear' } });
    expect(changed.balanceConfig).toEqual({ diversityLevel: 2, memoryMode: 'clear' });
    expect(changed.interest).toEqual(state.interest);
    expect(changed.explorationResult).toBe(state.explorationResult);
  });

  it('rejects config changes and actions outside the balance stage', () => {
    const intro = initialExperimentState();
    const blocked = experimentReducer(intro, { type: 'SET_BALANCE_CONFIG', config: { diversityLevel: 9 as 0, memoryMode: 'keep' } });
    expect(blocked.stage).toBe('intro');
    expect(blocked.lastError).toBe('지금은 균형을 조절하는 단계가 아닙니다.');
    const state = readyState();
    const invalid = experimentReducer(state, { type: 'SET_BALANCE_CONFIG', config: { diversityLevel: 9 as 0, memoryMode: 'unknown' as 'keep' } });
    expect(invalid.balanceConfig).toEqual(state.balanceConfig);
    expect(invalid.lastError).toBe('균형 설정이 올바르지 않습니다.');
  });

  it('recomputes snapshot evidence, assigns ids, and preserves interest on clear', () => {
    const state = readyState();
    const a = snapshotFor(state, 'scenario-a', 0, 'keep');
    const savedA = experimentReducer(state, { type: 'SAVE_BALANCE_SNAPSHOT', snapshot: a });
    expect(savedA.balanceSnapshots).toHaveLength(1);
    expect(savedA.balanceSnapshots[0].id).toBe('scenario-a');
    const b = snapshotFor(savedA, 'scenario-b', 2, 'keep');
    const savedB = experimentReducer(savedA, { type: 'SAVE_BALANCE_SNAPSHOT', snapshot: b });
    const c = snapshotFor(savedB, 'scenario-c', 1, 'clear');
    const savedC = experimentReducer(savedB, { type: 'SAVE_BALANCE_SNAPSHOT', snapshot: c });
    expect(savedC.balanceSnapshots.map((snapshot) => snapshot.id)).toEqual(['scenario-a', 'scenario-b', 'scenario-c']);
    expect(savedC.interest).toEqual(state.interest);
    expect(savedC.balanceSnapshots[2].result.topicCounts).toEqual({ science: 2, art: 2, sports: 2, nature: 1, history: 1 });
    expect(canCompareBalance(savedC.balanceSnapshots)).toBe(true);
  });

  it('rejects tampered snapshots and gates completion until three valid snapshots', () => {
    const state = readyState();
    const a = snapshotFor(state, 'scenario-a', 0, 'keep');
    const tampered = { ...a, result: { ...a.result, topicCounts: { ...a.result.topicCounts, science: 8 } } };
    const rejected = experimentReducer(state, { type: 'SAVE_BALANCE_SNAPSHOT', snapshot: tampered });
    expect(rejected.balanceSnapshots).toHaveLength(0);
    expect(rejected.lastError).toBe('저장할 설정 결과가 가상 규칙과 일치하지 않습니다.');
    expect(experimentReducer(state, { type: 'COMPLETE_BALANCE_COMPARISON' }).stage).toBe('balance');
    let filled = state;
    for (const [id, level] of [['scenario-a', 0], ['scenario-b', 1], ['scenario-c', 2]] as const) {
      filled = experimentReducer(filled, { type: 'SAVE_BALANCE_SNAPSHOT', snapshot: snapshotFor(filled, id, level, 'keep') });
    }
    const completed = experimentReducer(filled, { type: 'COMPLETE_BALANCE_COMPARISON' });
    expect(completed.stage).toBe('audit');
    expect(completed.balanceCompared).toBe(true);
    expect(experimentReducer(completed, { type: 'COMPLETE_BALANCE_COMPARISON' })).toEqual(completed);
  });

  it('rejects canonical-looking snapshots from an unrelated exploration request', () => {
    const state = readyState();
    const unrelatedRequest = {
      ...baseRequest,
      interest: { science: 0, art: 2, sports: 0, nature: 0, history: 0 },
      round: 9,
    };
    const malformed = {
      ...state,
      balanceSnapshots: [
        snapshotForRequest(unrelatedRequest, 'scenario-a', 0),
        snapshotForRequest(unrelatedRequest, 'scenario-b', 1),
        snapshotForRequest(unrelatedRequest, 'scenario-c', 2),
      ],
    };

    const reduced = experimentReducer(malformed, { type: 'COMPLETE_BALANCE_COMPARISON' });

    expect(reduced.stage).toBe('balance');
    expect(reduced.balanceCompared).toBe(false);
    expect(reduced.auditPair).toBeNull();
  });
});
