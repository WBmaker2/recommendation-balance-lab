import type { TopicDefinition } from '../../domain/types';

export interface TopicBadgeProps {
  topic: TopicDefinition;
  decorativeIcon?: boolean;
}

export function TopicBadge({ topic }: TopicBadgeProps): React.JSX.Element {
  return (
    <span className={`topic-badge topic--${topic.id}`} data-pattern={topic.pattern}>
      <span aria-hidden="true">{topic.icon}</span>
      <span>{topic.label}</span>
    </span>
  );
}
