import { useEffect, useLayoutEffect, useRef } from 'react';
import { SUPPLY_PROFILES } from '../../data/supplyProfiles';
import { TOPICS } from '../../data/topics';
import type { RecommendationExplanation } from '../../domain/recommendationEngine';

interface WhyThisCardDialogProps {
  explanation: RecommendationExplanation;
  onClose(): void;
}

export function WhyThisCardDialog({ explanation, onClose }: WhyThisCardDialogProps): React.JSX.Element {
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const topic = TOPICS.find((item) => item.id === explanation.topicId);
  const supply = SUPPLY_PROFILES.find((item) => item.id === explanation.supplyProfileId);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useLayoutEffect(() => {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    dialog.focus();
    const focusableControls = (): HTMLElement[] => Array.from(
      dialog.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
    ).filter((element) => !element.hasAttribute('disabled'));
    const restoreTrigger = (): void => {
      onCloseRef.current();
      triggerRef.current?.focus();
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
        dialog.focus();
      } else if (event.shiftKey && (active === dialog || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        dialog.focus();
      } else if (!event.shiftKey && (active === dialog || !dialog.contains(active))) {
        event.preventDefault();
        first.focus();
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
      <p>{topic?.label ?? explanation.topicId} 주제의 이 카드가 나온 근거입니다.</p>
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
      <p>{explanation.limitation}</p>
      <button type="button" onClick={() => { onCloseRef.current(); triggerRef.current?.focus(); }}>닫기</button>
    </div>
  );
}
