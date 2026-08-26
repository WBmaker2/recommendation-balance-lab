import { describe, expect, it } from 'vitest';
import { CARDS } from '../data/cards';
import { SUPPLY_PROFILES } from '../data/supplyProfiles';
import { TOPIC_ORDER } from '../data/topics';
import type { RecommendationRequest } from './recommendationEngine';
import { auditPairsEqual, buildAuditPair, validateAuditPair } from './auditComparison';

const requestFor = (topicId: (typeof TOPIC_ORDER)[number]): RecommendationRequest => ({
  interest: Object.fromEntries(TOPIC_ORDER.map((id) => [id, id === topicId ? 3 : 0])) as RecommendationRequest['interest'],
  diversityLevel: 0,
  memoryMode: 'keep',
  supplyProfileId: 'balanced',
  round: 1,
  feedSize: 8,
});

describe('controlled supply audit comparison', () => {
  it('changes supply only and produces the contract science counts', () => {
    const pair = buildAuditPair(requestFor('science'), CARDS, SUPPLY_PROFILES);
    expect(pair.balanced.topicCounts).toEqual({ science: 5, art: 1, sports: 1, nature: 1, history: 0 });
    expect(pair.natureRich.topicCounts).toEqual({ science: 4, art: 1, sports: 1, nature: 2, history: 0 });
    expect(pair.changedField).toBe('supplyProfileId');
    expect(validateAuditPair(pair)).toEqual([]);
    expect(pair.balanced.request.interest).toEqual(pair.invariantInterest);
    expect(pair.balanced.request.diversityLevel).toBe(pair.invariantDiversityLevel);
    expect(pair.balanced.request.memoryMode).toBe(pair.invariantMemoryMode);
    expect(pair.balanced.request.round).toBe(1);
    expect(pair.natureRich.request.round).toBe(1);
  });

  it('changes actual card counts for every possible focus topic', () => {
    for (const topicId of TOPIC_ORDER) {
      const pair = buildAuditPair(requestFor(topicId), CARDS, SUPPLY_PROFILES);
      expect(pair.balanced.cards.map((card) => card.topicId)).not.toEqual(pair.natureRich.cards.map((card) => card.topicId));
      expect(validateAuditPair(pair)).toEqual([]);
    }
  });

  it('does not trust stored topicCounts for result-change validation', () => {
    const pair = buildAuditPair(requestFor('science'), CARDS, SUPPLY_PROFILES);
    const tampered = {
      ...pair,
      balanced: {
        ...pair.balanced,
        topicCounts: { science: 0, art: 0, sports: 0, nature: 0, history: 8 },
      },
    };
    expect(validateAuditPair(tampered)).toContainEqual({ code: 'invalid-feed-size' });
  });

  it('compares complete evidence and accepts reversed profile input order', () => {
    const pair = buildAuditPair(requestFor('art'), CARDS, [...SUPPLY_PROFILES].reverse());
    const same = buildAuditPair(requestFor('art'), CARDS, SUPPLY_PROFILES);
    expect(auditPairsEqual(pair, same)).toBe(true);
    const isDevelopment = Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV);
    expect(Object.isFrozen(pair)).toBe(isDevelopment);
  });

  it('throws the named input error and validates malformed runtime pairs safely', () => {
    expect(() => buildAuditPair({} as RecommendationRequest, CARDS, SUPPLY_PROFILES)).toThrowError(
      expect.objectContaining({ name: 'InvalidAuditPairError', message: '감사 비교 입력이 올바르지 않습니다.' }),
    );
    expect(() => buildAuditPair(requestFor('science'), CARDS, [])).toThrowError('감사 비교 입력이 올바르지 않습니다.');
    expect(validateAuditPair(null as unknown as never)).toContainEqual({ code: 'invalid-feed-size' });
  });

  it('rejects shared nested evidence references and accepts only owned canonical evidence', () => {
    const pair = buildAuditPair(requestFor('science'), CARDS, SUPPLY_PROFILES);
    const sharedInterest = pair.invariantInterest;
    const sharedCards = pair.balanced.cards;
    const aliasedInterest = {
      ...pair,
      balanced: {
        ...pair.balanced,
        request: { ...pair.balanced.request, interest: sharedInterest },
      },
    };
    const aliasedResultEvidence = {
      ...pair,
      natureRich: {
        ...pair.natureRich,
        request: { ...pair.natureRich.request, interest: pair.balanced.request.interest },
        cards: sharedCards,
        topicCounts: pair.balanced.topicCounts,
        tokenBreakdown: pair.balanced.tokenBreakdown,
        explanations: pair.balanced.explanations,
      },
    };
    expect(validateAuditPair(aliasedInterest)).toContainEqual({ code: 'invalid-feed-size' });
    expect(validateAuditPair(aliasedResultEvidence)).toContainEqual({ code: 'invalid-feed-size' });
    expect(auditPairsEqual(aliasedInterest, pair)).toBe(false);
    expect(auditPairsEqual(aliasedResultEvidence, pair)).toBe(false);
    expect(validateAuditPair(pair)).toEqual([]);
  });

  it('rejects extra, symbol, non-enumerable, sparse, and wrong changedField keys', () => {
    const pair = buildAuditPair(requestFor('science'), CARDS, SUPPLY_PROFILES);
    const extra = { ...pair, hidden: true } as unknown as typeof pair;
    const symbolKey = Symbol('hidden');
    Object.defineProperty(extra, symbolKey, { value: true, enumerable: false });
    const nonEnumerable = { ...pair } as typeof pair & { hidden?: boolean };
    Object.defineProperty(nonEnumerable, 'hidden', { value: true, enumerable: false });
    const wrongField = { ...pair, changedField: 'interest' } as unknown as typeof pair;
    expect(validateAuditPair(extra)).toEqual([{ code: 'invalid-feed-size' }]);
    expect(validateAuditPair(nonEnumerable)).toEqual([{ code: 'invalid-feed-size' }]);
    expect(validateAuditPair(wrongField)).toEqual([{ code: 'invalid-feed-size' }]);
    expect(auditPairsEqual(extra, pair)).toBe(false);
    expect(auditPairsEqual(nonEnumerable, pair)).toBe(false);
    expect(auditPairsEqual(wrongField, pair)).toBe(false);
  });
});
