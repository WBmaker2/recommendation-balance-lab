import { LEARNING_GOALS, MODEL_WARNING } from '../../data/learningCopy';
import { buildReportSentence } from '../../domain/reportAssessment';
import type { ReportDraft, ReportEvidence } from '../../domain/reportAssessment';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface CompletionScreenProps {
  draft: ReportDraft;
  evidence: ReportEvidence;
  onReset(): void;
}

export function CompletionScreen({ draft, evidence, onReset }: CompletionScreenProps): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  return (
    <section className="completion-card" aria-labelledby="completion-title">
      <h3 id="completion-title">실험 완료</h3>
      <p className="completion-card__boundary">{MODEL_WARNING}</p>
      <p>{buildReportSentence(draft, evidence)}</p>
      <h4>이번 활동에서 확인한 증거</h4>
      <ul>
        {LEARNING_GOALS.map((goal) => <li key={goal}>{goal}</li>)}
      </ul>
      {reducedMotion ? <p className="gi-pulse__label motion-static-label">새 실험을 시작할 수 있어요.</p> : null}
      <button
        type="button"
        className={reducedMotion ? undefined : 'gi-pulse'}
        data-gi-pulse={reducedMotion ? 'false' : 'true'}
        onClick={onReset}
      >
        <span className="gi-pulse__label">새 실험 시작</span>
      </button>
    </section>
  );
}
