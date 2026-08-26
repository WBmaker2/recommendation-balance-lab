import { TOPICS } from '../../data/topics';
import { CARDS } from '../../data/cards';
import { TopicBadge } from '../../components/common/TopicBadge';
import { findExplorationCandidates } from '../../domain/experimentState';
import type { RecommendationResult } from '../../domain/recommendationEngine';
import type { TopicId } from '../../domain/types';

export interface ExplorationPanelProps {
  currentResult: RecommendationResult;
  focusTopicId: TopicId;
  onExplore(topicId: TopicId): void;
}

export function ExplorationPanel({
  currentResult,
  focusTopicId,
  onExplore,
}: ExplorationPanelProps): React.JSX.Element {
  const candidates = findExplorationCandidates(currentResult, CARDS, focusTopicId);
  const visibleCandidates = candidates.slice(0, 3);

  return (
    <section aria-labelledby="exploration-panel-title">
      <h3 id="exploration-panel-title">낯선 주제 한 장을 열어 보세요</h3>
      <p>현재 추천 목록에 없는 주제의 카드를 하나 골라 다음 목록을 비교합니다.</p>
      <p>이 선택은 실제 취향이 아니라 가상 모형을 시험하는 행동입니다.</p>
      {visibleCandidates.length === 0 ? (
        <p>열어 볼 수 있는 새 주제 카드가 없습니다.</p>
      ) : (
        <ul aria-label="탐색 후보 목록">
          {visibleCandidates.map((card) => {
            const topic = TOPICS.find((item) => item.id === card.topicId);
            if (!topic) return null;
            return (
              <li key={card.id}>
                <article
                  aria-labelledby={`exploration-card-title-${card.id}`}
                  data-topic-id={card.topicId}
                  data-pattern={topic.pattern}
                >
                  <TopicBadge topic={topic} />
                  <h4 id={`exploration-card-title-${card.id}`}>{topic.label} 탐색 카드: {card.title}</h4>
                  <p>{card.summary}</p>
                  <button
                    type="button"
                    className="gi-pulse"
                    data-gi-pulse="true"
                    onClick={() => onExplore(card.topicId)}
                  >
                    낯선 주제 열기
                  </button>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
