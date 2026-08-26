import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { IntroScreen } from './features/intro/IntroScreen';
import { experimentReducer, initialExperimentState, missionForStage, nextPracticeCard } from './domain/experimentState';
import { RecommendationFeed } from './features/feed/RecommendationFeed';
import { RuleTransparencyPanel } from './features/transparency/RuleTransparencyPanel';
import { PredictionPanel } from './features/prediction/PredictionPanel';
import { DistributionComparison } from './features/comparison/DistributionComparison';
import { CARDS } from './data/cards';
import { SUPPLY_PROFILES } from './data/supplyProfiles';
import { TOPICS } from './data/topics';
import { buildCardExplanation, recommend } from './domain/recommendationEngine';
import { countTopicCards } from './domain/distribution';
import type { CardId, TopicId } from './domain/types';
import type { PredictionAnswer } from './domain/experimentState';

const balancedSupply = SUPPLY_PROFILES.find((supply) => supply.id === 'balanced') ?? (() => {
  throw new Error('균형 공급 프로필이 필요합니다.');
})();
const topicLabel = (topicId: TopicId): string => TOPICS.find((topic) => topic.id === topicId)?.label ?? topicId;

export default function App(): React.JSX.Element {
  const [state, dispatch] = useReducer(experimentReducer, undefined, initialExperimentState);
  const [announcement, setAnnouncement] = useState('');
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
          ) : state.stage === 'exploration' ? (
            <p>미션 3. 탐색 버튼</p>
          ) : (
            <p>다음 활동을 준비하고 있습니다.</p>
          )}
        </section>
      )}
    </AppShell>
  );
}
