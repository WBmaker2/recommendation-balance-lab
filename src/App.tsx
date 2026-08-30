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
import { useExperimentController, type ExperimentController } from './features/experiment/useExperimentController';
import { choiceResultForState, ruleResultForState, balancePreviewForState } from './features/experiment/experimentViewModel';
import { missionForStage, type ExperimentState, type PredictionAnswer } from './domain/experimentState';
import { reportEvidenceForState } from './domain/experimentStateReport';
import type { BalanceConfig } from './domain/balanceScenarios';
import type { ReportDraft } from './domain/reportAssessment';
import type { CardId, InfluenceFactor, TopicId } from './domain/types';
import { TOPICS } from './data/topics';
import { useNextTaskReveal } from './features/experiment/useNextTaskReveal';
import { StagePrompt } from './components/layout/StagePrompt';

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
  useNextTaskReveal({ active: state.stage === 'choice' && state.selectionHistory.length === 3, targetId: 'prediction-panel-title' });

  switch (state.stage) {
    case 'intro':
      return <IntroScreen onStart={commands.start} />;
    case 'choice':
      return (
        <>
          <StagePrompt
            eyebrow="미션 1 · 선택의 흔적"
            title="미션 1을 시작해 보세요."
            description="카드 하나를 같은 자리에 세 번 골라 내가 고른 주제가 다음 추천에 남기는 흔적을 관찰합니다."
            completionHint="같은 주제 카드 3개와 예측 두 가지를 고릅니다."
          />
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
          <StagePrompt
            eyebrow="미션 2 · 좁아진 창"
            title="두 목록의 변화를 읽어 보세요"
            description="표의 실제 카드 수를 보고 포커스 주제와 나타난 주제 수가 어떻게 바뀌었는지 고릅니다."
            completionHint="두 문장을 고르면 탐색 미션으로 이동합니다."
          />
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
          <StagePrompt
            eyebrow="미션 3 · 탐색 버튼"
            title="낯선 주제를 한 장 열어 보세요"
            description="현재 목록에 없는 주제를 골라 한 번의 탐색이 추천 분포를 어떻게 바꾸는지 비교합니다."
            completionHint="후보 카드 하나를 고르면 균형 설정으로 이동합니다."
          />
          {state.lastError ? <p role="alert">{state.lastError}</p> : null}
          <ExplorationPanel currentResult={state.changedResult} focusTopicId={state.focusTopicId} onExplore={commands.exploreTopic} />
        </>
      );
    case 'balance':
      if (!state.changedResult || !state.explorationResult || !state.focusTopicId) return <p>균형 결과를 준비하고 있습니다.</p>;
      return (
        <>
          <StagePrompt
            eyebrow="미션 4 · 균형 조정"
            title="설정 세 가지를 저장하고 비교해 보세요"
            description="다양성 토큰과 관심 기록 설정을 바꿔 서로 다른 결과를 나란히 살펴봅니다."
            completionHint="서로 다른 설정 3개를 저장하면 비교할 수 있습니다."
          />
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
          <StagePrompt
            eyebrow="미션 5 · 모델 감사"
            title="공급 조건이 달라진 이유를 찾아보세요"
            description="선택과 설정은 그대로 두고 공급 목록만 달라진 두 결과를 표로 확인합니다."
            completionHint="달라진 영향 요인을 고르면 보고서를 작성합니다."
          />
          {state.lastError ? <p role="alert">{state.lastError}</p> : null}
          {state.auditPair ? <SupplyAuditPanel pair={state.auditPair} onAnswer={commands.submitAudit} /> : null}
          <p>이 결과는 가상의 단순 규칙을 살펴본 학습용 증거입니다.</p>
        </>
      );
    case 'report':
      return (
        <>
          <StagePrompt
            eyebrow="마무리 · 모델 보고서"
            title="관찰한 근거로 보고서를 완성해 보세요"
            description="표에서 읽은 변화와 설정을 골라 이 가상 모형의 설명을 스스로 정리합니다."
            completionHint="모든 질문에 답하고 제출하면 실험이 끝납니다."
          />
          {reportEvidence ? <ModelReport draft={state.reportDraft} evidence={reportEvidence} errorMessage={state.lastError} onChange={commands.updateReport} onSubmit={commands.submitReport} /> : null}
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

const stageCommands = (controller: ExperimentController): StageProps => ({
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

export function AppView({ controller }: { controller: ExperimentController }): React.JSX.Element {
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

export default function App(): React.JSX.Element {
  return <AppView controller={useExperimentController()} />;
}
