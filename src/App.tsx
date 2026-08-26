import { AppShell } from './components/layout/AppShell';
import { IntroScreen } from './features/intro/IntroScreen';
import { RecommendationFeed } from './features/feed/RecommendationFeed';
import { RuleTransparencyPanel } from './features/transparency/RuleTransparencyPanel';
import { PredictionPanel } from './features/prediction/PredictionPanel';
import { DistributionComparison } from './features/comparison/DistributionComparison';
import { ChangedResultSummary } from './features/comparison/ChangedResultSummary';
import { ExplorationPanel } from './features/exploration/ExplorationPanel';
import { ExplorationOutcome } from './features/exploration/ExplorationOutcome';
import { BalanceControlPanel } from './features/balance/BalanceControlPanel';
import { ScenarioComparison } from './features/balance/ScenarioComparison';
import { SupplyAuditPanel } from './features/audit/SupplyAuditPanel';
import { ModelReport } from './features/report/ModelReport';
import { CompletionScreen } from './features/report/CompletionScreen';
import { useExperimentController } from './features/experiment/useExperimentController';
import { choiceResultForState, ruleResultForState, balancePreviewForState } from './features/experiment/experimentViewModel';
import { missionForStage, type ExperimentState, type PredictionAnswer } from './domain/experimentState';
import { reportEvidenceForState } from './domain/experimentStateReport';
import type { BalanceConfig } from './domain/balanceScenarios';
import type { ReportDraft } from './domain/reportAssessment';
import type { CardId, InfluenceFactor, TopicId } from './domain/types';
import { TOPICS } from './data/topics';

export { ExplorationOutcome } from './features/exploration/ExplorationOutcome';

const assertNever = (value: never): never => {
  throw new Error(`처리하지 않은 실험 단계: ${String(value)}`);
};

const topicLabel = (topicId: TopicId): string => TOPICS.find((topic) => topic.id === topicId)?.label ?? topicId;

interface StageProps {
  state: ExperimentState;
  reset(): void;
  start(): void;
  selectCard(cardId: CardId): void;
  submitPrediction(answer: PredictionAnswer): void;
  submitDistribution(answer: PredictionAnswer): void;
  exploreTopic(topicId: TopicId): void;
  setBalanceConfig(config: BalanceConfig): void;
  saveBalancePreview(): void;
  compareBalance(): void;
  submitAudit(factor: InfluenceFactor): void;
  updateReport(draft: ReportDraft): void;
  submitReport(): void;
}

function StageContent({ state, ...commands }: StageProps): React.JSX.Element {
  const choiceResult = choiceResultForState(state);
  const reportEvidence = reportEvidenceForState(state);
  const balancePreview = balancePreviewForState(state);

  switch (state.stage) {
    case 'intro':
      return <IntroScreen onStart={commands.start} />;
    case 'choice':
      return (
        <>
          <p>미션 1을 시작해 보세요.</p>
          <p role="status" aria-live="polite">
            {state.selectionHistory.length > 0
              ? `${topicLabel(state.selectionHistory[state.selectionHistory.length - 1].topicId)} 관심 토큰이 ${state.interest[state.selectionHistory[state.selectionHistory.length - 1].topicId]}개가 되었습니다`
              : ''}
          </p>
          {state.lastError ? <p role="alert">{state.lastError}</p> : null}
          {state.focusTopicId ? <p>관심 토큰 {state.interest[state.focusTopicId]}개</p> : null}
          <RecommendationFeed
            result={choiceResult}
            selectedIds={state.selectionHistory.map((event) => event.cardId)}
            focusTopicId={state.focusTopicId}
            onSelect={commands.selectCard}
          />
          <RuleTransparencyPanel result={ruleResultForState(state)} />
          {state.focusTopicId ? (
            <PredictionPanel
              focusTopicId={state.focusTopicId}
              selectionCount={state.selectionHistory.length}
              onSubmit={commands.submitPrediction}
            />
          ) : null}
        </>
      );
    case 'comparison':
      if (!state.changedResult || !state.focusTopicId) return <p>비교 결과를 준비하고 있습니다.</p>;
      return (
        <>
          <ChangedResultSummary result={state.changedResult} />
          <DistributionComparison
            before={state.initialResult}
            after={state.changedResult}
            focusTopicId={state.focusTopicId}
            onCorrect={commands.submitDistribution}
          />
        </>
      );
    case 'exploration':
      if (!state.changedResult || !state.focusTopicId) return <p>탐색 결과를 준비하고 있습니다.</p>;
      return (
        <>
          {state.lastError ? <p role="alert">{state.lastError}</p> : null}
          <ExplorationPanel currentResult={state.changedResult} focusTopicId={state.focusTopicId} onExplore={commands.exploreTopic} />
        </>
      );
    case 'balance':
      if (!state.changedResult || !state.explorationResult || !state.focusTopicId) return <p>균형 결과를 준비하고 있습니다.</p>;
      return (
        <>
          {state.lastError ? <p role="alert">{state.lastError}</p> : null}
          <ExplorationOutcome before={state.changedResult} after={state.explorationResult} focusTopicId={state.focusTopicId} />
          <BalanceControlPanel config={state.balanceConfig} snapshots={state.balanceSnapshots} onConfigChange={commands.setBalanceConfig} onSave={commands.saveBalancePreview} onCompare={commands.compareBalance} />
          {balancePreview ? <RuleTransparencyPanel result={balancePreview} /> : null}
          <ScenarioComparison snapshots={state.balanceSnapshots} />
        </>
      );
    case 'audit':
      return (
        <>
          {state.lastError ? <p role="alert">{state.lastError}</p> : null}
          {state.auditPair ? <SupplyAuditPanel pair={state.auditPair} onAnswer={commands.submitAudit} /> : null}
          <p>이 결과는 가상의 단순 규칙을 살펴본 학습용 증거입니다.</p>
        </>
      );
    case 'report':
      return (
        <>
          {state.lastError ? <p role="alert">{state.lastError}</p> : null}
          {reportEvidence ? <ModelReport draft={state.reportDraft} evidence={reportEvidence} onChange={commands.updateReport} onSubmit={commands.submitReport} /> : null}
        </>
      );
    case 'complete':
      return reportEvidence
        ? <CompletionScreen draft={state.reportDraft} evidence={reportEvidence} onReset={commands.reset} />
        : <p>실험 결과를 준비하고 있습니다.</p>;
    default:
      return assertNever(state.stage);
  }
}

const stageCommands = (controller: ReturnType<typeof useExperimentController>): StageProps => ({
  state: controller.state,
  reset: controller.reset,
  start: controller.start,
  selectCard: controller.selectCard,
  submitPrediction: controller.submitPrediction,
  submitDistribution: controller.submitDistribution,
  exploreTopic: controller.exploreTopic,
  setBalanceConfig: controller.setBalanceConfig,
  saveBalancePreview: () => { void controller.saveBalancePreview(); },
  compareBalance: controller.compareBalance,
  submitAudit: controller.submitAudit,
  updateReport: controller.updateReport,
  submitReport: () => { void controller.submitReport(); },
});

export default function App(): React.JSX.Element {
  const controller = useExperimentController();
  const { state } = controller;
  const commands = stageCommands(controller);
  const mission = missionForStage(state.stage);
  const heading = mission
    ? `미션 ${mission.order}. ${mission.title}`
    : state.stage === 'report' ? '실험 보고서 단계' : state.stage === 'complete' ? '완료 단계' : '';

  return (
    <AppShell stage={state.stage} onReset={controller.reset}>
      {state.stage === 'intro' ? <StageContent {...commands} /> : (
        <section aria-labelledby="mission-stage-title">
          <h2 id="mission-stage-title" tabIndex={-1}>{heading}</h2>
          <StageContent {...commands} />
        </section>
      )}
    </AppShell>
  );
}
