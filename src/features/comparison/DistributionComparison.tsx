import { useRef, useState } from 'react';
import { TOPICS } from '../../data/topics';
import {
  buildDistributionSummary,
  compareDistributions,
  countTopicCards,
  isDistributionAnswerCorrect,
  type DistributionDelta,
} from '../../domain/distribution';
import type { RecommendationResult } from '../../domain/recommendationEngine';
import type { DirectionAnswer, DistributionAnswer } from '../../domain/experimentState';
import type { TopicId } from '../../domain/types';
import { DistributionTable } from './DistributionTable';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface DistributionComparisonProps {
  before: RecommendationResult;
  after: RecommendationResult;
  focusTopicId: TopicId;
  onCorrect(answer: DistributionAnswer): void;
}

const choices: readonly { value: DirectionAnswer; label: string }[] = [
  { value: 'increase', label: '늘었다' },
  { value: 'same', label: '같다' },
  { value: 'decrease', label: '줄었다' },
];

const labelFor = (topicId: TopicId): string => TOPICS.find((topic) => topic.id === topicId)?.label ?? topicId;

export function DistributionComparison({
  before,
  after,
  focusTopicId,
  onCorrect,
}: DistributionComparisonProps): React.JSX.Element {
  const [focusDirection, setFocusDirection] = useState<DirectionAnswer | null>(null);
  const [varietyDirection, setVarietyDirection] = useState<DirectionAnswer | null>(null);
  const [wrong, setWrong] = useState(false);
  const successfulSubmission = useRef(false);
  const reducedMotion = useReducedMotion();
  const delta: DistributionDelta = compareDistributions(countTopicCards(before.cards), countTopicCards(after.cards));
  const enabled = focusDirection !== null && varietyDirection !== null;
  const answer = focusDirection && varietyDirection ? { focusDirection, varietyDirection } : null;
  const focusLabel = labelFor(focusTopicId);

  const submit = (): void => {
    if (!answer || !isDistributionAnswerCorrect(answer, delta, focusTopicId)) {
      setWrong(true);
      return;
    }
    if (successfulSubmission.current) return;
    successfulSubmission.current = true;
    setWrong(false);
    onCorrect(answer);
  };

  return (
    <section aria-labelledby="distribution-comparison-title">
      <h3 id="distribution-comparison-title">추천 분포 비교</h3>
      <p>미션 2 비교 화면을 준비했습니다.</p>
      <p>{buildDistributionSummary(delta, focusTopicId)}</p>
      {reducedMotion ? <p className="distribution-static motion-static-label">지금 할 차례: 표의 카드 수와 문장을 확인해 보세요.</p> : null}
      <DistributionTable delta={delta} />
      <p>빠져서 나타나지 않은 주제: {delta.missingTopics.length > 0 ? delta.missingTopics.map(labelFor).join(', ') : '없음'}</p>
      <fieldset>
        <legend>포커스 주제 카드 수 확인</legend>
        {choices.map((choice) => (
          <label key={choice.value}>
            <input
              type="radio"
              name="포커스 주제 카드 수 확인"
              value={choice.value}
              checked={focusDirection === choice.value}
              onChange={() => { setFocusDirection(choice.value); setWrong(false); }}
            />
            {choice.label}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>나타난 주제 수 확인</legend>
        {choices.map((choice) => (
          <label key={choice.value}>
            <input
              type="radio"
              name="나타난 주제 수 확인"
              value={choice.value}
              checked={varietyDirection === choice.value}
              onChange={() => { setVarietyDirection(choice.value); setWrong(false); }}
            />
            {choice.label}
          </label>
        ))}
      </fieldset>
      {wrong ? (
        <p role="alert">
          {focusLabel} 카드는 선택 전 <a href={`#distribution-${focusTopicId}-before`}>{delta.before[focusTopicId]}장</a>에서 선택 후 <a href={`#distribution-${focusTopicId}-after`}>{delta.after[focusTopicId]}장</a>이 되었습니다.{' '}
          나타난 주제: {delta.beforeVariety}개 → {delta.afterVariety}개. 좋고 나쁜 비율을 고르는 문제가 아니라 표의 사실을 읽는 활동입니다.
        </p>
      ) : null}
      <button
        type="button"
        disabled={!enabled}
        onClick={submit}
      >
        분포 문장 확인
      </button>
    </section>
  );
}
