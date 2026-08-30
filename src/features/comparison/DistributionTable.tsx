import { TOPIC_ORDER, TOPICS } from '../../data/topics';
import { TopicBadge } from '../../components/common/TopicBadge';
import type { TopicId } from '../../domain/types';
import type { DistributionDelta } from '../../domain/distribution';

export interface DistributionTableProps {
  delta: DistributionDelta;
}

const countLabel = (count: number): string => `${count}장`;
const signedLabel = (count: number): string => count > 0 ? `+${count}장` : `${count}장`;

const barStyle = (count: number): React.CSSProperties => ({ width: `${(count / 8) * 100}%` });

export function DistributionTable({ delta }: DistributionTableProps): React.JSX.Element {
  return (
    <table className="data-table" data-number-format="tabular" aria-label="추천 주제 분포 전후 비교">
      <caption>추천 주제 분포 전후 비교</caption>
      <thead>
        <tr>
          <th scope="col">주제</th>
          <th scope="col">선택 전 카드 수</th>
          <th scope="col">선택 후 카드 수</th>
          <th scope="col">차이</th>
        </tr>
      </thead>
      <tbody>
        {TOPIC_ORDER.map((topicId: TopicId) => {
          const topic = TOPICS.find((item) => item.id === topicId);
          if (!topic) throw new Error('분포 표 주제 정의가 올바르지 않습니다.');
          const before = delta.before[topicId];
          const after = delta.after[topicId];
          return (
            <tr key={topicId}>
              <th scope="row"><TopicBadge topic={topic} /></th>
              <td id={`distribution-${topicId}-before`}>
                <span aria-hidden="true" data-distribution-bar="before" style={barStyle(before)} />
                <span>{countLabel(before)}</span>
              </td>
              <td id={`distribution-${topicId}-after`}>
                <span aria-hidden="true" data-distribution-bar="after" style={barStyle(after)} />
                <span>{countLabel(after)}</span>
              </td>
              <td>{signedLabel(delta.delta[topicId])}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
