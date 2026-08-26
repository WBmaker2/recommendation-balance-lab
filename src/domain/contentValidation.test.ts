import { describe, expect, it } from 'vitest';
import { CARDS } from '../data/cards';
import { CURRICULUM_LINKS } from '../data/learningCopy';
import { MISSIONS } from '../data/missions';
import { SUPPLY_PROFILES } from '../data/supplyProfiles';
import { TOPIC_ORDER, TOPICS } from '../data/topics';
import { validateContent } from './contentValidation';

describe('추천 알고리즘 균형 실험실 콘텐츠 계약', () => {
  it('승인된 주제 순서와 카드 수를 지킨다', () => {
    expect(TOPIC_ORDER).toEqual(['science', 'art', 'sports', 'nature', 'history']);
    expect(CARDS).toHaveLength(40);
    expect(new Set(CARDS.map((card) => card.id)).size).toBe(40);

    for (const topicId of TOPIC_ORDER) {
      expect(CARDS.filter((card) => card.topicId === topicId)).toHaveLength(8);
    }
  });

  it('미션, 교육과정 연결, 전체 콘텐츠가 계약을 지킨다', () => {
    expect(MISSIONS.map((mission) => mission.id)).toEqual([
      'selection-trace',
      'narrowed-window',
      'exploration',
      'balance-adjustment',
      'model-audit',
    ]);
    expect(MISSIONS.map((mission) => mission.completionRule)).toEqual([
      'three-same-topic-selections',
      'correct-distribution-reading',
      'one-non-focus-exploration',
      'three-distinct-snapshots',
      'supply-factor-identified',
    ]);
    expect(CURRICULUM_LINKS.map((item) => item.code)).toEqual([
      '6실05-05',
      '6실05-04',
      'digital-citizenship',
    ]);
    expect(validateContent(TOPICS, CARDS, SUPPLY_PROFILES, MISSIONS)).toEqual([]);
  });

  it('잘못된 후보 카드와 표시 정보를 보고한다', () => {
    const issues = validateContent(
      TOPICS.map((topic) => (topic.id === 'science' ? { ...topic, icon: '' } : topic)),
      CARDS,
      SUPPLY_PROFILES.map((supply) =>
        supply.id === 'balanced'
          ? { ...supply, candidateCardIds: [...supply.candidateCardIds, 'science-999' as const] }
          : supply,
      ),
      MISSIONS.map((mission) =>
        mission.id === 'model-audit' ? { ...mission, coreQuestion: '   ' } : mission,
      ),
    );

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'missing-topic-display', path: 'topics.science.icon' }),
        expect.objectContaining({ code: 'unknown-candidate', path: 'supplies.balanced.candidateCardIds' }),
        expect.objectContaining({ code: 'empty-mission-question', path: 'missions.model-audit.coreQuestion' }),
      ]),
    );
  });

  it('중복 후보 카드는 주제별 고유 후보 수를 늘리지 않는다', () => {
    const balanced = SUPPLY_PROFILES.find((supply) => supply.id === 'balanced');
    if (!balanced) throw new Error('balanced supply profile is required for this test');

    const repeatedScienceCandidates = [
      ...Array.from({ length: 5 }, () => 'science-1' as const),
      ...balanced.candidateCardIds.filter((cardId) => !cardId.startsWith('science-')),
    ];
    const supplies = SUPPLY_PROFILES.map((supply) =>
      supply.id === 'balanced' ? { ...supply, candidateCardIds: repeatedScienceCandidates } : supply,
    );

    const issues = validateContent(TOPICS, CARDS, supplies, MISSIONS);

    expect(issues).toContainEqual(
      expect.objectContaining({
        code: 'insufficient-candidates',
        path: 'supplies.balanced.candidateCardIds.science',
      }),
    );
  });
});
