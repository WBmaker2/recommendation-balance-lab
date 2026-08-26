import { useRef, useState } from 'react';
import { canCompareBalance, type BalanceConfig, type BalanceSnapshot } from '../../domain/balanceScenarios';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface BalanceControlPanelProps {
  config: BalanceConfig;
  snapshots: readonly BalanceSnapshot[];
  onConfigChange(config: BalanceConfig): void;
  onSave(): void;
  onCompare(): void;
}

const labels = ['관심 중심(0)', '균형 더하기(1)', '다양성 더하기(2)'] as const;

export function BalanceControlPanel({
  config,
  snapshots,
  onConfigChange,
  onSave,
  onCompare,
}: BalanceControlPanelProps): React.JSX.Element {
  const compareReady = canCompareBalance(snapshots);
  const reducedMotion = useReducedMotion();
  const [compareTriggered, setCompareTriggered] = useState(false);
  const compareLock = useRef(false);
  const duplicate = snapshots.some(
    (snapshot) => snapshot.config.diversityLevel === config.diversityLevel && snapshot.config.memoryMode === config.memoryMode,
  );
  const saveDisabled = duplicate || snapshots.length >= 3;
  const saveReason = snapshots.length >= 3 ? '세 개의 설정만 저장할 수 있습니다.' : duplicate ? '이미 저장한 설정입니다.' : '';
  const handleCompare = (): void => {
    if (!compareReady || compareLock.current) return;
    compareLock.current = true;
    setCompareTriggered(true);
    onCompare();
  };

  return (
    <section aria-labelledby="balance-control-title">
      <h3 id="balance-control-title">균형 조절대</h3>
      <p>새로운 주제를 찾기와 이미 아는 주제를 깊게 보기는 서로 다른 설정 비교 근거가 될 수 있습니다.</p>
      <p>하나의 가장 좋은 비율을 정답으로 두지 않습니다.</p>
      <label htmlFor="diversity-level">다양성 토큰 설정</label>
      <input
        id="diversity-level"
        name="다양성 토큰 설정"
        type="range"
        min="0"
        max="2"
        step="1"
        value={config.diversityLevel}
        onChange={(event) => onConfigChange({ ...config, diversityLevel: Number(event.target.value) as BalanceConfig['diversityLevel'] })}
      />
      <div aria-label="다양성 토큰 설정 단계">
        {labels.map((label) => <span key={label}>{label}</span>)}
      </div>
      <fieldset>
        <legend>관심 기록 설정</legend>
        <label>
          <input
            type="radio"
            name="관심 기록 설정"
            value="keep"
            checked={config.memoryMode === 'keep'}
            onChange={() => onConfigChange({ ...config, memoryMode: 'keep' })}
          />
          관심 기록 유지
        </label>
        <label>
          <input
            type="radio"
            name="관심 기록 설정"
            value="clear"
            checked={config.memoryMode === 'clear'}
            onChange={() => onConfigChange({ ...config, memoryMode: 'clear' })}
          />
          관심 기록 비우기
        </label>
      </fieldset>
      <p>현재 설정: 다양성 {config.diversityLevel}, 관심 기록 {config.memoryMode === 'keep' ? '유지' : '비우기'}</p>
      <button type="button" onClick={onSave} disabled={saveDisabled}>현재 설정 저장</button>
      {saveReason ? <p role="status">{saveReason}</p> : null}
      <button
        type="button"
        onClick={handleCompare}
        disabled={!compareReady || compareTriggered}
        data-gi-pulse={compareReady && !compareTriggered && !reducedMotion ? 'true' : 'false'}
        className={compareReady && !compareTriggered && !reducedMotion ? 'gi-pulse' : undefined}
      >
        <span className="gi-pulse__label">균형 비교</span>
      </button>
      {compareReady && !compareTriggered && reducedMotion ? <p className="gi-pulse__label motion-static-label">지금 할 차례</p> : null}
      <p>서로 다른 설정 {snapshots.length}/3개 저장됨</p>
    </section>
  );
}
