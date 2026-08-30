import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TOPICS } from '../../data/topics';
import { TopicBadge } from './TopicBadge';

afterEach(cleanup);

describe('TopicBadge', () => {
  it('keeps the topic glyph decorative when the visible label names the topic', () => {
    const topic = TOPICS[0];
    render(<TopicBadge topic={topic} />);

    const label = screen.getByText(topic.label);
    const badge = label.closest('.topic-badge');
    expect(badge).toHaveAttribute('data-pattern', topic.pattern);
    expect(badge).toHaveTextContent(`${topic.icon}${topic.label}`);
    expect(badge?.querySelector('[aria-hidden="true"]')).toHaveTextContent(topic.icon);
  });
});
