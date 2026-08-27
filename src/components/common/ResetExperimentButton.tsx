import { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface ResetExperimentButtonProps {
  onReset(): void;
}

export function ResetExperimentButton({ onReset }: ResetExperimentButtonProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const confirmGuard = useRef(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const onResetRef = useRef(onReset);

  useEffect(() => {
    onResetRef.current = onReset;
  }, [onReset]);

  const restoreTrigger = (): void => {
    triggerRef.current?.focus();
  };

  useLayoutEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    try {
      if (typeof dialog.showModal === 'function' && !dialog.open) dialog.showModal();
      else if (!dialog.open) dialog.setAttribute('open', '');
    } catch {
      dialog.setAttribute('open', '');
    }
    cancelRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const controls = (): HTMLButtonElement[] => Array.from(dialog.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));
    const closeDialog = (): void => {
      if (dialog.open && typeof dialog.close === 'function') dialog.close();
      else {
        dialog.removeAttribute('open');
        setIsOpen(false);
        restoreTrigger();
      }
    };
    const handleClose = (): void => {
      setIsOpen(false);
      restoreTrigger();
    };
    const handleCancel = (event: Event): void => {
      event.preventDefault();
      closeDialog();
    };
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && typeof dialog.showModal !== 'function') {
        event.preventDefault();
        closeDialog();
        return;
      }
      if (event.key !== 'Tab') return;
      const buttons = controls();
      const first = buttons[0] ?? dialog;
      const last = buttons[buttons.length - 1] ?? dialog;
      const active = document.activeElement;
      if (event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && (active === first || active === dialog || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || active === dialog || !dialog.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener('close', handleClose);
    dialog.addEventListener('cancel', handleCancel);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('cancel', handleCancel);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const openDialog = (): void => {
    confirmGuard.current = false;
    setIsConfirming(false);
    setIsOpen(true);
  };

  const confirmReset = (): void => {
    if (confirmGuard.current) return;
    confirmGuard.current = true;
    setIsConfirming(true);
    const dialog = dialogRef.current;
    if (dialog?.open && typeof dialog.close === 'function') dialog.close();
    else {
      setIsOpen(false);
      restoreTrigger();
    }
    onResetRef.current();
  };

  return (
    <>
      <button ref={triggerRef} type="button" onClick={openDialog}>
        기록 지우기
      </button>
      {isOpen ? (
        <dialog
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-dialog-title"
        >
          <h2 id="reset-dialog-title">실험 기록 지우기 확인</h2>
          <p>이 기록은 어디에도 전송되거나 저장되지 않았습니다.</p>
          <p>지금 화면의 실험 상태를 지우고 처음으로 돌아갈까요?</p>
          <button ref={cancelRef} type="button" onClick={() => dialogRef.current?.dispatchEvent(new Event('cancel', { cancelable: true }))}>
            취소
          </button>
          <button type="button" disabled={isConfirming} onClick={confirmReset}>
            기록을 지우고 처음으로
          </button>
        </dialog>
      ) : null}
    </>
  );
}
