import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TopicCountSummary } from './TopicCountSummary';

afterEach(cleanup);

describe('TopicCountSummary', () => {
  it('shows all five topics, counts, relative bars, and accessible summaries', () => {
    render(<TopicCountSummary label="추천 목록 요약" counts={{ science: 3, art: 1, sports: 0, nature: 2, history: 8 }} />);

    expect(screen.getByRole('region', { name: '추천 목록 요약' })).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar')).toHaveLength(5);
    expect(screen.getByText('과학')).toBeInTheDocument();
    expect(screen.getByText('예술')).toBeInTheDocument();
    expect(screen.getByText('스포츠')).toBeInTheDocument();
    expect(screen.getByText('자연')).toBeInTheDocument();
    expect(screen.getByText('역사')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: '과학 카드 수 3장' })).toHaveAttribute('aria-valuenow', '3');
    expect(screen.getByRole('progressbar', { name: '역사 카드 수 8장' })).toHaveAttribute('aria-valuenow', '8');
    expect(screen.getByRole('progressbar', { name: '스포츠 카드 수 0장' })).toHaveAttribute('aria-valuenow', '0');
  });
});
