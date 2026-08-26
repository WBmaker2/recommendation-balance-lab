import { describe, expect, it } from 'vitest';
import { CARDS } from '../data/cards';
import { SUPPLY_PROFILES } from '../data/supplyProfiles';
import { TOPIC_ORDER } from '../data/topics';
import { recommend, type RecommendationRequest } from './recommendationEngine';
import { auditPairsEqual, buildAuditPair, validateAuditPair } from './auditComparison';
import { cloneRecommendationResult } from './recommendationResult';
import type { ContentCard, SupplyProfile } from './types';

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

  it('keeps global data and input graphs unchanged while owning every built result', () => {
    const cardsBefore = structuredClone(CARDS);
    const suppliesBefore = structuredClone(SUPPLY_PROFILES);
    const pair = buildAuditPair(requestFor('science'), CARDS, SUPPLY_PROFILES);
    expect(CARDS).toEqual(cardsBefore);
    expect(SUPPLY_PROFILES).toEqual(suppliesBefore);
    expect(pair.balanced.cards).not.toBe(CARDS);
    expect(pair.balanced.cards[0]).not.toBe(CARDS.find((card) => card.id === pair.balanced.cards[0].id));
    expect(pair.natureRich.cards[0]).not.toBe(CARDS.find((card) => card.id === pair.natureRich.cards[0].id));
    expect(Object.isFrozen(pair)).toBe(true);
    expect(Object.isFrozen(pair.balanced.request)).toBe(true);
  });

  it('isolates source input mutations and output mutations from another pair', () => {
    const sourceCards = structuredClone(CARDS) as ContentCard[];
    const sourceSupplies = structuredClone(SUPPLY_PROFILES) as SupplyProfile[];
    const first = buildAuditPair(requestFor('science'), sourceCards, sourceSupplies);
    sourceCards[0].title = '입력 변조';
    sourceSupplies[0].baseTokens.science = 99;
    sourceSupplies.push(sourceSupplies[0]);
    const pristine = buildAuditPair(requestFor('science'), CARDS, SUPPLY_PROFILES);
    expect(first.balanced.cards[0].title).not.toBe('입력 변조');
    expect(first.balanced.tokenBreakdown.science.baseTokens).toBe(1);
    expect(first).not.toBe(pristine);
    expect(auditPairsEqual(first, pristine)).toBe(true);
    const outputCards = first.balanced.cards as ContentCard[];
    expect(() => { outputCards[0].title = '출력 변조'; }).toThrow();
    expect(pristine.balanced.cards[0].title).not.toBe('출력 변조');
  });

  it('returns each declared issue once in order and excludes unknown same-supply values', () => {
    const pair = buildAuditPair(requestFor('science'), CARDS, SUPPLY_PROFILES);
    const allIssues = {
      ...pair,
      invariantInterest: { ...pair.invariantInterest, science: 99 },
      invariantDiversityLevel: 2 as const,
      invariantMemoryMode: 'clear' as const,
      balanced: { ...pair.balanced, request: { ...pair.balanced.request, round: 9 } },
      natureRich: { ...pair.natureRich, request: { ...pair.natureRich.request, round: 1, supplyProfileId: 'balanced' as const } },
    };
    const issues = validateAuditPair(allIssues).map((issue) => issue.code);
    expect(issues).toEqual([
      'interest-mismatch', 'diversity-mismatch', 'memory-mismatch', 'round-mismatch', 'same-supply', 'invalid-feed-size',
    ]);
    for (const code of issues) expect(issues.filter((item) => item === code)).toHaveLength(1);
    expect(validateAuditPair({} as never).map((issue) => issue.code)).not.toContain('same-supply');
    const noChange = { ...pair, natureRich: cloneRecommendationResult(pair.balanced) };
    expect(validateAuditPair(noChange).map((issue) => issue.code)).toEqual(['same-supply', 'no-result-change']);
  });

  it('requires issue-free pairs before equality, including self-equality', () => {
    const pair = buildAuditPair(requestFor('science'), CARDS, SUPPLY_PROFILES);
    const interestMismatch = { ...pair, invariantInterest: { ...pair.invariantInterest, science: 99 } };
    const diversityMismatch = { ...pair, invariantDiversityLevel: 2 as const };
    const memoryMismatch = { ...pair, invariantMemoryMode: 'clear' as const };
    const sameResult = { ...pair, natureRich: cloneRecommendationResult(pair.balanced) };
    const balancedSupply = SUPPLY_PROFILES.find((supply) => supply.id === 'balanced')!;
    const roundMismatch = {
      ...pair,
      balanced: cloneRecommendationResult(recommend({ ...requestFor('science'), round: 2 }, CARDS, balancedSupply)),
    };
    const invalidPairs = [interestMismatch, diversityMismatch, memoryMismatch, sameResult, roundMismatch];
    for (const invalid of invalidPairs) {
      expect(validateAuditPair(invalid).length).toBeGreaterThan(0);
      expect(auditPairsEqual(invalid, invalid)).toBe(false);
    }
    const equal = buildAuditPair(requestFor('science'), CARDS, SUPPLY_PROFILES);
    expect(validateAuditPair(equal)).toEqual([]);
    expect(auditPairsEqual(pair, equal)).toBe(true);
  });

  it('does not freeze global cards or supply graphs and rejects a global card alias', () => {
    const cardsBefore = structuredClone(CARDS);
    const suppliesBefore = structuredClone(SUPPLY_PROFILES);
    const globalObjects: object[] = [CARDS, ...CARDS, SUPPLY_PROFILES, ...SUPPLY_PROFILES];
    for (const supply of SUPPLY_PROFILES) globalObjects.push(supply.baseTokens, supply.candidateCardIds);
    expect(globalObjects.every((object) => !Object.isFrozen(object))).toBe(true);
    const pair = buildAuditPair(requestFor('science'), CARDS, SUPPLY_PROFILES);
    expect(pair.balanced.cards.every((card) => card !== CARDS.find((global) => global.id === card.id))).toBe(true);
    expect(pair.natureRich.cards.every((card) => card !== CARDS.find((global) => global.id === card.id))).toBe(true);
    expect(globalObjects.every((object) => !Object.isFrozen(object))).toBe(true);
    expect(CARDS).toEqual(cardsBefore);
    expect(SUPPLY_PROFILES).toEqual(suppliesBefore);
    const globalCard = CARDS.find((card) => card.id === pair.balanced.cards[0].id)!;
    const cardsWithAlias = [...pair.balanced.cards];
    cardsWithAlias[0] = globalCard;
    const tampered = { ...pair, balanced: { ...pair.balanced, cards: cardsWithAlias } };
    expect(validateAuditPair(tampered)).toContainEqual({ code: 'invalid-feed-size' });
    expect(auditPairsEqual(tampered, tampered)).toBe(false);
  });
});
