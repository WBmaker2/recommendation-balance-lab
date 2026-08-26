import { TOPICS } from '../../data/topics';
import { countTopicCards } from '../../domain/distribution';
import type { RecommendationResult } from '../../domain/recommendationEngine';
import type { TopicId } from '../../domain/types';

interface ChangedResultSummaryProps {
  result: RecommendationResult;
}

export function ChangedResultSummary({ result }: ChangedResultSummaryProps): React.JSX.Element {
  const counts = countTopicCards(result.cards);
  return (
    <>
      <h3 id="comparison-placeholder-title">예측한 다음 목록의 결정적 결과</h3>
      <ul>
        {Object.entries(counts).map(([topicId, count]) => (
          <li key={topicId}>{TOPICS.find((topic) => topic.id === topicId as TopicId)?.label ?? topicId} {count}장</li>
        ))}
      </ul>
    </>
  );
}
