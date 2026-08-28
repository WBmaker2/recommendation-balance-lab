import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { SUPPLY_PROFILES } from '../../data/supplyProfiles';
import { TOPICS } from '../../data/topics';
import type { RecommendationExplanation } from '../../domain/recommendationEngine';

interface WhyThisCardDialogProps {
  explanation: RecommendationExplanation;
  onClose(): void;
}

const focusWithoutScroll = (element: HTMLElement | null): void => {
  element?.focus({ preventScroll: true });
};

export function WhyThisCardDialog({ explanation, onClose }: WhyThisCardDialogProps): React.JSX.Element {
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const topic = TOPICS.find((item) => item.id === explanation.topicId);
  const supply = SUPPLY_PROFILES.find((item) => item.id === explanation.supplyProfileId);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useLayoutEffect(() => {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    focusWithoutScroll(dialog);
    const focusableControls = (): HTMLElement[] => Array.from(
      dialog.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
    ).filter((element) => !element.hasAttribute('disabled'));
    const restoreTrigger = (): void => {
      onCloseRef.current();
      focusWithoutScroll(triggerRef.current);
    };
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        restoreTrigger();
        return;
      }
      if (event.key !== 'Tab') return;
      const controls = focusableControls();
      const first = controls[0] ?? dialog;
      const last = controls[controls.length - 1] ?? dialog;
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        focusWithoutScroll(dialog);
      } else if (event.shiftKey && (active === dialog || !dialog.contains(active))) {
        event.preventDefault();
        focusWithoutScroll(last);
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        focusWithoutScroll(dialog);
      } else if (!event.shiftKey && (active === dialog || !dialog.contains(active))) {
        event.preventDefault();
        focusWithoutScroll(first);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recommendation-reason-title"
      data-dialog="card-reason"
      tabIndex={-1}
    >
      <h2 id="recommendation-reason-title">추천 이유</h2>
      <p>관심을 보인 주제에 점수를 더해 이 카드가 먼저 보였어요.</p>
      <p>{topic?.label ?? explanation.topicId} 주제에 관심을 보인 기록이 추천에 반영되었어요.</p>
      <ul>
        <li>관심 토큰 {explanation.interestTokens}개: 관심을 보인 만큼 더해지는 점수예요.</li>
        <li>다양성 토큰 {explanation.diversityTokens}개: 다른 주제도 볼 수 있게 보태는 점수예요.</li>
      </ul>
      <details onToggle={(event) => setDetailsOpen(event.currentTarget.open)}>
        <summary>자세한 계산 보기</summary>
        {detailsOpen ? (
          <>
            <dl>
              <div><dt>기본 토큰</dt><dd>{explanation.baseTokens}개</dd></div>
              <div><dt>관심 토큰</dt><dd>{explanation.interestTokens}개</dd></div>
              <div><dt>관심 토큰 × 2</dt><dd>{explanation.weightedInterestTokens}개</dd></div>
              <div><dt>다양성 토큰</dt><dd>{explanation.diversityTokens}개</dd></div>
              <div><dt>전체 토큰</dt><dd>{explanation.totalTokens}개</dd></div>
              <div><dt>이 주제에 배정된 카드 수</dt><dd>{explanation.allocatedTopicCards}장</dd></div>
              <div><dt>공급 프로필</dt><dd>{supply?.label ?? explanation.supplyProfileId}</dd></div>
            </dl>
            <p>결정적 순서 규칙: {explanation.deterministicPositionRule}</p>
          </>
        ) : null}
      </details>
      <p>{explanation.limitation}</p>
      <button type="button" onClick={() => { onCloseRef.current(); focusWithoutScroll(triggerRef.current); }}>닫기</button>
    </div>
  );
}
