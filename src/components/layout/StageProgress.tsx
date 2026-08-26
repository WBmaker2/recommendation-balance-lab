import { MISSIONS } from '../../data/missions';
import { missionForStage } from '../../domain/experimentState';
import type { ExperimentStage } from '../../domain/experimentState';

interface StageProgressProps {
  stage: ExperimentStage;
}

export function StageProgress({ stage }: StageProgressProps): React.JSX.Element {
  const currentMission = missionForStage(stage);

  return (
    <nav aria-label="미션 진행">
      <ol>
        {MISSIONS.map((mission) => (
          <li
            key={mission.id}
            aria-current={currentMission?.id === mission.id ? 'step' : undefined}
          >
            미션 {mission.order}. {mission.title}
          </li>
        ))}
      </ol>
    </nav>
  );
}
