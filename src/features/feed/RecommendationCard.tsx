import { TOPICS } from '../../data/topics';
import { TopicBadge } from '../../components/common/TopicBadge';
import type { ContentCard } from '../../domain/types';
import type { RecommendationExplanation } from '../../domain/recommendationEngine';

export interface RecommendationCardProps {
  card: ContentCard;
  explanation: RecommendationExplanation;
  selected: boolean;
  onSelect(): void;
  onShowReason?(): void;
}

export function RecommendationCard({
  card,
  explanation,
  selected,
  onSelect,
  onShowReason,
}: RecommendationCardProps): React.JSX.Element {
  const topic = TOPICS.find((item) => item.id === card.topicId);
  if (!topic) throw new Error(`카드 주제를 찾을 수 없습니다: ${card.topicId}`);
  const titleId = `recommendation-card-title-${card.id}`;

  return (
    <article
      className="recommendation-card"
      aria-labelledby={titleId}
      data-topic-id={card.topicId}
      data-pattern={topic.pattern}
    >
      <TopicBadge topic={topic} decorativeIcon />
      <h3 id={titleId}>{topic.label} 추천 카드: {card.title}</h3>
      <p>{card.summary}</p>
      <button type="button" aria-pressed={selected} onClick={onSelect}>
        이 카드 선택
      </button>
      <button type="button" onClick={onShowReason}>
        왜 이 카드가 나왔나요?
      </button>
      <p aria-label="관심 토큰 증거">
        관심 토큰 {explanation.interestTokens}개
      </p>
    </article>
  );
}
