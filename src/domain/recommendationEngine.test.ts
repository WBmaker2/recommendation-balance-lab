import { describe, expect, it } from 'vitest';
import { CARDS } from '../data/cards';
import { SUPPLY_PROFILES } from '../data/supplyProfiles';
import { TOPIC_ORDER } from '../data/topics';
import type { InterestRecord } from './types';
import {
  InsufficientSupplyError,
  SupplyProfileMismatchError,
  calculateTokenBreakdown,
  recommend,
  type RecommendationRequest,
} from './recommendationEngine';
import { allocateTopicCounts } from './apportionment';

const balanced = SUPPLY_PROFILES.find((supply) => supply.id === 'balanced');
const natureRich = SUPPLY_PROFILES.find((supply) => supply.id === 'nature-rich');
if (!balanced || !natureRich) throw new Error('Task 2 supply fixtures are required');

const interest = (science: number): InterestRecord => ({
  science,
  art: 0,
  sports: 0,
  nature: 0,
  history: 0,
});

const request = (overrides: Partial<RecommendationRequest> = {}): RecommendationRequest => ({
  interest: interest(0),
  diversityLevel: 0,
  memoryMode: 'keep',
  supplyProfileId: 'balanced',
  round: 0,
  feedSize: 8,
  ...overrides,
});

describe('결정론적 토큰 추천 엔진', () => {
  it('정확한 투명 토큰 항목을 계산한다', () => {
    const breakdown = calculateTokenBreakdown(
      request({ interest: interest(3), diversityLevel: 2 }),
      balanced,
    );

    expect(breakdown.science).toEqual({
      baseTokens: 1,
      interestTokens: 3,
      weightedInterestTokens: 6,
      diversityTokens: 2,
      totalTokens: 9,
    });
    expect(breakdown.art.totalTokens).toBe(3);
  });

  it('기억 비우기는 관심 토큰을 계산에서만 0으로 만든다', () => {
    const breakdown = calculateTokenBreakdown(
      request({ interest: interest(3), memoryMode: 'clear' }),
      balanced,
    );

    expect(breakdown.science.interestTokens).toBe(0);
    expect(breakdown.science.weightedInterestTokens).toBe(0);
    expect(breakdown.science.totalTokens).toBe(1);
  });

  it('largest remainder와 주제 순서로 지정된 분포를 만든다', () => {
    expect(recommend(request(), CARDS, balanced).topicCounts).toEqual({
      science: 2,
      art: 2,
      sports: 2,
      nature: 1,
      history: 1,
    });
    expect(
      recommend(request({ interest: interest(3), round: 1 }), CARDS, balanced).topicCounts,
    ).toEqual({ science: 5, art: 1, sports: 1, nature: 1, history: 0 });
    expect(
      recommend(request({ interest: interest(3), diversityLevel: 2, round: 1 }), CARDS, balanced)
        .topicCounts,
    ).toEqual({ science: 4, art: 1, sports: 1, nature: 1, history: 1 });
    expect(
      recommend(request({ interest: interest(3), memoryMode: 'clear' }), CARDS, balanced).topicCounts,
    ).toEqual({ science: 2, art: 2, sports: 2, nature: 1, history: 1 });
    expect(
      recommend(
        request({ interest: interest(3), supplyProfileId: 'nature-rich', round: 1 }),
        CARDS,
        natureRich,
      ).topicCounts,
    ).toEqual({ science: 4, art: 1, sports: 1, nature: 2, history: 0 });
  });

  it('재실행 결과와 fingerprint가 깊게 동일하다', () => {
    const first = recommend(request({ interest: interest(3), round: 1 }), CARDS, balanced);
    const second = recommend(request({ interest: interest(3), round: 1 }), CARDS, balanced);
    expect(second).toEqual(first);
    expect(first.inputFingerprint).toBe(
      JSON.stringify({
        interest: { science: 3, art: 0, sports: 0, nature: 0, history: 0 },
        diversityLevel: 0,
        memoryMode: 'keep',
        supplyProfileId: 'balanced',
        round: 1,
        feedSize: 8,
      }),
    );
  });

  it('각 카드에 완전한 설명을 만들고 고유 카드를 반환한다', () => {
    const result = recommend(request({ interest: interest(3), round: 1 }), CARDS, balanced);
    expect(result.cards).toHaveLength(8);
    expect(new Set(result.cards.map((card) => card.id)).size).toBe(8);
    expect(result.explanations).toHaveLength(8);
    expect(result.explanations.map((item) => item.cardId).sort()).toEqual(
      result.cards.map((card) => card.id).sort(),
    );
    for (const explanation of result.explanations) {
      expect(explanation).toMatchObject({
        interestMultiplier: 2,
        supplyProfileId: balanced.id,
        limitation: '가상의 단순 규칙이며 실제 서비스 추천을 판정하지 않습니다',
      });
      expect(explanation.deterministicPositionRule).toContain('round × 2');
      expect(explanation.allocatedTopicCards).toBe(result.topicCounts[explanation.topicId]);
    }
  });

  it('공급 프로필 불일치와 카드 용량 부족을 거부한다', () => {
    expect(() => recommend(request({ supplyProfileId: 'nature-rich' }), CARDS, balanced)).toThrow(
      SupplyProfileMismatchError,
    );
    expect(() =>
      allocateTopicCounts(
        calculateTokenBreakdown(request(), balanced),
        8,
        { science: 1, art: 1, sports: 1, nature: 1, history: 1 },
      ),
    ).toThrow(InsufficientSupplyError);
  });

  it('모든 주제의 동일 나머지는 TOPIC_ORDER로 배분한다', () => {
    const result = allocateTopicCounts(
      Object.fromEntries(
        TOPIC_ORDER.map((topicId) => [
          topicId,
          { baseTokens: 1, interestTokens: 0, weightedInterestTokens: 0, diversityTokens: 0, totalTokens: 1 },
        ]),
      ) as ReturnType<typeof calculateTokenBreakdown>,
      8,
      { science: 8, art: 8, sports: 8, nature: 8, history: 8 },
    );
    expect(result).toEqual({ science: 2, art: 2, sports: 2, nature: 1, history: 1 });
  });
});
