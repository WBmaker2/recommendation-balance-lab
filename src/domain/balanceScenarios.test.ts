import { describe, expect, it } from 'vitest';
import { CARDS } from '../data/cards';
import { SUPPLY_PROFILES } from '../data/supplyProfiles';
import type { RecommendationRequest, RecommendationResult } from './recommendationEngine';
import {
  canCompareBalance,
  createBalancePreview,
  InvalidBalanceSnapshotError,
  saveBalanceSnapshot,
  type BalanceConfig,
} from './balanceScenarios';
import { isValidRecommendationResult } from './recommendationResult';

const balanced = SUPPLY_PROFILES.find((profile) => profile.id === 'balanced')!;
export const scienceThreePlusHistoryRequest: RecommendationRequest = {
  interest: { science: 3, art: 0, sports: 0, nature: 0, history: 1 },
  diversityLevel: 0,
  memoryMode: 'keep',
  supplyProfileId: 'balanced',
  round: 2,
  feedSize: 8,
};

describe('balance scenario previews', () => {
  it('keeps eight cards and exposes all six deterministic configurations', () => {
    const configs: BalanceConfig[] = [
      { diversityLevel: 0, memoryMode: 'keep' },
      { diversityLevel: 0, memoryMode: 'clear' },
      { diversityLevel: 1, memoryMode: 'keep' },
      { diversityLevel: 1, memoryMode: 'clear' },
      { diversityLevel: 2, memoryMode: 'keep' },
      { diversityLevel: 2, memoryMode: 'clear' },
    ];
    const results = configs.map((config) => createBalancePreview(
      scienceThreePlusHistoryRequest,
      config,
      CARDS,
      balanced,
    ));
    expect(results).toHaveLength(6);
    expect(results.every((result) => result.cards.length === 8)).toBe(true);
    expect(results).toEqual(configs.map((config) => createBalancePreview(
      scienceThreePlusHistoryRequest,
      config,
      CARDS,
      balanced,
    )));
  });

  it('uses the exact scenario evidence for focus, diversity, and clear memory', () => {
    expect(createBalancePreview(
      scienceThreePlusHistoryRequest,
      { diversityLevel: 0, memoryMode: 'keep' },
      CARDS,
      balanced,
    ).cards).toHaveLength(8);
    expect(createBalancePreview(
      scienceThreePlusHistoryRequest,
      { diversityLevel: 2, memoryMode: 'keep' },
      CARDS,
      balanced,
    ).topicCounts.history).toBeGreaterThanOrEqual(1);
    expect(createBalancePreview(
      scienceThreePlusHistoryRequest,
      { diversityLevel: 1, memoryMode: 'clear' },
      CARDS,
      balanced,
    ).topicCounts).toEqual({ science: 2, art: 2, sports: 2, nature: 1, history: 1 });
  });

  it('rejects duplicate configurations and the fourth snapshot', () => {
    const config = { diversityLevel: 0, memoryMode: 'keep' } as const;
    const result = createBalancePreview(scienceThreePlusHistoryRequest, config, CARDS, balanced);
    const first = saveBalanceSnapshot([], config, result);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const duplicate = saveBalanceSnapshot(first.snapshots, config, result);
    expect(duplicate).toEqual({ ok: false, reason: 'duplicate-config' });
    const snapshots = [0, 1, 2].map((level, index) => ({
      id: (`scenario-${String.fromCharCode(97 + index)}`) as 'scenario-a' | 'scenario-b' | 'scenario-c',
      config: { diversityLevel: level as 0 | 1 | 2, memoryMode: 'keep' as const },
      result: createBalancePreview(scienceThreePlusHistoryRequest, {
        diversityLevel: level as 0 | 1 | 2,
        memoryMode: 'keep',
      }, CARDS, balanced),
    }));
    const fourthResult = createBalancePreview(scienceThreePlusHistoryRequest, { diversityLevel: 2, memoryMode: 'clear' }, CARDS, balanced);
    expect(saveBalanceSnapshot(snapshots, { diversityLevel: 2, memoryMode: 'clear' }, fourthResult)).toEqual({
      ok: false,
      reason: 'three-snapshot-limit',
    });
  });

  it('does not share result references with input or saved snapshots', () => {
    const config = { diversityLevel: 1, memoryMode: 'clear' } as const;
    const result = createBalancePreview(scienceThreePlusHistoryRequest, config, CARDS, balanced);
    const saved = saveBalanceSnapshot([], config, result);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    (result.cards as unknown as Array<{ title: string }>)[0].title = '외부 변조';
    expect(saved.snapshots[0].result.cards[0].title).not.toBe('외부 변조');
    expect(saved.snapshots).not.toBe(result);
  });

  it('rejects runtime-invalid configuration and result shapes with named errors', () => {
    expect(() => createBalancePreview(
      scienceThreePlusHistoryRequest,
      { diversityLevel: 3 as 0, memoryMode: 'keep' },
      CARDS,
      balanced,
    )).toThrowError(expect.objectContaining({ name: 'InvalidBalanceConfigError', message: '균형 설정이 올바르지 않습니다.' }));
    expect(() => saveBalanceSnapshot([], { diversityLevel: 0, memoryMode: 'keep' }, {} as never)).toThrowError(
      expect.objectContaining({ name: 'InvalidBalanceSnapshotError', message: '저장할 균형 결과가 올바르지 않습니다.' }),
    );
  });

  it('requires a canonical complete result for compare and save', () => {
    const config = { diversityLevel: 0, memoryMode: 'keep' } as const;
    const valid = createBalancePreview(scienceThreePlusHistoryRequest, config, CARDS, balanced);
    const malformed: RecommendationResult[] = [
      { ...valid, request: { ...valid.request, interest: { ...valid.request.interest, science: -1 } } },
      { ...valid, request: { ...valid.request, supplyProfileId: 'nature-rich' } },
      { ...valid, request: { ...valid.request, round: -1 } },
      { ...valid, request: { ...valid.request, feedSize: 7 as never } },
      { ...valid, cards: [] },
      { ...valid, cards: [...valid.cards, valid.cards[0]] },
      { ...valid, cards: valid.cards.map((card, index) => index === 0 ? { ...card, title: '변조 카드' } : card) },
      { ...valid, topicCounts: { ...valid.topicCounts, science: 8 } },
      { ...valid, tokenBreakdown: { ...valid.tokenBreakdown, science: undefined! } },
      { ...valid, explanations: valid.explanations.slice(0, 7) },
      { ...valid, explanations: valid.explanations.map((item, index) => index === 0 ? { ...item, totalTokens: 999 } : item) },
      { ...valid, inputFingerprint: 'tampered' },
    ];
    for (const result of malformed) {
      expect(isValidRecommendationResult(result)).toBe(false);
      expect(() => saveBalanceSnapshot([], config, result)).toThrowError(
        expect.objectContaining({ name: 'InvalidBalanceSnapshotError' }),
      );
    }
  });

  it('accepts semantically exact results with different object key insertion order', () => {
    const config = { diversityLevel: 0, memoryMode: 'keep' } as const;
    const valid = createBalancePreview(scienceThreePlusHistoryRequest, config, CARDS, balanced);
    const reordered = JSON.parse(JSON.stringify(valid), (_key, value) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
      return Object.fromEntries(Object.entries(value).reverse());
    }) as RecommendationResult;
    expect(isValidRecommendationResult(reordered)).toBe(true);
    expect(saveBalanceSnapshot([], config, reordered).ok).toBe(true);
  });

  it('rejects malformed comparison arrays and non-prefix existing snapshots', () => {
    const configs = [
      { diversityLevel: 0, memoryMode: 'keep' },
      { diversityLevel: 1, memoryMode: 'keep' },
      { diversityLevel: 2, memoryMode: 'keep' },
    ] as const;
    let snapshots = [] as readonly import('./balanceScenarios').BalanceSnapshot[];
    for (const config of configs) {
      const saved = saveBalanceSnapshot(snapshots, config, createBalancePreview(scienceThreePlusHistoryRequest, config, CARDS, balanced));
      if (saved.ok) snapshots = saved.snapshots;
    }
    expect(canCompareBalance(snapshots)).toBe(true);
    const malformedComparison = { ...snapshots[0], result: { ...snapshots[0].result, cards: [] } };
    expect(canCompareBalance([malformedComparison, snapshots[1], snapshots[2]])).toBe(false);
    const valid = createBalancePreview(scienceThreePlusHistoryRequest, configs[0], CARDS, balanced);
    const b = { ...snapshots[1], id: 'scenario-b' as const };
    expect(() => saveBalanceSnapshot([b, snapshots[0]], configs[2], createBalancePreview(scienceThreePlusHistoryRequest, configs[2], CARDS, balanced))).toThrowError(InvalidBalanceSnapshotError);
    expect(() => saveBalanceSnapshot([{ ...snapshots[0], id: 'scenario-a' as const }, { ...snapshots[0], id: 'scenario-a' as const, config: configs[1], result: createBalancePreview(scienceThreePlusHistoryRequest, configs[1], CARDS, balanced) }], configs[2], createBalancePreview(scienceThreePlusHistoryRequest, configs[2], CARDS, balanced))).toThrowError(InvalidBalanceSnapshotError);
    expect(() => saveBalanceSnapshot([{ ...snapshots[0], result: { ...snapshots[0].result, cards: [] } }], configs[1], valid)).toThrowError(InvalidBalanceSnapshotError);
    expect(canCompareBalance([{ ...snapshots[0], result: {} as never }, snapshots[1], snapshots[2]])).toBe(false);
  });

  it('rejects sparse/reordered/extra-key result arrays and exact-shape violations', () => {
    const config = { diversityLevel: 0, memoryMode: 'keep' } as const;
    const valid = createBalancePreview(scienceThreePlusHistoryRequest, config, CARDS, balanced);
    const sparseCards = [...valid.cards] as Array<typeof valid.cards[number]>;
    delete sparseCards[0];
    const sparseExplanations = [...valid.explanations] as Array<typeof valid.explanations[number]>;
    delete sparseExplanations[0];
    const extraCards = [...valid.cards] as Array<typeof valid.cards[number]> & { extra?: string };
    extraCards.extra = 'unexpected';
    const reorderedCards = [...valid.cards].reverse();
    const malformed = [
      { ...valid, cards: sparseCards },
      { ...valid, explanations: sparseExplanations },
      { ...valid, cards: extraCards },
      { ...valid, cards: reorderedCards },
      { ...valid, extra: true },
      (() => {
        const missing = { ...valid } as Record<string, unknown>;
        delete missing.inputFingerprint;
        return missing;
      })(),
    ];
    for (const result of malformed) {
      expect(isValidRecommendationResult(result)).toBe(false);
      expect(() => saveBalanceSnapshot([], config, result as never)).toThrowError(
        expect.objectContaining({ name: 'InvalidBalanceSnapshotError' }),
      );
    }
  });

  it('rejects sparse existing arrays and malformed snapshot/config shapes', () => {
    const configs = [
      { diversityLevel: 0, memoryMode: 'keep' },
      { diversityLevel: 1, memoryMode: 'keep' },
      { diversityLevel: 2, memoryMode: 'keep' },
    ] as const;
    let snapshots = [] as readonly import('./balanceScenarios').BalanceSnapshot[];
    for (const config of configs) {
      const saved = saveBalanceSnapshot(snapshots, config, createBalancePreview(scienceThreePlusHistoryRequest, config, CARDS, balanced));
      if (saved.ok) snapshots = saved.snapshots;
    }
    const sparseThree = [...snapshots] as Array<typeof snapshots[number]>;
    delete sparseThree[1];
    const sparseTwo = new Array<typeof snapshots[number]>(2);
    sparseTwo[0] = snapshots[0];
    expect(canCompareBalance(sparseThree)).toBe(false);
    expect(() => saveBalanceSnapshot(sparseTwo, configs[0], createBalancePreview(scienceThreePlusHistoryRequest, configs[0], CARDS, balanced))).toThrowError(InvalidBalanceSnapshotError);
    expect(() => saveBalanceSnapshot([{ ...snapshots[0], extra: true } as never], configs[1], createBalancePreview(scienceThreePlusHistoryRequest, configs[1], CARDS, balanced))).toThrowError(InvalidBalanceSnapshotError);
    expect(() => saveBalanceSnapshot([{ id: 'scenario-a', config: configs[0] } as never], configs[1], createBalancePreview(scienceThreePlusHistoryRequest, configs[1], CARDS, balanced))).toThrowError(InvalidBalanceSnapshotError);
    expect(() => saveBalanceSnapshot([{ ...snapshots[0], config: { ...configs[0], extra: true } } as never], configs[1], createBalancePreview(scienceThreePlusHistoryRequest, configs[1], CARDS, balanced))).toThrowError(InvalidBalanceSnapshotError);
  });

  it('returns duplicate-config before limit for a valid full A/B/C array', () => {
    const configs = [
      { diversityLevel: 0, memoryMode: 'keep' },
      { diversityLevel: 1, memoryMode: 'keep' },
      { diversityLevel: 2, memoryMode: 'keep' },
    ] as const;
    let snapshots = [] as readonly import('./balanceScenarios').BalanceSnapshot[];
    for (const config of configs) {
      const saved = saveBalanceSnapshot(snapshots, config, createBalancePreview(scienceThreePlusHistoryRequest, config, CARDS, balanced));
      if (saved.ok) snapshots = saved.snapshots;
    }
    const duplicate = saveBalanceSnapshot(snapshots, configs[0], createBalancePreview(scienceThreePlusHistoryRequest, configs[0], CARDS, balanced));
    expect(duplicate).toEqual({ ok: false, reason: 'duplicate-config' });
  });
});
