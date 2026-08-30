import { useEffect, useMemo } from 'react';
import { PURPOSE_LABELS } from '../../data/learningCopy';
import { formatObservedMetric, scenarioLabel } from '../../data/learnerPresentation';
import { TOPIC_ORDER, TOPICS } from '../../data/topics';
import { countTopicCards } from '../../domain/distribution';
import type { BalanceSnapshot } from '../../domain/balanceScenarios';
import type { InfluenceFactor } from '../../domain/types';
import type { EvidenceMetric, ModelReportProps, ReportDraft, ReportEvidence } from '../../domain/reportAssessment';
import { getReportValidationErrors, type ReportValidationError } from '../../domain/reportValidation';
import { TopicCountSummary } from '../../components/common/TopicCountSummary';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export type { ModelReportProps } from '../../domain/reportAssessment';

const FACTORS: readonly { id: InfluenceFactor; label: string }[] = [
  { id: 'choice-record', label: '선택 기록' },
  { id: 'balance-setting', label: '균형 설정' },
  { id: 'supply-condition', label: '콘텐츠 공급' },
];

const topicLabel = (topicId: string): string => TOPICS.find((topic) => topic.id === topicId)?.label ?? topicId;

const focusTopicFromEvidence = (evidence: ReportEvidence): string | null => {
  const positive = TOPIC_ORDER.filter((topicId) => evidence.distributionDelta.delta[topicId] > 0);
  return positive.length === 1 ? positive[0] : null;
};

const observedValue = (snapshot: BalanceSnapshot, metric: EvidenceMetric, focusTopicId: string | null): number => {
  const counts = countTopicCards(snapshot.result.cards);
  return metric === 'focus-card-count' && focusTopicId
    ? counts[focusTopicId as keyof typeof counts]
    : TOPIC_ORDER.filter((topicId) => counts[topicId] > 0).length;
};

const updateDraft = (draft: ReportDraft, patch: Partial<ReportDraft>): ReportDraft => ({ ...draft, ...patch });

const errorFor = (errors: readonly ReportValidationError[], id: ReportValidationError['id']): ReportValidationError | null => (
  errors.find((error) => error.id === id) ?? null
);

const errorId = (error: ReportValidationError | null): string | undefined => error ? `${error.targetId}-error` : undefined;

function InlineError({ error }: { error: ReportValidationError | null }): React.JSX.Element | null {
  return error ? <p id={errorId(error)} role="alert" className="inline-error">{error.message}</p> : null;
}

export function ModelReport({ draft, evidence, errorMessage = null, onChange, onSubmit }: ModelReportProps): React.JSX.Element {
  const validationErrors = useMemo(() => getReportValidationErrors(draft), [draft]);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (!errorMessage || validationErrors.length === 0) return;
    const target = document.getElementById(validationErrors[0].targetId);
    if (!(target instanceof HTMLElement)) return;
    target.focus({ preventScroll: true });
    if (typeof target.scrollIntoView === 'function') target.scrollIntoView({ behavior: 'auto', block: 'start' });
  }, [errorMessage, validationErrors]);

  const focusTopicId = focusTopicFromEvidence(evidence);
  const selectedSnapshot = evidence.snapshots.find((snapshot) => snapshot.id === draft.chosenSnapshotId) ?? evidence.snapshots[0];
  const selectedMetric = draft.evidenceMetric ?? 'focus-card-count';
  const selectedObserved = selectedSnapshot ? observedValue(selectedSnapshot, selectedMetric, focusTopicId) : null;
  const chooseMetric = (metric: EvidenceMetric): void => {
    const nextValue = selectedSnapshot ? observedValue(selectedSnapshot, metric, focusTopicId) : null;
    onChange(updateDraft(draft, { evidenceMetric: metric, evidenceValue: nextValue }));
  };
  const toggleFactor = (factor: InfluenceFactor): void => {
    const factors = draft.acknowledgedFactors.includes(factor)
      ? draft.acknowledgedFactors.filter((item) => item !== factor)
      : [...draft.acknowledgedFactors, factor];
    onChange(updateDraft(draft, { acknowledgedFactors: factors }));
  };
  const unresolvedError = errorMessage && validationErrors.length === 0 ? errorMessage : null;
  const focusError = errorFor(validationErrors, 'focus-direction');
  const varietyError = errorFor(validationErrors, 'variety-direction');
  const factorsError = errorFor(validationErrors, 'acknowledged-factors');
  const purposeError = errorFor(validationErrors, 'purpose');
  const snapshotError = errorFor(validationErrors, 'snapshot');
  const metricError = errorFor(validationErrors, 'metric');
  const observedError = errorFor(validationErrors, 'observed-value');
  const limitationError = errorFor(validationErrors, 'limitation');
  const submitReady = validationErrors.length === 0;

  return (
    <section className="model-report" aria-labelledby="model-report-title">
      <h3 id="model-report-title">모델 보고서</h3>
      <p>관찰한 카드 수와 조건을 선택해 실험의 근거를 정리해 보세요.</p>
      <ol className="report-sequence" data-report-sequence="true" aria-label="보고서 작성 순서">
        <li><strong>1. 변화 읽기</strong><span>두 목록의 차이를 고릅니다.</span></li>
        <li><strong>2. 조건 고르기</strong><span>영향을 준 조건을 표시합니다.</span></li>
        <li><strong>3. 카드 근거 확인</strong><span>저장한 설정과 지표를 연결합니다.</span></li>
        <li><strong>4. 한계 쓰기</strong><span>가상 모형의 범위를 확인합니다.</span></li>
      </ol>
      {unresolvedError ? <p role="alert" className="inline-error">{unresolvedError}</p> : null}
      <fieldset id="report-focus-direction" tabIndex={-1} aria-describedby={errorId(focusError)}>
        <legend>선택 후 변화</legend>
        <label><input id="report-focus-increase" aria-describedby={errorId(focusError)} type="radio" name="report-focus-direction" checked={draft.focusDirection === 'increase'} onChange={() => onChange(updateDraft(draft, { focusDirection: 'increase' }))} /> 포커스 주제 카드 수가 늘어납니다</label>
        <label><input id="report-focus-same" aria-describedby={errorId(focusError)} type="radio" name="report-focus-direction" checked={draft.focusDirection === 'same'} onChange={() => onChange(updateDraft(draft, { focusDirection: 'same' }))} /> 포커스 주제 카드 수가 같습니다</label>
        <label><input id="report-focus-decrease" aria-describedby={errorId(focusError)} type="radio" name="report-focus-direction" checked={draft.focusDirection === 'decrease'} onChange={() => onChange(updateDraft(draft, { focusDirection: 'decrease' }))} /> 포커스 주제 카드 수가 줄어듭니다</label>
        <InlineError error={focusError} />
      </fieldset>
      <fieldset id="report-variety-direction" tabIndex={-1} aria-describedby={errorId(varietyError)}>
        <legend>나타난 주제 수 변화</legend>
        <label><input id="report-variety-increase" aria-describedby={errorId(varietyError)} type="radio" name="report-variety-direction" checked={draft.varietyDirection === 'increase'} onChange={() => onChange(updateDraft(draft, { varietyDirection: 'increase' }))} /> 나타난 주제 수가 늘어납니다</label>
        <label><input id="report-variety-same" aria-describedby={errorId(varietyError)} type="radio" name="report-variety-direction" checked={draft.varietyDirection === 'same'} onChange={() => onChange(updateDraft(draft, { varietyDirection: 'same' }))} /> 나타난 주제 수가 같습니다</label>
        <label><input id="report-variety-decrease" aria-describedby={errorId(varietyError)} type="radio" name="report-variety-direction" checked={draft.varietyDirection === 'decrease'} onChange={() => onChange(updateDraft(draft, { varietyDirection: 'decrease' }))} /> 나타난 주제 수가 줄어듭니다</label>
        <InlineError error={varietyError} />
      </fieldset>
      <fieldset id="report-acknowledged-factors" tabIndex={-1} aria-describedby={errorId(factorsError)}>
        <legend>추천 결과에 영향을 준 조건</legend>
        {FACTORS.map((factor) => (
          <label key={factor.id}><input id={`report-factor-${factor.id}`} aria-describedby={errorId(factorsError)} type="checkbox" checked={draft.acknowledgedFactors.includes(factor.id)} onChange={() => toggleFactor(factor.id)} /> {factor.label}</label>
        ))}
        <InlineError error={factorsError} />
      </fieldset>
      <fieldset id="report-purpose" tabIndex={-1} aria-describedby={errorId(purposeError)}>
        <legend>보고서의 학습 목적</legend>
        {(Object.entries(PURPOSE_LABELS) as [ReportDraft['purpose'] & string, string][]).map(([purpose, label]) => (
          <label key={purpose}><input id={`report-purpose-${purpose}`} aria-describedby={errorId(purposeError)} type="radio" name="report-purpose" checked={draft.purpose === purpose} onChange={() => onChange(updateDraft(draft, { purpose }))} /> {label}</label>
        ))}
        <InlineError error={purposeError} />
      </fieldset>
      <section id="report-snapshot" tabIndex={-1} aria-describedby={errorId(snapshotError)} aria-labelledby="saved-scenarios-title">
        <h4 id="saved-scenarios-title">저장한 세 가지 설정의 실제 카드 근거</h4>
        {evidence.snapshots.map((snapshot, index) => {
          const counts = countTopicCards(snapshot.result.cards);
          const selected = draft.chosenSnapshotId === snapshot.id;
          const label = scenarioLabel(snapshot.id);
          const titleId = `report-scenario-title-${index + 1}`;
          return (
            <article key={snapshot.id} aria-labelledby={titleId}>
              <h5 id={titleId}>{label}</h5>
              <label>
                <input id={`report-snapshot-${index + 1}`} aria-describedby={errorId(snapshotError)} type="radio" name="report-snapshot" checked={selected} onChange={() => onChange(updateDraft(draft, {
                  chosenSnapshotId: snapshot.id,
                  evidenceValue: draft.evidenceMetric ? observedValue(snapshot, draft.evidenceMetric, focusTopicId) : null,
                }))} />
                {label}의 실제 카드 수 사용
              </label>
              <p>다양성 토큰 {snapshot.config.diversityLevel} · {snapshot.config.memoryMode === 'keep' ? '관심 기록 유지' : '관심 기록 비우기'}</p>
              <TopicCountSummary label={`${label} 카드 수 요약`} counts={counts} />
              <details>
                <summary>자세한 근거 보기</summary>
                <table aria-label={`${label} 보고서 카드 근거`}>
                  <caption>{label} 주제별 실제 카드 수</caption>
                  <thead><tr><th scope="col">주제</th><th scope="col">카드 수</th></tr></thead>
                  <tbody>{TOPIC_ORDER.map((topicId) => <tr key={topicId}><th scope="row">{topicLabel(topicId)}</th><td>{counts[topicId]}장</td></tr>)}</tbody>
                </table>
              </details>
            </article>
          );
        })}
        <InlineError error={snapshotError} />
      </section>
      <fieldset id="report-metric" tabIndex={-1} aria-describedby={errorId(metricError)}>
        <legend>선택한 설정에서 사용할 관찰 지표</legend>
        {( [['focus-card-count', '포커스 주제 카드 수'], ['topic-variety', '나타난 주제 수']] as const).map(([metric, label]) => (
          <label key={metric}><input id={`report-metric-${metric}`} aria-describedby={errorId(metricError)} type="radio" name="report-metric" checked={draft.evidenceMetric === metric} onChange={() => chooseMetric(metric)} /> {label}</label>
        ))}
        {draft.evidenceMetric && selectedObserved !== null ? (
          <label><input id="report-observed-value" aria-describedby={errorId(observedError)} type="radio" name="report-observed-value" checked={draft.evidenceValue === selectedObserved} onChange={() => onChange(updateDraft(draft, { evidenceValue: selectedObserved }))} /> {formatObservedMetric(draft.evidenceMetric, selectedObserved, focusTopicId ? topicLabel(focusTopicId) : undefined)}</label>
        ) : <p>먼저 지표를 선택해 주세요.</p>}
        <InlineError error={metricError} />
        <InlineError error={observedError} />
      </fieldset>
      <fieldset id="report-limitation" tabIndex={-1} aria-describedby={errorId(limitationError)}>
        <legend>모형의 한계</legend>
        <label><input id="report-limitation-virtual" aria-describedby={errorId(limitationError)} type="radio" name="report-limitation" checked={draft.limitationChoice === 'virtual-simple-model'} onChange={() => onChange(updateDraft(draft, { limitationChoice: 'virtual-simple-model' }))} /> 가상의 단순 규칙</label>
        <label><input id="report-limitation-platform" aria-describedby={errorId(limitationError)} type="radio" name="report-limitation" checked={draft.limitationChoice === 'actual-platform-measurement'} onChange={() => onChange(updateDraft(draft, { limitationChoice: 'actual-platform-measurement' }))} /> 실제 플랫폼 측정</label>
        <label><input id="report-limitation-habit" aria-describedby={errorId(limitationError)} type="radio" name="report-limitation" checked={draft.limitationChoice === 'habit-diagnosis'} onChange={() => onChange(updateDraft(draft, { limitationChoice: 'habit-diagnosis' }))} /> 사용 습관 진단</label>
        <InlineError error={limitationError} />
      </fieldset>
      {submitReady && reducedMotion ? <p className="gi-pulse__label motion-static-label">이제 보고서를 제출할 수 있어요.</p> : null}
      <button
        type="button"
        className={submitReady && !reducedMotion ? 'gi-pulse' : undefined}
        data-gi-pulse={submitReady && !reducedMotion ? 'true' : 'false'}
        onClick={onSubmit}
      >
        <span className="gi-pulse__label">모델 보고서 제출</span>
      </button>
    </section>
  );
}
