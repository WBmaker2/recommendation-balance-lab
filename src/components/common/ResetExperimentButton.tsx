import { useRef, useState } from 'react';

interface ResetExperimentButtonProps {
  onReset(): void;
}

export function ResetExperimentButton({ onReset }: ResetExperimentButtonProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const confirmGuard = useRef(false);

  const openDialog = (): void => {
    confirmGuard.current = false;
    setIsConfirming(false);
    setIsOpen(true);
  };

  const confirmReset = (): void => {
    if (confirmGuard.current) return;
    confirmGuard.current = true;
    setIsConfirming(true);
    setIsOpen(false);
    onReset();
  };

  return (
    <>
      <button type="button" onClick={openDialog}>
        기록 지우기
      </button>
      {isOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-dialog-title"
        >
          <h2 id="reset-dialog-title">실험 기록 지우기 확인</h2>
          <p>이 기록은 어디에도 전송되거나 저장되지 않았습니다.</p>
          <p>지금 화면의 실험 상태를 지우고 처음으로 돌아갈까요?</p>
          <button type="button" onClick={() => setIsOpen(false)}>
            취소
          </button>
          <button type="button" disabled={isConfirming} onClick={confirmReset}>
            기록을 지우고 처음으로
          </button>
        </div>
      ) : null}
    </>
  );
}
