import { describe, expect, it } from 'vitest';
import { emptyReportDraft, type ReportDraft } from './reportAssessment';
import { getReportValidationErrors, isReportReady } from './reportValidation';

const completeDraft = (): ReportDraft => ({
  focusDirection: 'increase',
  varietyDirection: 'decrease',
  acknowledgedFactors: ['choice-record', 'balance-setting', 'supply-condition'],
  purpose: 'discover',
  chosenSnapshotId: 'scenario-a',
  evidenceMetric: 'topic-variety',
  evidenceValue: 5,
  limitationChoice: 'virtual-simple-model',
});

describe('report validation', () => {
  it('returns every missing group in stable learner-facing order', () => {
    expect(getReportValidationErrors(emptyReportDraft())).toEqual([
      { id: 'focus-direction', message: '포커스 주제 카드 수 변화를 골라 주세요.', targetId: 'report-focus-direction' },
      { id: 'variety-direction', message: '나타난 주제 수 변화를 골라 주세요.', targetId: 'report-variety-direction' },
      { id: 'acknowledged-factors', message: '영향을 준 조건을 모두 골라 주세요.', targetId: 'report-acknowledged-factors' },
      { id: 'purpose', message: '보고서의 목적을 골라 주세요.', targetId: 'report-purpose' },
      { id: 'snapshot', message: '비교할 설정을 골라 주세요.', targetId: 'report-snapshot' },
      { id: 'metric', message: '관찰할 지표를 골라 주세요.', targetId: 'report-metric' },
      { id: 'observed-value', message: '관찰한 값을 확인해 주세요.', targetId: 'report-observed-value' },
      { id: 'limitation', message: '모형의 한계를 골라 주세요.', targetId: 'report-limitation' },
    ]);
  });

  it('accepts a draft when every required group is complete', () => {
    expect(getReportValidationErrors(completeDraft())).toEqual([]);
    expect(isReportReady(completeDraft())).toBe(true);
  });

  it('requires all three influence factors and an observed value', () => {
    const draft: ReportDraft = {
      ...completeDraft(),
      acknowledgedFactors: ['choice-record'],
      evidenceValue: null,
    };
    expect(getReportValidationErrors(draft).map((error) => error.id)).toEqual(['acknowledged-factors', 'observed-value']);
    expect(isReportReady(draft)).toBe(false);
  });
});
