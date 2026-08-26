import { useEffect, useRef, useState } from 'react';
import { RecommendationCard } from './RecommendationCard';
import { WhyThisCardDialog } from '../transparency/WhyThisCardDialog';
import { TOPICS } from '../../data/topics';
import type { CardId, TopicId } from '../../domain/types';
import type { RecommendationExplanation, RecommendationResult } from '../../domain/recommendationEngine';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { FeedTransition } from './FeedTransition';

export interface RecommendationFeedProps {
  result: RecommendationResult;
  selectedIds: readonly CardId[];
  focusTopicId: TopicId | null;
  onSelect(cardId: CardId): void;
}

const feedFingerprint = (result: RecommendationResult): string => result.cards.map((card) => card.id).join('|');

export function RecommendationFeed({
  result,
  selectedIds,
  focusTopicId,
  onSelect,
}: RecommendationFeedProps): React.JSX.Element {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const focusSlot = useRef<number | null>(null);
  const [activeExplanation, setActiveExplanation] = useState<RecommendationExplanation | null>(null);
  const [transitionBefore, setTransitionBefore] = useState<RecommendationResult | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (focusSlot.current === null) return;
    buttonRefs.current[focusSlot.current]?.focus();
    focusSlot.current = null;
  }, [result.cards]);

  const chooseCard = (slot: number, cardId: CardId): void => {
    focusSlot.current = slot;
    setTransitionBefore(result);
    onSelect(cardId);
  };

  const explanationFor = (cardId: CardId): RecommendationExplanation | undefined =>
    result.explanations.find((explanation) => explanation.cardId === cardId);
  const focusLabel = TOPICS.find((topic) => topic.id === focusTopicId)?.label;

  return (
    <section aria-labelledby="recommendation-feed-title">
      <h3 id="recommendation-feed-title">현재 추천 피드</h3>
      <p>카드를 선택하면 같은 주제의 다음 카드가 같은 자리에 나타납니다.</p>
      {focusLabel ? <p>현재 반복 선택 주제: {focusLabel}</p> : null}
      <div data-feed-layout="fixed-eight">
        {result.cards.map((card, index) => {
          const explanation = explanationFor(card.id);
          if (!explanation) return null;
          return (
            <RecommendationCard
              key={index}
              card={card}
              explanation={explanation}
              selected={selectedIds.includes(card.id)}
              onSelect={() => chooseCard(index, card.id)}
              onShowReason={() => setActiveExplanation(explanation)}
            />
          );
        })}
      </div>
      {transitionBefore && feedFingerprint(transitionBefore) !== feedFingerprint(result) ? (
        <FeedTransition before={transitionBefore} after={result} reducedMotion={reducedMotion} />
      ) : null}
      {activeExplanation ? (
        <WhyThisCardDialog
          explanation={activeExplanation}
          onClose={() => setActiveExplanation(null)}
        />
      ) : null}
    </section>
  );
}
