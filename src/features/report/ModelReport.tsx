import { PURPOSE_LABELS } from '../../data/learningCopy';
import { TOPIC_ORDER, TOPICS } from '../../data/topics';
import { countTopicCards } from '../../domain/distribution';
import type { BalanceSnapshot } from '../../domain/balanceScenarios';
import type { InfluenceFactor } from '../../domain/types';
import type { EvidenceMetric, ModelReportProps, ReportDraft, ReportEvidence } from '../../domain/reportAssessment';

export type { ModelReportProps } from '../../domain/reportAssessment';

const FACTORS: readonly { id: InfluenceFactor; label: string }[] = [
  { id: 'choice-record', label: '선택 기록' },
  { id: 'balance-setting', label: '균형 설정' },
  { id: 'supply-condition', label: '콘텐츠 공급' },
];

const topicLabel = (topicId: string): string => TOPICS.find((topic) => topic.id === topicId)?.label ?? topicId;

const metricLabel = (metric: EvidenceMetric): string => metric === 'focus-card-count' ? '포커스 주제 카드 수' : '나타난 주제 수';

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

export function ModelReport({ draft, evidence, onChange, onSubmit }: ModelReportProps): React.JSX.Element {
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

  return (
    <section aria-labelledby="model-report-title">
      <h3 id="model-report-title">모델 보고서</h3>
      <p>관찰한 카드 수와 조건을 선택해 실험의 근거를 정리해 보세요.</p>
      <fieldset>
        <legend>선택 후 변화</legend>
        <label><input type="radio" name="report-focus-direction" checked={draft.focusDirection === 'increase'} onChange={() => onChange(updateDraft(draft, { focusDirection: 'increase' }))} /> 포커스 주제 카드 수가 늘어납니다</label>
        <label><input type="radio" name="report-focus-direction" checked={draft.focusDirection === 'same'} onChange={() => onChange(updateDraft(draft, { focusDirection: 'same' }))} /> 포커스 주제 카드 수가 같습니다</label>
        <label><input type="radio" name="report-focus-direction" checked={draft.focusDirection === 'decrease'} onChange={() => onChange(updateDraft(draft, { focusDirection: 'decrease' }))} /> 포커스 주제 카드 수가 줄어듭니다</label>
      </fieldset>
      <fieldset>
        <legend>나타난 주제 수 변화</legend>
        <label><input type="radio" name="report-variety-direction" checked={draft.varietyDirection === 'increase'} onChange={() => onChange(updateDraft(draft, { varietyDirection: 'increase' }))} /> 나타난 주제 수가 늘어납니다</label>
        <label><input type="radio" name="report-variety-direction" checked={draft.varietyDirection === 'same'} onChange={() => onChange(updateDraft(draft, { varietyDirection: 'same' }))} /> 나타난 주제 수가 같습니다</label>
        <label><input type="radio" name="report-variety-direction" checked={draft.varietyDirection === 'decrease'} onChange={() => onChange(updateDraft(draft, { varietyDirection: 'decrease' }))} /> 나타난 주제 수가 줄어듭니다</label>
      </fieldset>
      <fieldset>
        <legend>추천 결과에 영향을 준 조건</legend>
        {FACTORS.map((factor) => (
          <label key={factor.id}><input type="checkbox" checked={draft.acknowledgedFactors.includes(factor.id)} onChange={() => toggleFactor(factor.id)} /> {factor.label}</label>
        ))}
      </fieldset>
      <fieldset>
        <legend>보고서의 학습 목적</legend>
        {(Object.entries(PURPOSE_LABELS) as [ReportDraft['purpose'] & string, string][]).map(([purpose, label]) => (
          <label key={purpose}><input type="radio" name="report-purpose" checked={draft.purpose === purpose} onChange={() => onChange(updateDraft(draft, { purpose }))} /> {label}</label>
        ))}
      </fieldset>
      <section aria-labelledby="saved-scenarios-title">
        <h4 id="saved-scenarios-title">저장한 세 가지 설정의 실제 카드 근거</h4>
        {evidence.snapshots.map((snapshot) => {
          const counts = countTopicCards(snapshot.result.cards);
          const selected = draft.chosenSnapshotId === snapshot.id;
          return (
            <article key={snapshot.id} aria-labelledby={`${snapshot.id}-report-title`}>
              <h5 id={`${snapshot.id}-report-title`}>{snapshot.id} 설정</h5>
              <label>
                <input type="radio" name="report-snapshot" checked={selected} onChange={() => onChange(updateDraft(draft, {
                  chosenSnapshotId: snapshot.id,
                  evidenceValue: draft.evidenceMetric ? observedValue(snapshot, draft.evidenceMetric, focusTopicId) : null,
                }))} />
                {snapshot.id} 설정의 실제 카드 수 사용
              </label>
              <p>다양성 토큰 {snapshot.config.diversityLevel} · {snapshot.config.memoryMode === 'keep' ? '관심 기록 유지' : '관심 기록 비우기'}</p>
              <table aria-label={`${snapshot.id} 보고서 카드 근거`}>
                <caption>{snapshot.id} 주제별 실제 카드 수</caption>
                <thead><tr><th scope="col">주제</th><th scope="col">카드 수</th></tr></thead>
                <tbody>{TOPIC_ORDER.map((topicId) => <tr key={topicId}><th scope="row">{topicLabel(topicId)}</th><td>{counts[topicId]}장</td></tr>)}</tbody>
              </table>
            </article>
          );
        })}
      </section>
      <fieldset>
        <legend>선택한 설정에서 사용할 관찰 지표</legend>
        {( [['focus-card-count', '포커스 주제 카드 수'], ['topic-variety', '나타난 주제 수']] as const).map(([metric, label]) => (
          <label key={metric}><input type="radio" name="report-metric" checked={draft.evidenceMetric === metric} onChange={() => chooseMetric(metric)} /> {label}</label>
        ))}
        {draft.evidenceMetric && selectedObserved !== null ? (
          <label><input type="radio" name="report-observed-value" checked={draft.evidenceValue === selectedObserved} onChange={() => onChange(updateDraft(draft, { evidenceValue: selectedObserved }))} /> 관찰한 {metricLabel(draft.evidenceMetric)}: {selectedObserved}장(개)</label>
        ) : <p>먼저 지표를 선택해 주세요.</p>}
      </fieldset>
      <fieldset>
        <legend>모형의 한계</legend>
        <label><input type="radio" name="report-limitation" checked={draft.limitationChoice === 'virtual-simple-model'} onChange={() => onChange(updateDraft(draft, { limitationChoice: 'virtual-simple-model' }))} /> 가상의 단순 규칙</label>
        <label><input type="radio" name="report-limitation" checked={draft.limitationChoice === 'actual-platform-measurement'} onChange={() => onChange(updateDraft(draft, { limitationChoice: 'actual-platform-measurement' }))} /> 실제 플랫폼 측정</label>
        <label><input type="radio" name="report-limitation" checked={draft.limitationChoice === 'habit-diagnosis'} onChange={() => onChange(updateDraft(draft, { limitationChoice: 'habit-diagnosis' }))} /> 사용 습관 진단</label>
      </fieldset>
      <button type="button" onClick={onSubmit}>모델 보고서 제출</button>
    </section>
  );
}
