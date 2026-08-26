import { CARDS } from '../data/cards';
import { SUPPLY_PROFILES } from '../data/supplyProfiles';
import { auditPairsEqual, buildAuditPair, validateAuditPair } from './auditComparison';
import { canCompareBalance } from './balanceScenarios';
import { compareDistributions, countTopicCards, isDistributionAnswerCorrect, type DistributionDelta } from './distribution';
import { assessReport, cloneReportDraft, emptyReportDraft, isReportDraft, type ReportAssessment, type ReportDraft } from './reportAssessment';
import type { ExperimentState } from './experimentState';
import type { InfluenceFactor } from './types';

const REPORT_UPDATE_ERROR = '보고서 선택을 확인해 주세요.';

export const reportDeltaForState = (state: ExperimentState): DistributionDelta | null => {
  try {
    if (!state.initialResult || !state.changedResult || !state.focusTopicId) return null;
    return compareDistributions(countTopicCards(state.initialResult.cards), countTopicCards(state.changedResult.cards));
  } catch {
    return null;
  }
};

const hasChoiceEvidence = (state: ExperimentState, delta: DistributionDelta | null): boolean => {
  try {
    return Boolean(delta && state.focusTopicId && state.selectionHistory.length === 3
      && state.selectionHistory.every((event) => event.topicId === state.focusTopicId)
      && new Set(state.selectionHistory.map((event) => event.cardId)).size === 3
      && state.selectionHistory.every((event, index) => event.ordinal === index + 1
        && CARDS.some((card) => card.id === event.cardId && card.topicId === event.topicId))
      && state.distributionAnswer
      && isDistributionAnswerCorrect(state.distributionAnswer, delta, state.focusTopicId));
  } catch {
    return false;
  }
};

export const completedFactorsForState = (state: ExperimentState): readonly InfluenceFactor[] => {
  const delta = reportDeltaForState(state);
  const factors: InfluenceFactor[] = [];
  if (hasChoiceEvidence(state, delta)) factors.push('choice-record');
  if (state.balanceCompared && canCompareBalance(state.balanceSnapshots)) factors.push('balance-setting');
  try {
    const expected = state.changedResult ? buildAuditPair(state.changedResult.request, CARDS, SUPPLY_PROFILES) : null;
    if (state.auditPair && expected && state.auditAnswer === 'supply-condition'
      && validateAuditPair(state.auditPair).length === 0 && auditPairsEqual(state.auditPair, expected)) {
      factors.push('supply-condition');
    }
  } catch {
    // A malformed audit is simply not evidence for the report.
  }
  return factors;
};

export const reportEvidenceForState = (state: ExperimentState) => {
  const delta = reportDeltaForState(state);
  return delta ? { distributionDelta: delta, snapshots: state.balanceSnapshots, completedFactors: completedFactorsForState(state) } : null;
};

export const reduceReportUpdate = (state: ExperimentState, draft: ReportDraft): ExperimentState => {
  if (state.stage !== 'report') return { ...state, lastError: '지금은 모델 보고서 단계가 아닙니다.' };
  if (!isReportDraft(draft)) return { ...state, lastError: REPORT_UPDATE_ERROR };
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
