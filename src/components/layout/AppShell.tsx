import type { ReactNode } from 'react';
import type { ExperimentStage } from '../../domain/experimentState';
import { ModelBoundaryNotice } from '../common/ModelBoundaryNotice';
import { ResetExperimentButton } from '../common/ResetExperimentButton';
import { StageProgress } from './StageProgress';

export interface AppShellProps {
  stage: ExperimentStage;
  onReset(): void;
  children: ReactNode;
}

export function AppShell({ stage, onReset, children }: AppShellProps): React.JSX.Element {
  return (
    <div>
      <a href="#main-content">본문으로 건너뛰기</a>
      <header>
        <h1>추천 알고리즘 균형 실험실</h1>
        <StageProgress stage={stage} />
        <ModelBoundaryNotice />
        {stage === 'intro' || stage === 'complete' ? null : <ResetExperimentButton onReset={onReset} />}
      </header>
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <footer>
        <p>수업 안에서만 살펴보는 결정적 가상 실험입니다.</p>
      </footer>
    </div>
  );
}
