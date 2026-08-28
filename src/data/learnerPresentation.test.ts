import { describe, expect, it } from 'vitest';
import {
  SCENARIO_LABELS,
  formatObservedMetric,
  learnerMetricLabel,
  metricUnit,
  scenarioLabel,
} from './learnerPresentation';

describe('learner presentation helpers', () => {
  it('maps internal scenario ids to child-facing labels', () => {
    expect(SCENARIO_LABELS).toEqual({
      'scenario-a': '설정 1',
      'scenario-b': '설정 2',
      'scenario-c': '설정 3',
    });
    expect(scenarioLabel('scenario-a')).toBe('설정 1');
    expect(scenarioLabel('scenario-b')).toBe('설정 2');
    expect(scenarioLabel('scenario-c')).toBe('설정 3');
  });

  it('uses 장 for card counts and 개 for topic counts', () => {
    expect(metricUnit('focus-card-count')).toBe('장');
    expect(metricUnit('topic-variety')).toBe('개');
    expect(learnerMetricLabel('focus-card-count', '과학')).toBe('과학 포커스 카드 수');
    expect(learnerMetricLabel('topic-variety')).toBe('나타난 주제 수');
    expect(formatObservedMetric('focus-card-count', 3, '과학')).toBe('과학 포커스 카드 수: 3장');
    expect(formatObservedMetric('topic-variety', 5)).toBe('나타난 주제 수: 5개');
  });
});
