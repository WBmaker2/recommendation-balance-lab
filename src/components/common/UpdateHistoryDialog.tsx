import { useCallback, useEffect, useRef } from 'react';
import type { UpdateEntry } from '../../data/updateHistory';

export interface UpdateHistoryDialogProps {
  entries: readonly UpdateEntry[];
}

export function UpdateHistoryDialog({ entries }: UpdateHistoryDialogProps): React.JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const restoreTriggerFocus = useCallback((): void => {
    triggerRef.current?.focus();
  }, []);

  const closeDialog = useCallback((): void => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (dialog.open && typeof dialog.close === 'function') dialog.close();
    else {
      dialog.removeAttribute('open');
      restoreTriggerFocus();
    }
  }, [restoreTriggerFocus]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const handleClose = (): void => restoreTriggerFocus();
    const handleCancel = (event: Event): void => {
      event.preventDefault();
      closeDialog();
    };
    dialog.addEventListener('close', handleClose);
    dialog.addEventListener('cancel', handleCancel);
    return () => {
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('cancel', handleCancel);
    };
  }, [closeDialog, restoreTriggerFocus]);

  const openDialog = (): void => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(event) => {
          triggerRef.current = event.currentTarget;
          openDialog();
        }}
        style={{ minHeight: '44px', padding: '0.5rem 1rem' }}
      >
        업데이트 내역
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="update-history-title"
        aria-describedby="update-history-description"
        onKeyDown={(event) => {
          if (event.key === 'Escape' && typeof dialogRef.current?.showModal !== 'function') {
            event.preventDefault();
            closeDialog();
          }
        }}
      >
        <h2 id="update-history-title">업데이트 내역</h2>
        <p id="update-history-description">앱의 설계와 개발 변경 사항을 날짜순으로 공개합니다.</p>
        <ol>
          {entries.map((entry) => (
            <li key={`${entry.date}-${entry.category}-${entry.summary}`}>
              <time dateTime={entry.date}>{entry.date}</time>{' '}
              <span>{entry.category}</span>{' '}
              <span>{entry.summary}</span>
            </li>
          ))}
        </ol>
        <button type="button" onClick={closeDialog}>닫기</button>
      </dialog>
    </>
  );
}
