import type { EvidenceMetric } from '../domain/reportAssessment';

export type LearnerScenarioId = 'scenario-a' | 'scenario-b' | 'scenario-c';
export type MetricUnit = '장' | '개';

export const SCENARIO_LABELS: Readonly<Record<LearnerScenarioId, string>> = {
  'scenario-a': '설정 1',
  'scenario-b': '설정 2',
  'scenario-c': '설정 3',
};

export const scenarioLabel = (id: LearnerScenarioId): string => SCENARIO_LABELS[id];

export const metricUnit = (metric: EvidenceMetric): MetricUnit => (
  metric === 'focus-card-count' ? '장' : '개'
);

export const learnerMetricLabel = (metric: EvidenceMetric, focusTopicLabel?: string): string => (
  metric === 'focus-card-count'
    ? `${focusTopicLabel ? `${focusTopicLabel} ` : ''}포커스 카드 수`
    : '나타난 주제 수'
);

export const formatObservedMetric = (
  metric: EvidenceMetric,
  value: number,
  focusTopicLabel?: string,
): string => `${learnerMetricLabel(metric, focusTopicLabel)}: ${value}${metricUnit(metric)}`;
