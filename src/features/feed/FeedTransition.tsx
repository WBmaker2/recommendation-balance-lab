import { compareDistributions, countTopicCards } from '../../domain/distribution';
import type { RecommendationResult } from '../../domain/recommendationEngine';
import { DistributionTable } from '../comparison/DistributionTable';

export interface FeedTransitionProps {
  before: RecommendationResult;
  after: RecommendationResult;
  reducedMotion: boolean;
}

export function FeedTransition({ before, after, reducedMotion }: FeedTransitionProps): React.JSX.Element {
  const delta = compareDistributions(countTopicCards(before.cards), countTopicCards(after.cards));
  const content = (
    <>
      <p>추천 목록이 바뀌었습니다. 표에서 카드 수를 확인해 보세요.</p>
      <DistributionTable delta={delta} />
    </>
  );
  if (reducedMotion) {
    return <section className="distribution-static" aria-label="모션 감소 시 정적 추천 분포">{content}<p className="gi-pulse__label motion-static-label">지금 할 차례</p></section>;
  }
  return <section className="feed-transition" aria-label="카드 재배치 장면">{content}</section>;
}
