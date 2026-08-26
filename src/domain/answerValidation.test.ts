import { describe, expect, it } from 'vitest';
import { isExactDirectionAnswer } from './answerValidation';
import { experimentReducer, initialExperimentState, type PredictionAnswer } from './experimentState';

const valid = (): PredictionAnswer => ({
  focusDirection: 'increase',
  varietyDirection: 'decrease',
});

const choiceState = () => {
  const state = initialExperimentState();
  return {
    ...state,
    stage: 'choice' as const,
    focusTopicId: 'science' as const,
    selectionHistory: [
      { cardId: 'science-1' as const, topicId: 'science' as const, ordinal: 1 as const },
      { cardId: 'science-2' as const, topicId: 'science' as const, ordinal: 2 as const },
      { cardId: 'science-3' as const, topicId: 'science' as const, ordinal: 3 as const },
    ],
  };
};

describe('exact direction answer boundaries', () => {
  it('rejects extra, symbol, non-enumerable, accessor, and sparse-like descriptors', () => {
    const extra = { ...valid(), extra: 'reject' };
    const symbol = { ...valid(), [Symbol('extra')]: 'reject' };
    const nonEnumerable = valid();
    Object.defineProperty(nonEnumerable, 'focusDirection', { value: 'increase', enumerable: false });
    const accessor = valid();
    Object.defineProperty(accessor, 'focusDirection', { get: () => 'increase', enumerable: true });
    const inherited = Object.create({ focusDirection: 'increase' });
    Object.defineProperty(inherited, 'varietyDirection', { value: 'decrease', enumerable: true });

    expect(isExactDirectionAnswer(valid())).toBe(true);
    for (const candidate of [extra, symbol, nonEnumerable, accessor, inherited]) {
      expect(isExactDirectionAnswer(candidate)).toBe(false);
    }
  });

  it('keeps malformed answers out of reducer state', () => {
    const answer = { ...valid(), extra: 'reject' } as PredictionAnswer;
    const state = choiceState();
    const reduced = experimentReducer(state, {
      type: 'SUBMIT_PREDICTION',
      answer,
      result: state.initialResult,
    });

    expect(reduced.stage).toBe('choice');
    expect(reduced.prediction).toBeNull();
    expect(reduced.changedResult).toBeNull();
  });
});
