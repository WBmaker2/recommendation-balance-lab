import { describe, expect, it } from 'vitest';
import { CARDS } from '../data/cards';
import { SUPPLY_PROFILES } from '../data/supplyProfiles';
import { recommend, type RecommendationResult } from './recommendationEngine';
import type { ContentCard, TopicCounts } from './types';
import {
  InvalidDistributionError,
  buildDistributionSummary,
  compareDistributions,
  countTopicCards,
  isDistributionAnswerCorrect,
} from './distribution';

const balanced = SUPPLY_PROFILES.find((profile) => profile.id === 'balanced')!;
const zeroInterest = { science: 0, art: 0, sports: 0, nature: 0, history: 0 } as const;
const initialResult = recommend({
  interest: zeroInterest,
  diversityLevel: 0,
  memoryMode: 'keep',
  supplyProfileId: 'balanced',
  round: 0,
  feedSize: 8,
}, CARDS, balanced);
const scienceHeavyResult = recommend({
  interest: { ...zeroInterest, science: 3 },
  diversityLevel: 0,
  memoryMode: 'keep',
  supplyProfileId: 'balanced',
  round: 1,
  feedSize: 8,
}, CARDS, balanced);

describe('분포 비교 도메인', () => {
  it('모든 주제의 정확한 정수 차이와 나타난 주제 수를 계산한다', () => {
    expect(compareDistributions(
      { science: 2, art: 2, sports: 2, nature: 1, history: 1 },
      { science: 5, art: 1, sports: 1, nature: 1, history: 0 },
    )).toEqual({
      before: { science: 2, art: 2, sports: 2, nature: 1, history: 1 },
      after: { science: 5, art: 1, sports: 1, nature: 1, history: 0 },
      delta: { science: 3, art: -1, sports: -1, nature: 0, history: -1 },
      beforeVariety: 5,
      afterVariety: 4,
      missingTopics: ['history'],
    });
  });

  it('음수, 소수, 누락, 합계가 8이 아닌 입력을 안정적으로 거부한다', () => {
    const invalidInputs: TopicCounts[] = [
      { science: -1, art: 2, sports: 2, nature: 1, history: 4 },
      { science: 1.5, art: 2, sports: 2, nature: 1, history: 2 },
      { science: 2, art: 2, sports: 2, nature: 1, history: 2 },
    ];
    for (const input of invalidInputs) {
      expect(() => compareDistributions(input, { science: 2, art: 2, sports: 2, nature: 1, history: 1 }))
        .toThrowError(InvalidDistributionError);
    }
    expect(() => compareDistributions(
      { science: 2, art: 2, sports: 2, nature: 1 } as TopicCounts,
      { science: 2, art: 2, sports: 2, nature: 1, history: 2 },
    )).toThrow('분포 자료가 올바르지 않습니다.');
    expect(() => compareDistributions(
      { science: 2, art: 2, sports: 2, nature: 1, history: 1, unknown: 0 } as unknown as TopicCounts,
      { science: 2, art: 2, sports: 2, nature: 1, history: 1 },
    )).toThrowError(InvalidDistributionError);
  });

  it('실제 여덟 장 카드에서 주제 수를 계산하고 중복·미지 카드·잘못된 길이를 거부한다', () => {
    expect(countTopicCards(initialResult.cards)).toEqual(initialResult.topicCounts);
    expect(() => countTopicCards([...initialResult.cards, initialResult.cards[0]])).toThrowError(InvalidDistributionError);
    expect(() => countTopicCards(initialResult.cards.slice(0, 7))).toThrowError(InvalidDistributionError);
    const unknownCard = { ...initialResult.cards[0], id: 'unknown-1' } as unknown as ContentCard;
    expect(() => countTopicCards(initialResult.cards.map((card, index) => index === 0 ? unknownCard : card)))
      .toThrowError(InvalidDistributionError);
    const wrongTopic = { ...initialResult.cards[0], topicId: 'art' } as unknown as ContentCard;
    expect(() => countTopicCards(initialResult.cards.map((card, index) => index === 0 ? wrongTopic : card)))
      .toThrowError(InvalidDistributionError);
    expect(() => countTopicCards([null, ...initialResult.cards.slice(1)] as unknown as ContentCard[]))
      .toThrow('분포 자료가 올바르지 않습니다.');
    expect(() => countTopicCards([undefined, ...initialResult.cards.slice(1)] as unknown as ContentCard[]))
      .toThrow('분포 자료가 올바르지 않습니다.');
  });

  it('포커스와 나타난 주제의 모든 방향을 사실 문장으로 만든다', () => {
    const delta = compareDistributions(initialResult.topicCounts, scienceHeavyResult.topicCounts);
    expect(buildDistributionSummary(delta, 'science')).toBe('과학 카드는 3장 늘고, 나타난 주제는 5개에서 4개로 줄었습니다.');
    expect(isDistributionAnswerCorrect({ focusDirection: 'increase', varietyDirection: 'decrease' }, delta, 'science')).toBe(true);
    expect(isDistributionAnswerCorrect({ focusDirection: 'same', varietyDirection: 'decrease' }, delta, 'science')).toBe(false);
    expect(isDistributionAnswerCorrect({ focusDirection: 'increase', varietyDirection: 'best' as never }, delta, 'science')).toBe(false);

    expect(buildDistributionSummary(compareDistributions(
      { science: 2, art: 2, sports: 2, nature: 1, history: 1 },
      { science: 1, art: 3, sports: 1, nature: 2, history: 1 },
    ), 'science')).toBe('과학 카드는 1장 줄고, 나타난 주제는 5개로 같습니다.');
    expect(buildDistributionSummary(compareDistributions(
      { science: 2, art: 2, sports: 2, nature: 1, history: 1 },
      { science: 2, art: 2, sports: 2, nature: 2, history: 0 },
    ), 'science')).toBe('과학 카드는 그대로이고, 나타난 주제는 5개에서 4개로 줄었습니다.');
    expect(buildDistributionSummary(compareDistributions(
      { science: 1, art: 1, sports: 2, nature: 2, history: 2 },
      { science: 2, art: 2, sports: 2, nature: 1, history: 1 },
    ), 'science')).toBe('과학 카드는 1장 늘고, 나타난 주제는 5개로 같습니다.');
    expect(buildDistributionSummary(compareDistributions(
      { science: 1, art: 1, sports: 1, nature: 1, history: 4 },
      { science: 2, art: 2, sports: 2, nature: 1, history: 1 },
    ), 'science')).toBe('과학 카드는 1장 늘고, 나타난 주제는 5개로 같습니다.');
    expect(buildDistributionSummary(compareDistributions(
      { science: 1, art: 1, sports: 1, nature: 1, history: 4 },
      { science: 2, art: 2, sports: 2, nature: 2, history: 0 },
    ), 'science')).toBe('과학 카드는 1장 늘고, 나타난 주제는 5개에서 4개로 줄었습니다.');
    expect(buildDistributionSummary(compareDistributions(
      { science: 3, art: 2, sports: 2, nature: 1, history: 0 },
      { science: 3, art: 2, sports: 1, nature: 1, history: 1 },
    ), 'science')).toBe('과학 카드는 그대로이고, 나타난 주제는 4개에서 5개로 늘었습니다.');
  });
});

const inconsistent = (result: RecommendationResult): RecommendationResult => ({
  ...result,
  topicCounts: { science: 8, art: 0, sports: 0, nature: 0, history: 0 },
});

export { inconsistent };
