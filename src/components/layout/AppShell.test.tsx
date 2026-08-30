import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MODEL_WARNING } from '../../data/learningCopy';
import { AppShell } from './AppShell';

afterEach(cleanup);

describe('AppShell hierarchy', () => {
  it('exposes named landmarks and the header boundary before completion', () => {
    render(<AppShell stage="choice" onReset={vi.fn()}><p>학습 내용</p></AppShell>);

    expect(screen.getByTestId('app-shell')).toHaveClass('app-shell');
    expect(screen.getByTestId('app-shell')).toHaveAttribute('data-motion-profile', 'subtle');
    expect(screen.getByRole('banner')).toHaveClass('app-header');
    expect(screen.getByRole('main')).toHaveClass('app-main');
    expect(screen.getByRole('contentinfo')).toHaveClass('app-footer');
    expect(screen.getByTestId('app-shell').querySelector('.app-header__boundary')).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: '가상 모델 안내' })).toHaveClass('model-boundary');
    expect(screen.getAllByText(MODEL_WARNING)).toHaveLength(1);
  });

  it('leaves completion boundary messaging to the completion surface', () => {
    render(<AppShell stage="complete" onReset={vi.fn()}><p>{MODEL_WARNING}</p></AppShell>);

    expect(screen.queryByRole('complementary', { name: '가상 모델 안내' })).not.toBeInTheDocument();
    expect(screen.getAllByText(MODEL_WARNING)).toHaveLength(1);
    expect(screen.queryByRole('button', { name: '기록 지우기' })).not.toBeInTheDocument();
  });
});
