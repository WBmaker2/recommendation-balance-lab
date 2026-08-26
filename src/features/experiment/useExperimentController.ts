import { useEffect, useMemo, useReducer, useRef } from 'react';
import { CARDS } from '../../data/cards';
import { SUPPLY_PROFILES } from '../../data/supplyProfiles';
import {
  applyExploration,
  canRunPrediction,
  experimentReducer,
  initialExperimentState,
  nextPracticeCard,
  type DistributionAnswer,
  type ExperimentState,
  type PredictionAnswer,
} from '../../domain/experimentState';
import {
  createBalancePreview,
  isBalanceConfig,
  saveBalanceSnapshot,
  canCompareBalance,
  type BalanceConfig,
  type SaveSnapshotResult,
} from '../../domain/balanceScenarios';
import { cloneDirectionAnswer, isExactDirectionAnswer } from '../../domain/answerValidation';
import { buildAuditPair } from '../../domain/auditComparison';
import { canAdvanceToAudit } from '../../domain/balanceEvidenceValidation';
import { reportEvidenceForState } from '../../domain/experimentStateReport';
import { assessReport, isReportDraft, type ReportAssessment, type ReportDraft } from '../../domain/reportAssessment';
import { recommend } from '../../domain/recommendationEngine';
import type { CardId, InfluenceFactor, TopicId } from '../../domain/types';

export interface ExperimentController {
  state: ExperimentState;
  balanceConfig: BalanceConfig;
  start(): void;
  selectCard(cardId: CardId): void;
  submitPrediction(answer: PredictionAnswer): void;
  submitDistribution(answer: DistributionAnswer): void;
  exploreTopic(topicId: TopicId): void;
  setBalanceConfig(config: BalanceConfig): void;
  saveBalancePreview(): SaveSnapshotResult;
  compareBalance(): void;
  submitAudit(factor: InfluenceFactor): void;
  updateReport(draft: ReportDraft): void;
  submitReport(): ReportAssessment;
  reset(): void;
}

const balancedSupply = SUPPLY_PROFILES.find((item) => item.id === 'balanced') ?? (() => {
  throw new Error('균형 공급 프로필이 필요합니다.');
})();
const supplyFor = (id: 'balanced' | 'nature-rich') => SUPPLY_PROFILES.find((item) => item.id === id);

const validPrediction = isExactDirectionAnswer;

const validFactor = (factor: unknown): factor is InfluenceFactor => (
  factor === 'choice-record' || factor === 'balance-setting' || factor === 'supply-condition'
);

const failedAssessment = (): ReportAssessment => ({
  changeReading: false,
  causeSeparation: false,
  tradeoffJudgment: false,
  limitationAwareness: false,
  complete: false,
  feedback: [],
});

export function useExperimentController(): ExperimentController {
  const [state, dispatch] = useReducer(experimentReducer, undefined, initialExperimentState);
  const previousStage = useRef(state.stage);

  useEffect(() => {
    if (previousStage.current !== state.stage) {
      previousStage.current = state.stage;
      if (state.stage !== 'intro') document.getElementById('mission-stage-title')?.focus();
    }
  }, [state.stage]);

  return useMemo<ExperimentController>(() => {
    const start = (): void => {
      if (state.stage === 'intro') dispatch({ type: 'START' });
    };

    const selectCard = (cardId: CardId): void => {
      if (state.stage !== 'choice' || state.selectionHistory.length >= 3) return;
      const card = state.choiceFeed.find((item) => item.id === cardId);
      if (!card) return;
      if (state.focusTopicId && card.topicId !== state.focusTopicId) {
        dispatch({ type: 'SELECT_CARD', card, replacement: card });
        return;
      }
      const usedIds = new Set<CardId>([
        ...state.choiceFeed.map((item) => item.id),
        ...state.selectionHistory.map((item) => item.cardId),
      ]);
      try {
        const replacement = nextPracticeCard(card.topicId, usedIds, CARDS);
        dispatch({ type: 'SELECT_CARD', card, replacement });
      } catch {
        // The reducer remains the authority for malformed or exhausted input.
      }
    };

    const submitPrediction = (answer: PredictionAnswer): void => {
      if (state.stage !== 'choice' || !canRunPrediction(state) || !validPrediction(answer)) return;
      try {
        const result = recommend({
          interest: { ...state.interest },
          diversityLevel: 0,
          memoryMode: 'keep',
          supplyProfileId: 'balanced',
          round: 1,
          feedSize: 8,
        }, CARDS, balancedSupply);
        dispatch({ type: 'SUBMIT_PREDICTION', answer: cloneDirectionAnswer(answer), result });
      } catch {
        // No action is dispatched when a canonical result cannot be derived.
      }
    };

    const submitDistribution = (answer: DistributionAnswer): void => {
      if (state.stage === 'comparison' && state.changedResult && state.focusTopicId && validPrediction(answer)) {
        dispatch({ type: 'SUBMIT_DISTRIBUTION', answer: cloneDirectionAnswer(answer) });
      }
    };

    const exploreTopic = (topicId: TopicId): void => {
      if (state.stage !== 'exploration' || !state.changedResult || !state.focusTopicId || state.explorationResult) return;
      try {
        const interest = applyExploration(state.interest, topicId, state.focusTopicId);
        const request = { ...state.changedResult.request, interest, round: state.changedResult.request.round + 1 };
        const supply = supplyFor(request.supplyProfileId);
        if (!supply) return;
        const result = recommend(request, CARDS, supply);
        dispatch({ type: 'RECORD_EXPLORATION', topicId, result });
      } catch {
        // Invalid candidates are ignored before they reach the reducer.
      }
    };

    const setBalanceConfig = (config: BalanceConfig): void => {
      if (state.stage === 'balance' && isBalanceConfig(config)) dispatch({ type: 'SET_BALANCE_CONFIG', config: { ...config } });
    };

    const saveBalancePreview = (): SaveSnapshotResult => {
      if (state.stage !== 'balance' || !state.explorationResult) return { ok: false, reason: 'three-snapshot-limit' };
      const supply = supplyFor(state.explorationResult.request.supplyProfileId);
      if (!supply || !isBalanceConfig(state.balanceConfig)) return { ok: false, reason: 'three-snapshot-limit' };
      try {
        const result = createBalancePreview(state.explorationResult.request, state.balanceConfig, CARDS, supply);
        const saved = saveBalanceSnapshot(state.balanceSnapshots, state.balanceConfig, result);
        if (saved.ok) dispatch({ type: 'SAVE_BALANCE_SNAPSHOT', snapshot: saved.snapshots[saved.snapshots.length - 1] });
        return saved;
      } catch {
        return { ok: false, reason: 'three-snapshot-limit' };
      }
    };

    const compareBalance = (): void => {
      if (!canAdvanceToAudit(state) || !canCompareBalance(state.balanceSnapshots) || !state.focusTopicId) return;
      if (!state.changedResult) return;
      try {
        const pair = buildAuditPair(state.changedResult.request, CARDS, SUPPLY_PROFILES);
        dispatch({ type: 'COMPLETE_BALANCE_COMPARISON', pair });
      } catch {
        // Keep the learner on balance when controlled evidence cannot be built.
      }
    };

    const submitAudit = (factor: InfluenceFactor): void => {
      if (state.stage === 'audit' && state.auditPair && validFactor(factor)) {
        dispatch({ type: 'SUBMIT_AUDIT_ANSWER', answer: factor });
      }
    };

    const updateReport = (draft: ReportDraft): void => {
      if (state.stage === 'report' && isReportDraft(draft)) dispatch({ type: 'UPDATE_REPORT', draft });
    };

    const submitReport = (): ReportAssessment => {
      if (state.stage !== 'report') return failedAssessment();
      const evidence = reportEvidenceForState(state);
      const assessment = evidence
        ? assessReport(state.reportDraft, evidence.distributionDelta, evidence.snapshots, evidence.completedFactors)
        : assessReport(state.reportDraft, {} as never, [], []);
      dispatch({ type: 'COMPLETE_REPORT', assessment });
      return assessment;
    };

    const reset = (): void => dispatch({ type: 'RESET' });

    return {
      state,
      balanceConfig: { ...state.balanceConfig },
      start,
      selectCard,
      submitPrediction,
      submitDistribution,
      exploreTopic,
      setBalanceConfig,
      saveBalancePreview,
      compareBalance,
      submitAudit,
      updateReport,
      submitReport,
      reset,
    };
  }, [state]);
}
