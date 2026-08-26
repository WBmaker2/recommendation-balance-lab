import { CARDS } from '../../data/cards';
import { SUPPLY_PROFILES } from '../../data/supplyProfiles';
import { createBalancePreview } from '../../domain/balanceScenarios';
import { buildCardExplanation, recommend, type RecommendationResult } from '../../domain/recommendationEngine';
import type { ExperimentState } from '../../domain/experimentState';

const balancedSupply = SUPPLY_PROFILES.find((supply) => supply.id === 'balanced');
if (!balancedSupply) throw new Error('균형 공급 프로필이 필요합니다.');

export const choiceResultForState = (state: ExperimentState): RecommendationResult => ({
  ...state.initialResult,
  cards: state.choiceFeed,
  explanations: state.choiceFeed.map((card) => buildCardExplanation(card, state.initialResult)),
});

export const ruleResultForState = (state: ExperimentState): RecommendationResult => recommend({
  interest: { ...state.interest },
  diversityLevel: 0,
  memoryMode: 'keep',
  supplyProfileId: 'balanced',
  round: 1,
  feedSize: 8,
}, CARDS, balancedSupply);

export const balancePreviewForState = (state: ExperimentState): RecommendationResult | null => {
  if (!state.explorationResult) return null;
  return createBalancePreview(state.explorationResult.request, state.balanceConfig, CARDS, balancedSupply);
};
