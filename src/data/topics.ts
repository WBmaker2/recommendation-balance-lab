import type { TopicDefinition, TopicId } from '../domain/types';

export const TOPIC_ORDER = ['science', 'art', 'sports', 'nature', 'history'] as const satisfies readonly TopicId[];

export const TOPICS: readonly TopicDefinition[] = [
  { id: 'science', label: '과학', icon: '🔬', pattern: 'dots' },
  { id: 'art', label: '예술', icon: '🎨', pattern: 'diagonal' },
  { id: 'sports', label: '스포츠', icon: '⚽', pattern: 'grid' },
  { id: 'nature', label: '자연', icon: '🍃', pattern: 'waves' },
  { id: 'history', label: '역사', icon: '🏛️', pattern: 'crosshatch' },
];
