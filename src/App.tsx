import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { TopicBadge } from './components/common/TopicBadge';
import { IntroScreen } from './features/intro/IntroScreen';
import {
  applyExploration,
  experimentReducer,
  initialExperimentState,
  missionForStage,
  nextPracticeCard,
} from './domain/experimentState';
import { reportEvidenceForState } from './domain/experimentStateReport';
import { RecommendationFeed } from './features/feed/RecommendationFeed';
import { RuleTransparencyPanel } from './features/transparency/RuleTransparencyPanel';
import { PredictionPanel } from './features/prediction/PredictionPanel';
import { DistributionComparison } from './features/comparison/DistributionComparison';
import { DistributionTable } from './features/comparison/DistributionTable';
import { ExplorationPanel } from './features/exploration/ExplorationPanel';
import { BalanceControlPanel } from './features/balance/BalanceControlPanel';
import { ScenarioComparison } from './features/balance/ScenarioComparison';
import { SupplyAuditPanel } from './features/audit/SupplyAuditPanel';
import { CARDS } from './data/cards';
import { SUPPLY_PROFILES } from './data/supplyProfiles';
import { TOPIC_ORDER, TOPICS } from './data/topics';
import { buildCardExplanation, recommend } from './domain/recommendationEngine';
import { compareDistributions, countTopicCards } from './domain/distribution';
import { createBalancePreview, saveBalanceSnapshot } from './domain/balanceScenarios';
import { buildAuditPair } from './domain/auditComparison';
import { assessReport } from './domain/reportAssessment';
import { CompletionScreen } from './features/report/CompletionScreen';
import { ModelReport } from './features/report/ModelReport';
import type { CardId, TopicId } from './domain/types';
import type { PredictionAnswer } from './domain/experimentState';
import type { RecommendationResult } from './domain/recommendationEngine';

const balancedSupply = SUPPLY_PROFILES.find((supply) => supply.id === 'balanced') ?? (() => {
  throw new Error('균형 공급 프로필이 필요합니다.');
})();
const topicLabel = (topicId: TopicId): string => TOPICS.find((topic) => topic.id === topicId)?.label ?? topicId;
const topicDefinition = (topicId: TopicId) => TOPICS.find((topic) => topic.id === topicId);

interface ExplorationOutcomeProps {
  before: RecommendationResult;
  after: RecommendationResult;
  focusTopicId: TopicId;
}

export function ExplorationOutcome({ before, after, focusTopicId }: ExplorationOutcomeProps): React.JSX.Element {
  const delta = compareDistributions(countTopicCards(before.cards), countTopicCards(after.cards));
  const exploredTopicId = TOPIC_ORDER.find(
    (topicId) => after.request.interest[topicId] !== before.request.interest[topicId],
  ) ?? focusTopicId;
  const exploredTopic = topicDefinition(exploredTopicId);
  if (!exploredTopic) throw new Error('탐색 결과 주제 정의가 올바르지 않습니다.');
  const compositionChanged = TOPIC_ORDER.some((topicId) => delta.delta[topicId] !== 0);

  return (
    <section aria-labelledby="exploration-outcome-title">
      <h3 id="exploration-outcome-title">탐색 결과</h3>
      <p>{exploredTopic.label} 관심 토큰이 1개 추가되었습니다</p>
      <DistributionTable delta={delta} />
      {compositionChanged ? (
        <p>추천 구성에 변화가 생겼습니다. 표에서 실제 카드 수 차이를 확인해 보세요.</p>
      ) : (
        <p>관심 토큰은 늘었지만 8장 배분 결과는 아직 같았습니다.</p>
      )}
      <p>한 번의 탐색이 균형을 자동으로 회복한다고 보장하지 않습니다.</p>
      <h4>탐색 후 추천 목록</h4>
      <ul aria-label="탐색 후 추천 목록">
        {after.cards.map((card) => {
          const topic = topicDefinition(card.topicId);
          if (!topic) return null;
          return (
            <li key={card.id}>
              <TopicBadge topic={topic} /> {card.title}
            </li>
          );
        })}
      </ul>
      <p>다음 활동을 준비하고 있습니다.</p>
    </section>
  );
}

export default function App(): React.JSX.Element {
  const [state, dispatch] = useReducer(experimentReducer, undefined, initialExperimentState);
  const [announcement, setAnnouncement] = useState('');
  const [actionError, setActionError] = useState('');
  const previousSelectionCount = useRef(0);
  const mission = missionForStage(state.stage);

  const choiceResult = useMemo(() => ({
    ...state.initialResult,
    cards: state.choiceFeed,
    explanations: state.choiceFeed.map((card) => buildCardExplanation(card, state.initialResult)),
  }), [state.initialResult, state.choiceFeed]);

  const previewResult = useMemo(() => recommend({
    interest: state.interest,
    diversityLevel: 0,
    memoryMode: 'keep',
    supplyProfileId: 'balanced',
    round: 1,
    feedSize: 8,
  }, CARDS, balancedSupply), [state.interest]);

  const balancePreview = useMemo(() => {
    if (!state.explorationResult) return null;
    return createBalancePreview(state.explorationResult.request, state.balanceConfig, CARDS, balancedSupply);
  }, [state.balanceConfig, state.explorationResult]);

  const expectedAuditPair = useMemo(() => {
    if (state.stage !== 'audit' || !state.changedResult) return null;
    try {
      return buildAuditPair(state.changedResult.request, CARDS, SUPPLY_PROFILES);
    } catch {
      return null;
    }
  }, [state.changedResult, state.stage]);

  const reportEvidence = reportEvidenceForState(state);

  useEffect(() => {
    if (state.stage === 'audit' && !state.auditPair && expectedAuditPair) {
      dispatch({ type: 'RECORD_AUDIT', pair: expectedAuditPair });
    }
  }, [expectedAuditPair, state.auditPair, state.stage]);

  useEffect(() => {
    const count = state.selectionHistory.length;
    if (count > previousSelectionCount.current) {
      const latest = state.selectionHistory[count - 1];
      setAnnouncement(`${topicLabel(latest.topicId)} 관심 토큰이 ${state.interest[latest.topicId]}개가 되었습니다`);
    } else if (count < previousSelectionCount.current || state.lastError) {
      setAnnouncement('');
    }
    previousSelectionCount.current = count;
  }, [state.interest, state.lastError, state.selectionHistory]);

  const handleSelect = (cardId: CardId): void => {
    const card = state.choiceFeed.find((item) => item.id === cardId);
    if (!card) {
      setAnnouncement('현재 목록에 있는 카드만 선택해 주세요.');
      return;
    }

    const usedIds = new Set<CardId>([
      ...state.choiceFeed.map((item) => item.id),
      ...state.selectionHistory.map((item) => item.cardId),
    ]);
    try {
      const replacement = nextPracticeCard(card.topicId, usedIds, CARDS);
      dispatch({ type: 'SELECT_CARD', card, replacement });
    } catch (error) {
      setAnnouncement(error instanceof Error ? error.message : '카드를 선택하지 못했습니다.');
    }
  };

  const submitPrediction = (answer: PredictionAnswer): void => {
    const result = recommend({
      interest: state.interest,
      diversityLevel: 0,
      memoryMode: 'keep',
      supplyProfileId: 'balanced',
      round: 1,
      feedSize: 8,
    }, CARDS, balancedSupply);
    dispatch({ type: 'SUBMIT_PREDICTION', answer, result });
  };

  const handleExplore = (topicId: TopicId): void => {
    setActionError('');
    if (!state.changedResult || !state.focusTopicId) {
      setActionError('먼저 분포 확인을 완료해 주세요.');
      return;
    }
    try {
      const request = state.changedResult.request;
      const interest = applyExploration(state.interest, topicId, state.focusTopicId);
      const expectedRequest = {
        ...request,
        interest,
        round: request.round + 1,
      };
      const supply = SUPPLY_PROFILES.find((item) => item.id === expectedRequest.supplyProfileId);
      if (!supply) throw new Error('탐색 결과가 가상 규칙과 일치하지 않습니다.');
      const result = recommend(expectedRequest, CARDS, supply);
      dispatch({ type: 'RECORD_EXPLORATION', topicId, result });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '탐색 결과를 만들지 못했습니다.');
    }
  };

  const handleBalanceSave = (): void => {
    setActionError('');
    if (!state.explorationResult || !balancePreview) return;
    try {
      const saved = saveBalanceSnapshot(state.balanceSnapshots, state.balanceConfig, balancePreview);
      if (!saved.ok) {
        setActionError(saved.reason === 'duplicate-config' ? '이미 저장한 설정입니다.' : '세 개의 설정만 저장할 수 있습니다.');
        return;
      }
      dispatch({ type: 'SAVE_BALANCE_SNAPSHOT', snapshot: saved.snapshots[saved.snapshots.length - 1] });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '저장할 균형 결과가 올바르지 않습니다.');
    }
  };

  const handleBalanceConfigChange = (config: import('./domain/balanceScenarios').BalanceConfig): void => {
    setActionError('');
    dispatch({ type: 'SET_BALANCE_CONFIG', config });
  };

  const submitReport = (): void => {
    if (!reportEvidence) {
      dispatch({ type: 'COMPLETE_REPORT', assessment: assessReport(state.reportDraft, {} as never, [], []) });
      return;
    }
    dispatch({
      type: 'COMPLETE_REPORT',
      assessment: assessReport(state.reportDraft, reportEvidence.distributionDelta, reportEvidence.snapshots, reportEvidence.completedFactors),
    });
  };

  return (
    <AppShell stage={state.stage} onReset={() => dispatch({ type: 'RESET' })}>
      {state.stage === 'intro' ? (
        <IntroScreen onStart={() => dispatch({ type: 'START' })} />
      ) : (
        <section aria-labelledby="mission-stage-title">
          <h2 id="mission-stage-title">
            {mission ? `미션 ${mission.order}. ${mission.title}` : '실험 결과'}
          </h2>
          {state.stage === 'choice' ? (
            <>
              <p>미션 1을 시작해 보세요.</p>
              <p role="status" aria-live="polite">{state.lastError ? '' : announcement}</p>
              {state.lastError ? <p role="alert">{state.lastError}</p> : null}
              {state.focusTopicId ? <p>관심 토큰 {state.interest[state.focusTopicId]}개</p> : null}
              <RecommendationFeed
                result={choiceResult}
                selectedIds={state.selectionHistory.map((event) => event.cardId)}
                focusTopicId={state.focusTopicId}
                onSelect={handleSelect}
              />
              <RuleTransparencyPanel result={previewResult} />
              {state.focusTopicId && state.selectionHistory.length > 0 ? (
                <PredictionPanel
                  focusTopicId={state.focusTopicId}
                  selectionCount={state.selectionHistory.length}
                  onSubmit={submitPrediction}
                />
              ) : null}
            </>
          ) : state.stage === 'comparison' && state.changedResult && state.focusTopicId ? (
            <>
              <h3 id="comparison-placeholder-title">예측한 다음 목록의 결정적 결과</h3>
              <ul>
                {Object.entries(countTopicCards(state.changedResult.cards)).map(([topicId, count]) => (
                  <li key={topicId}>{topicLabel(topicId as keyof typeof state.interest)} {count}장</li>
                ))}
              </ul>
              <DistributionComparison
                before={state.initialResult}
                after={state.changedResult}
                focusTopicId={state.focusTopicId}
                onCorrect={(answer) => dispatch({ type: 'SUBMIT_DISTRIBUTION', answer })}
              />
            </>
          ) : state.stage === 'exploration' && state.changedResult && state.focusTopicId ? (
            <>
              {state.lastError || actionError ? <p role="alert">{state.lastError || actionError}</p> : null}
              <ExplorationPanel
                currentResult={state.changedResult}
                focusTopicId={state.focusTopicId}
                onExplore={handleExplore}
              />
            </>
          ) : state.stage === 'balance' && state.changedResult && state.explorationResult && state.focusTopicId ? (
            <>
              {state.lastError || actionError ? <p role="alert">{state.lastError || actionError}</p> : null}
              <ExplorationOutcome
                before={state.changedResult}
                after={state.explorationResult}
                focusTopicId={state.focusTopicId}
              />
              <BalanceControlPanel
                config={state.balanceConfig}
                snapshots={state.balanceSnapshots}
                onConfigChange={handleBalanceConfigChange}
                onSave={handleBalanceSave}
                onCompare={() => dispatch({ type: 'COMPLETE_BALANCE_COMPARISON' })}
              />
              {balancePreview ? <RuleTransparencyPanel result={balancePreview} /> : null}
              <ScenarioComparison snapshots={state.balanceSnapshots} />
            </>
          ) : state.stage === 'audit' ? (
            <>
              {state.lastError ? <p role="alert">{state.lastError}</p> : null}
              {(state.auditPair ?? expectedAuditPair) ? (
                <SupplyAuditPanel
                  pair={(state.auditPair ?? expectedAuditPair)!}
                  onAnswer={(answer) => dispatch({ type: 'SUBMIT_AUDIT_ANSWER', answer })}
                />
              ) : null}
              <p>이 결과는 가상의 단순 규칙을 살펴본 학습용 증거입니다.</p>
            </>
          ) : state.stage === 'report' ? (
            <>
              {state.lastError ? <p role="alert">{state.lastError}</p> : null}
              {reportEvidence ? <ModelReport draft={state.reportDraft} evidence={reportEvidence} onChange={(draft) => dispatch({ type: 'UPDATE_REPORT', draft })} onSubmit={submitReport} /> : null}
            </>
          ) : state.stage === 'complete' && reportEvidence ? (
            <CompletionScreen draft={state.reportDraft} evidence={reportEvidence} onReset={() => dispatch({ type: 'RESET' })} />
          ) : (
            <p>다음 활동을 준비하고 있습니다.</p>
          )}
        </section>
      )}
    </AppShell>
  );
}
