import { LEARNING_GOALS, MODEL_WARNING } from '../../data/learningCopy';
import { buildReportSentence } from '../../domain/reportAssessment';
import type { ReportDraft, ReportEvidence } from '../../domain/reportAssessment';

interface CompletionScreenProps {
  draft: ReportDraft;
  evidence: ReportEvidence;
  onReset(): void;
}

export function CompletionScreen({ draft, evidence, onReset }: CompletionScreenProps): React.JSX.Element {
  return (
    <section aria-labelledby="completion-title">
      <h3 id="completion-title">실험 완료</h3>
      <p>{MODEL_WARNING}</p>
      <p>{buildReportSentence(draft, evidence)}</p>
      <h4>이번 활동에서 확인한 증거</h4>
      <ul>
        {LEARNING_GOALS.map((goal) => <li key={goal}>{goal}</li>)}
      </ul>
      <button type="button" onClick={onReset}>새 실험 시작</button>
    </section>
  );
}
