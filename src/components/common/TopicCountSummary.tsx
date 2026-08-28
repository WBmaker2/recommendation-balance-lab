import { useId } from 'react';
import { TOPIC_ORDER, TOPICS } from '../../data/topics';
import { TopicBadge } from './TopicBadge';
import type { TopicId } from '../../domain/types';

export interface TopicCountSummaryProps {
  counts: Readonly<Record<TopicId, number>>;
  label: string;
}

const MAX_COUNT = 8;

const clampCount = (count: number): number => Math.min(MAX_COUNT, Math.max(0, count));

export function TopicCountSummary({ counts, label }: TopicCountSummaryProps): React.JSX.Element {
  const headingId = useId();
  return (
    <section className="topic-count-summary" aria-labelledby={headingId}>
      <h4 id={headingId}>{label}</h4>
      <p className="topic-count-summary__hint">막대가 길수록 그 주제 카드가 더 많이 나타났어요. 최대 8장을 기준으로 비교합니다.</p>
      <ul className="topic-count-summary__list">
        {TOPIC_ORDER.map((topicId) => {
          const topic = TOPICS.find((item) => item.id === topicId);
          if (!topic) throw new Error(`주제 ${topicId}의 표시 정보가 없습니다.`);
          const count = clampCount(counts[topicId] ?? 0);
          return (
            <li className="topic-count-summary__row" key={topicId}>
              <TopicBadge topic={topic} decorativeIcon />
              <span
                className="topic-count-summary__bar"
                role="progressbar"
                aria-label={`${topic.label} 카드 수 ${count}장`}
                aria-valuemin={0}
                aria-valuemax={MAX_COUNT}
                aria-valuenow={count}
              >
                <span className="topic-count-summary__fill" style={{ width: `${(count / MAX_COUNT) * 100}%` }} aria-hidden="true" />
              </span>
              <strong className="topic-count-summary__value">{count}장</strong>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
