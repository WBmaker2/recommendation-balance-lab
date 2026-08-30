import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { DistributionDelta } from '../../domain/distribution';
import { DistributionTable } from './DistributionTable';

afterEach(cleanup);

const delta: DistributionDelta = {
  before: { science: 2, art: 2, sports: 2, nature: 1, history: 1 },
  after: { science: 3, art: 2, sports: 1, nature: 1, history: 1 },
  delta: { science: 1, art: 0, sports: -1, nature: 0, history: 0 },
  beforeVariety: 5,
  afterVariety: 5,
  missingTopics: [],
};

describe('DistributionTable', () => {
  it('marks evidence numbers for tabular formatting', () => {
    render(<DistributionTable delta={delta} />);

    const table = screen.getByRole('table', { name: '추천 주제 분포 전후 비교' });
    expect(table).toHaveClass('data-table');
    expect(table).toHaveAttribute('data-number-format', 'tabular');
  });
});
