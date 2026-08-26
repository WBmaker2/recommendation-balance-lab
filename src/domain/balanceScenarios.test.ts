import { describe, expect, it } from 'vitest';
import { CARDS } from '../data/cards';
import { SUPPLY_PROFILES } from '../data/supplyProfiles';
import type { RecommendationRequest } from './recommendationEngine';
import {
  createBalancePreview,
  saveBalanceSnapshot,
  type BalanceConfig,
} from './balanceScenarios';

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
});
