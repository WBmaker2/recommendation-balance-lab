import { useReducer } from 'react';
import { AppShell } from './components/layout/AppShell';
import { IntroScreen } from './features/intro/IntroScreen';
import { experimentReducer, initialExperimentState, missionForStage } from './domain/experimentState';

export default function App(): React.JSX.Element {
  const [state, dispatch] = useReducer(experimentReducer, undefined, initialExperimentState);
  const mission = missionForStage(state.stage);

  return (
    <AppShell stage={state.stage} onReset={() => dispatch({ type: 'RESET' })}>
      {state.stage === 'intro' ? (
        <IntroScreen onStart={() => dispatch({ type: 'START' })} />
      ) : (
        <section aria-labelledby="mission-stage-title">
          <h2 id="mission-stage-title">
            {mission ? `미션 ${mission.order}. ${mission.title}` : '실험 결과'}
          </h2>
          {mission ? <p>미션 {mission.order}을 시작해 보세요.</p> : <p>다음 활동을 준비하고 있습니다.</p>}
        </section>
      )}
    </AppShell>
  );
}
