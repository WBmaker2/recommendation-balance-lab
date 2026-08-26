import type { SupplyProfile, TopicCounts } from '../domain/types';
import { CARDS } from './cards';
import { TOPIC_ORDER } from './topics';

const BALANCED_TOKENS: TopicCounts = {
  science: 1,
  art: 1,
  sports: 1,
  nature: 1,
  history: 1,
};

const NATURE_RICH_TOKENS: TopicCounts = {
  science: 1,
  art: 1,
  sports: 1,
  nature: 4,
  history: 1,
};

const allCardIds = CARDS.map((card) => card.id);
const natureRichCardIds = TOPIC_ORDER.flatMap((topicId) =>
  CARDS.filter((card) => card.topicId === topicId && (topicId === 'nature' || Number(card.id.split('-')[1]) <= 5)).map(
    (card) => card.id,
  ),
);

export const SUPPLY_PROFILES: readonly SupplyProfile[] = [
  {
    id: 'balanced',
    label: '균형 공급',
    baseTokens: BALANCED_TOKENS,
    candidateCardIds: allCardIds,
  },
  {
    id: 'nature-rich',
    label: '자연 풍부 공급',
    baseTokens: NATURE_RICH_TOKENS,
    candidateCardIds: natureRichCardIds,
  },
];
