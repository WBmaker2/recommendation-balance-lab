import type { ReactNode } from 'react';
import type { ExperimentStage } from '../../domain/experimentState';
import { ModelBoundaryNotice } from '../common/ModelBoundaryNotice';
import { ResetExperimentButton } from '../common/ResetExperimentButton';
import { UpdateHistoryDialog } from '../common/UpdateHistoryDialog';
import { UPDATE_HISTORY } from '../../data/updateHistory';
import { StageProgress } from './StageProgress';

export interface AppShellProps {
  stage: ExperimentStage;
  onReset(): void;
  children: ReactNode;
}

export function AppShell({ stage, onReset, children }: AppShellProps): React.JSX.Element {
  return (
    <div className="app-shell" data-testid="app-shell" data-motion-profile="subtle">
      <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
      <header className="app-header">
        <div className="app-header__brand">
          <p className="app-header__eyebrow">초등 5~6학년 · 가상 실험</p>
          <h1>추천 알고리즘 균형 실험실</h1>
        </div>
        <StageProgress stage={stage} />
        {stage === 'complete' ? null : <div className="app-header__boundary"><ModelBoundaryNotice /></div>}
        {stage === 'intro' || stage === 'complete' ? null : <ResetExperimentButton onReset={onReset} />}
      </header>
      <main id="main-content" className="app-main" tabIndex={-1}>
        {children}
      </main>
      <footer className="app-footer">
        <p>수업 안에서만 살펴보는 결정적 가상 실험입니다.</p>
        <div className="app-footer__actions">
          <UpdateHistoryDialog entries={UPDATE_HISTORY} />
        </div>
      </footer>
    </div>
  );
}
