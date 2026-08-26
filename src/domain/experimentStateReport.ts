import { distributionFor, strictCompletedFactorsForState } from './experimentStateReportEvidence';
import type { DistributionDelta } from './distribution';
import { assessReport, cloneReportDraft, emptyReportDraft, isReportDraft, type ReportAssessment, type ReportDraft } from './reportAssessment';
import { isSafeReportEvidenceGraph } from './reportEvidenceValidation';
import type { ExperimentState } from './experimentState';
import type { InfluenceFactor } from './types';

const REPORT_UPDATE_ERROR = '보고서 선택을 확인해 주세요.';

export const reportDeltaForState = (state: ExperimentState): DistributionDelta | null => {
  return distributionFor(state);
};

export const completedFactorsForState = (state: ExperimentState): readonly InfluenceFactor[] => {
  return strictCompletedFactorsForState(state);
};

export const reportEvidenceForState = (state: ExperimentState) => {
  const delta = reportDeltaForState(state);
  return delta ? { distributionDelta: delta, snapshots: state.balanceSnapshots, completedFactors: completedFactorsForState(state) } : null;
};

export const reduceReportUpdate = (state: ExperimentState, draft: ReportDraft): ExperimentState => {
  if (state.stage !== 'report') return { ...state, lastError: '지금은 모델 보고서 단계가 아닙니다.' };
  if (!isSafeReportEvidenceGraph([draft]) || !isReportDraft(draft)) return { ...state, lastError: REPORT_UPDATE_ERROR };
  return { ...state, reportDraft: cloneReportDraft(draft), reportAssessment: null, lastError: null };
};

export const reduceReportCompletion = (state: ExperimentState, supplied: ReportAssessment): ExperimentState => {
  void supplied;
  if (state.stage === 'complete') return state;
  if (state.stage !== 'report') return { ...state, lastError: '먼저 모델 보고서 단계로 이동해 주세요.' };
  const evidence = reportEvidenceForState(state);
  const canonical = evidence
    ? assessReport(state.reportDraft, evidence.distributionDelta, evidence.snapshots, evidence.completedFactors)
    : assessReport(state.reportDraft, {} as never, [], []);
  if (!canonical.complete) {
    return { ...state, reportAssessment: canonical, lastError: canonical.feedback.join(' ') };
  }
  return { ...state, stage: 'complete', reportAssessment: canonical, lastError: null };
};

export const freshReportDraft = emptyReportDraft;

export { REPORT_UPDATE_ERROR };
