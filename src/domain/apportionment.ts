import { TOPIC_ORDER } from '../data/topics';
import type { TopicId, TopicCounts } from './types';
import type { TopicTokenBreakdown } from './recommendationEngine';

export class InsufficientSupplyError extends Error {
  constructor(message = '선택한 공급에서 요청한 카드 수를 만들 수 없습니다.') {
    super(message);
    this.name = 'InsufficientSupplyError';
  }
}

type TopicCapacity = Readonly<TopicCounts>;

const emptyCounts = (): TopicCounts => ({
  science: 0,
  art: 0,
  sports: 0,
  nature: 0,
  history: 0,
});

const isNonNegativeInteger = (value: number): boolean => Number.isInteger(value) && value >= 0;

/**
 * Allocates seats with a largest-remainder rule.  Fractional ties always use
 * TOPIC_ORDER, so the same normalized input produces the same topic counts.
 */
export const allocateTopicCounts = (
  tokens: TopicTokenBreakdown,
  feedSize: number,
  caps: TopicCapacity,
): TopicCounts => {
  if (!Number.isInteger(feedSize) || feedSize < 0) {
    throw new InsufficientSupplyError('피드 크기는 0 이상의 정수여야 합니다.');
  }

  for (const topicId of TOPIC_ORDER) {
    if (!isNonNegativeInteger(caps[topicId])) {
      throw new InsufficientSupplyError(`주제별 공급 용량이 올바르지 않습니다: ${topicId}.`);
    }
    if (!Number.isFinite(tokens[topicId].totalTokens) || tokens[topicId].totalTokens < 0) {
      throw new InsufficientSupplyError(`토큰 값이 올바르지 않습니다: ${topicId}.`);
    }
  }

  const capacity = TOPIC_ORDER.reduce((sum, topicId) => sum + caps[topicId], 0);
  if (capacity < feedSize) {
    throw new InsufficientSupplyError(`공급 용량 ${capacity}장으로 ${feedSize}장을 만들 수 없습니다.`);
  }
  if (feedSize === 0) return emptyCounts();

  const tokenSum = TOPIC_ORDER.reduce((sum, topicId) => sum + tokens[topicId].totalTokens, 0);
  const effectiveTokenSum = tokenSum > 0 ? tokenSum : TOPIC_ORDER.length;
  const weights = TOPIC_ORDER.map((topicId) =>
    tokenSum > 0 ? tokens[topicId].totalTokens : 1,
  );
  const counts = emptyCounts();
  const remainders = new Map<TopicId, number>();

  for (const [index, topicId] of TOPIC_ORDER.entries()) {
    const rawQuota = (weights[index] * feedSize) / effectiveTokenSum;
    const floorQuota = Math.floor(rawQuota);
    counts[topicId] = Math.min(floorQuota, caps[topicId]);
    remainders.set(topicId, rawQuota - floorQuota);
  }

  let allocated = TOPIC_ORDER.reduce((sum, topicId) => sum + counts[topicId], 0);
  while (allocated < feedSize) {
    const candidates = TOPIC_ORDER
      .filter((topicId) => counts[topicId] < caps[topicId])
      .sort((left, right) => {
        const remainderDifference = (remainders.get(right) ?? 0) - (remainders.get(left) ?? 0);
        return remainderDifference || TOPIC_ORDER.indexOf(left) - TOPIC_ORDER.indexOf(right);
      });
    if (candidates.length === 0) {
      throw new InsufficientSupplyError(`용량을 고려해 ${feedSize}장을 배분할 수 없습니다.`);
    }

    // Give at most one extra seat to each topic in a pass. This preserves
    // largest-remainder order while preventing one topic from consuming all
    // remaining seats when several topics have the same remainder.
    let assignedInPass = 0;
    for (const candidate of candidates) {
      if (allocated >= feedSize) break;
      counts[candidate] += 1;
      allocated += 1;
      assignedInPass += 1;
    }
    if (assignedInPass === 0) {
      throw new InsufficientSupplyError(`용량을 고려해 ${feedSize}장을 배분할 수 없습니다.`);
    }
  }

  return counts;
};
