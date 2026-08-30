import { TOPIC_ORDER, TOPICS } from '../../data/topics';
import { buildDistributionSummary, compareDistributions, countTopicCards } from '../../domain/distribution';
import type { RecommendationResult } from '../../domain/recommendationEngine';
import type { TopicId } from '../../domain/types';
import { TopicBadge } from '../../components/common/TopicBadge';
import { DistributionTable } from '../comparison/DistributionTable';

interface ExplorationOutcomeProps {
  before: RecommendationResult;
  after: RecommendationResult;
  focusTopicId: TopicId;
}

const topicDefinition = (topicId: TopicId) => TOPICS.find((topic) => topic.id === topicId);

export function ExplorationOutcome({ before, after, focusTopicId }: ExplorationOutcomeProps): React.JSX.Element {
  const delta = compareDistributions(countTopicCards(before.cards), countTopicCards(after.cards));
  const exploredTopicId = TOPIC_ORDER.find(
    (topicId) => after.request.interest[topicId] !== before.request.interest[topicId],
  ) ?? focusTopicId;
  const exploredTopic = topicDefinition(exploredTopicId);
  if (!exploredTopic) throw new Error('탐색 결과 주제 정의가 올바르지 않습니다.');
  const compositionChanged = TOPIC_ORDER.some((topicId) => delta.delta[topicId] !== 0);

  return (
    <section className="evidence-card exploration-outcome" aria-labelledby="exploration-outcome-title">
      <h3 id="exploration-outcome-title">탐색 결과</h3>
      <div aria-label="미션 3 완료 안내">
        <p><strong>미션 3 완료</strong> — 낯선 주제 카드를 열어 추천 목록의 변화를 살펴보았습니다.</p>
        <p>관찰 결과: {buildDistributionSummary(delta, focusTopicId)}</p>
        <p><strong>다음 미션: 균형 설정</strong> — 추천 목록을 바꾸는 설정을 살펴보세요.</p>
      </div>
      <p>{exploredTopic.label} 관심 토큰이 1개 추가되었습니다</p>
      <DistributionTable delta={delta} />
      {compositionChanged ? (
        <p>추천 구성에 변화가 생겼습니다. 표에서 실제 카드 수 차이를 확인해 보세요.</p>
      ) : (
        <p>관심 토큰은 늘었지만 8장 배분 결과는 아직 같았습니다.</p>
      )}
      <p>한 번의 탐색이 균형을 자동으로 회복한다고 보장하지 않습니다.</p>
      <h4>탐색 후 추천 목록</h4>
      <ul aria-label="탐색 후 추천 목록">
        {after.cards.map((card) => {
          const topic = topicDefinition(card.topicId);
          if (!topic) return null;
          return <li key={card.id}><TopicBadge topic={topic} /> {card.title}</li>;
        })}
      </ul>
      <p>다음 활동을 준비하고 있습니다.</p>
    </section>
  );
}
