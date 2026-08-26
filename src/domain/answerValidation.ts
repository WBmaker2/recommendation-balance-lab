import type { DirectionAnswer, PredictionAnswer } from './experimentState';

const ANSWER_KEYS = ['focusDirection', 'varietyDirection'] as const;

const isDirection = (value: unknown): value is DirectionAnswer => (
  value === 'increase' || value === 'same' || value === 'decrease'
);

const isEnumerableDataProperty = (value: object, key: PropertyKey): boolean => {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return Boolean(descriptor?.enumerable && 'value' in descriptor && !('get' in descriptor) && !('set' in descriptor));
};

/** Answers cross a reducer boundary only when their own shape is exact and data-only. */
export const isExactDirectionAnswer = (value: unknown): value is PredictionAnswer => {
  try {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const keys = Reflect.ownKeys(value);
    if (keys.length !== ANSWER_KEYS.length || !keys.every((key) => typeof key === 'string' && ANSWER_KEYS.includes(key as typeof ANSWER_KEYS[number]))) return false;
    if (!ANSWER_KEYS.every((key) => isEnumerableDataProperty(value, key))) return false;
    const answer = value as Record<(typeof ANSWER_KEYS)[number], unknown>;
    return isDirection(answer.focusDirection) && isDirection(answer.varietyDirection);
  } catch {
    return false;
  }
};

export const cloneDirectionAnswer = (value: PredictionAnswer): PredictionAnswer => ({
  focusDirection: value.focusDirection,
  varietyDirection: value.varietyDirection,
});
