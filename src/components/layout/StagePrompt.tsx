import type { ReactNode } from 'react';

export interface StagePromptProps {
  eyebrow?: string;
  title: string;
  description: string;
  completionHint?: string;
  children?: ReactNode;
}

export function StagePrompt({
  eyebrow,
  title,
  description,
  completionHint,
  children,
}: StagePromptProps): React.JSX.Element {
  return (
    <section className="stage-prompt" data-prompt-kind="current-action" aria-labelledby="stage-prompt-title">
      {eyebrow ? <p className="stage-prompt__eyebrow">{eyebrow}</p> : null}
      <h3 id="stage-prompt-title">{title}</h3>
      <p>{description}</p>
      {completionHint ? <p className="stage-prompt__hint">완료 조건: {completionHint}</p> : null}
      {children ? <div className="stage-prompt__action">{children}</div> : null}
    </section>
  );
}
