import { MODEL_WARNING, RANDOMNESS_NOTICE } from '../../data/learningCopy';

export function ModelBoundaryNotice(): React.JSX.Element {
  return (
    <aside className="model-boundary" aria-label="가상 모델 안내">
      <strong>{MODEL_WARNING}</strong>
      <p>{RANDOMNESS_NOTICE}</p>
    </aside>
  );
}
