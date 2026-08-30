import { MISSIONS } from '../../data/missions';
import { missionForStage } from '../../domain/experimentState';
import type { ExperimentStage } from '../../domain/experimentState';

interface StageProgressProps {
  stage: ExperimentStage;
}

export function StageProgress({ stage }: StageProgressProps): React.JSX.Element {
  const currentMission = missionForStage(stage);
  const currentOrder = currentMission?.order ?? (stage === 'intro' ? 0 : MISSIONS.length + 1);

  return (
    <nav className="stage-progress app-header__progress" aria-label="미션 진행">
      <ol>
        {MISSIONS.map((mission) => {
          const state = mission.order < currentOrder ? 'complete' : mission.order === currentOrder ? 'current' : 'upcoming';
          const stateLabel = state === 'complete' ? '완료' : state === 'current' ? '진행 중' : '예정';
          const stateIcon = state === 'complete' ? '✓' : state === 'current' ? '●' : '○';
          return (
            <li
              key={mission.id}
              className={`stage-progress__item stage-progress__item--${state}`}
              data-stage-state={state}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              <span className="stage-progress__icon" aria-hidden="true">{stateIcon}</span>
              <span>미션 {mission.order}. {mission.title}</span>
              <span className="stage-progress__state">{stateLabel}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
