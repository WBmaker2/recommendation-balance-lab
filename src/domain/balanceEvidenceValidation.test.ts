import { describe, expect, it } from 'vitest';
import { CARDS } from '../data/cards';
import { SUPPLY_PROFILES } from '../data/supplyProfiles';
import { applyExploration } from './exploration';
import { experimentReducer, initialExperimentState, nextPracticeCard, type ExperimentState } from './experimentState';
import { canAdvanceToAudit, hasPreAuditBalanceEvidence } from './balanceEvidenceValidation';
import { createBalancePreview, type BalanceSnapshot } from './balanceScenarios';
import { recommend } from './recommendationEngine';

const balanced = SUPPLY_PROFILES.find((profile) => profile.id === 'balanced')!;

const readyBalance = (): ExperimentState => {
  let state = experimentReducer(initialExperimentState(), { type: 'START' });
  for (let index = 0; index < 3; index += 1) {
    const card = state.choiceFeed.find((item) => item.topicId === 'science')!;
    const usedIds = new Set([...state.choiceFeed.map((item) => item.id), ...state.selectionHistory.map((item) => item.cardId)]);
    const replacement = nextPracticeCard('science', usedIds, CARDS);
    state = experimentReducer(state, { type: 'SELECT_CARD', card, replacement });
  }
  const changedRequest = {
    interest: { ...state.interest }, diversityLevel: 0 as const, memoryMode: 'keep' as const,
    supplyProfileId: 'balanced' as const, round: 1, feedSize: 8 as const,
  };
  const changedResult = recommend(changedRequest, CARDS, balanced);
  state = experimentReducer(state, {
    type: 'SUBMIT_PREDICTION', answer: { focusDirection: 'increase', varietyDirection: 'decrease' }, result: changedResult,
  });
  state = experimentReducer(state, {
    type: 'SUBMIT_DISTRIBUTION', answer: { focusDirection: 'increase', varietyDirection: 'decrease' },
  });
  const interest = applyExploration(state.interest, 'art', state.focusTopicId!);
  const explorationRequest = { ...changedRequest, interest, round: 2 };
  state = experimentReducer(state, {
    type: 'RECORD_EXPLORATION', topicId: 'art', result: recommend(explorationRequest, CARDS, balanced),
  });
  for (const [id, diversityLevel, memoryMode] of [
    ['scenario-a', 0, 'keep'], ['scenario-b', 1, 'keep'], ['scenario-c', 2, 'clear'],
  ] as const) {
    const config = { diversityLevel, memoryMode };
    const snapshot: BalanceSnapshot = {
      id,
      config,
      result: createBalancePreview(state.explorationResult!.request, config, CARDS, balanced),
    };
    state = experimentReducer(state, { type: 'SAVE_BALANCE_SNAPSHOT', snapshot });
  }
  return state;
};

describe('pre-audit evidence provenance', () => {
  it('requires the complete initial-to-exploration learner chain', () => {
    const state = readyBalance();
    expect(hasPreAuditBalanceEvidence(state)).toBe(true);
    expect(experimentReducer(state, { type: 'COMPLETE_BALANCE_COMPARISON' }).stage).toBe('audit');

    const brokenStates = [
      { ...state, initialResult: { ...state.initialResult, inputFingerprint: 'broken' } },
      { ...state, selectionHistory: [] },
      { ...state, prediction: null },
      { ...state, distributionAnswer: null },
    ];
    for (const broken of brokenStates) {
      expect(canAdvanceToAudit(broken)).toBe(false);
      expect(experimentReducer(broken, { type: 'COMPLETE_BALANCE_COMPARISON' }).stage).toBe('balance');
    }
  });

  it('rejects throwing accessor/proxy state without throwing', () => {
    const state = readyBalance();
    const throwing = new Proxy(state, {
      get(target, property, receiver) {
        if (property === 'balanceSnapshots') throw new Error('blocked');
        return Reflect.get(target, property, receiver);
      },
    });

    expect(() => canAdvanceToAudit(throwing)).not.toThrow();
    expect(canAdvanceToAudit(throwing)).toBe(false);
    expect(() => experimentReducer(throwing, { type: 'COMPLETE_BALANCE_COMPARISON' })).not.toThrow();
    expect(throwing.stage).toBe('balance');
  });
});
