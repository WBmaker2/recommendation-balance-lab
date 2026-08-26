import { useState } from 'react';
import { TOPICS } from '../../data/topics';
import type { PredictionAnswer, DirectionAnswer } from '../../domain/experimentState';
import type { TopicId } from '../../domain/types';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface PredictionPanelProps {
  focusTopicId: TopicId;
  selectionCount: number;
  onSubmit(answer: PredictionAnswer): void;
}

const choices: readonly { value: DirectionAnswer; label: string }[] = [
  { value: 'increase', label: '늘어난다' },
  { value: 'same', label: '같다' },
  { value: 'decrease', label: '줄어든다' },
];

export function PredictionPanel({
  focusTopicId,
  selectionCount,
  onSubmit,
}: PredictionPanelProps): React.JSX.Element {
  const [focusDirection, setFocusDirection] = useState<DirectionAnswer | null>(null);
  const [varietyDirection, setVarietyDirection] = useState<DirectionAnswer | null>(null);
  const reducedMotion = useReducedMotion();
  const enabled = selectionCount === 3 && focusDirection !== null && varietyDirection !== null;
  const focusLabel = TOPICS.find((topic) => topic.id === focusTopicId)?.label ?? focusTopicId;

  const submit = (): void => {
    if (!enabled || !focusDirection || !varietyDirection) return;
    onSubmit({ focusDirection, varietyDirection });
  };

  return (
    <section aria-labelledby="prediction-panel-title" data-prediction-panel>
      <h3 id="prediction-panel-title">다음 목록 예측</h3>
      <p>{focusLabel} 주제 카드는 다음 목록에서 어떻게 될까요?</p>
      <fieldset>
        <legend>포커스 주제 카드 수 예측</legend>
        {choices.map((choice) => (
          <label key={choice.value}>
            <input
              type="radio"
              name="포커스 주제 카드 수 예측"
              value={choice.value}
              checked={focusDirection === choice.value}
              onChange={() => setFocusDirection(choice.value)}
            />
            {choice.label}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>나타나는 주제 수 예측</legend>
        {choices.map((choice) => (
          <label key={choice.value}>
            <input
              type="radio"
              name="나타나는 주제 수 예측"
              value={choice.value}
              checked={varietyDirection === choice.value}
              onChange={() => setVarietyDirection(choice.value)}
            />
            {choice.label}
          </label>
        ))}
      </fieldset>
      <p>같은 주제 선택: {selectionCount}/3</p>
      {enabled && reducedMotion ? <p className="gi-pulse__label motion-static-label">지금 할 차례</p> : null}
      <button
        type="button"
        className={enabled && !reducedMotion ? 'gi-pulse' : undefined}
        data-gi-pulse={enabled && !reducedMotion ? 'true' : 'false'}
        disabled={!enabled}
        onClick={submit}
      >
        <span className="gi-pulse__label">다음 목록 예측</span>
      </button>
    </section>
  );
}
