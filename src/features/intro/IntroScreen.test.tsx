import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MODEL_WARNING, PRIVACY_NOTICE, UNCOMFORTABLE_CONTENT_GUIDANCE } from '../../data/learningCopy';
import { IntroScreen } from './IntroScreen';

afterEach(cleanup);

describe('IntroScreen 안전 안내', () => {
  it('shows privacy, model, and uncomfortable-content guidance exactly where expected', () => {
    render(<IntroScreen onStart={() => undefined} />);

    expect(screen.getAllByText(PRIVACY_NOTICE)).toHaveLength(1);
    expect(screen.getByText('가상 실험의 결과를 실제 서비스 전체의 사실로 일반화하지 않습니다.')).toBeInTheDocument();
    expect(screen.getByText(UNCOMFORTABLE_CONTENT_GUIDANCE)).toBeInTheDocument();
    expect(screen.queryByText(MODEL_WARNING)).not.toBeInTheDocument();
  });

  it('puts the first action in a compact hero and keeps long guidance collapsed', () => {
    render(<IntroScreen onStart={() => undefined} />);

    expect(screen.getByRole('region', { name: '선택이 추천 분포에 남기는 흔적' })).toHaveClass('intro-screen');
    const hero = screen.getByTestId('intro-hero');
    expect(hero).toHaveClass('intro-hero');
    expect(within(hero).getByRole('button', { name: '실험 시작' })).toHaveAttribute('data-gi-pulse', 'true');
    expect(screen.getByText('이 실험은 이 탭 안에서만 진행되고 선택 기록을 저장하거나 보내지 않아요.')).toBeInTheDocument();
    const details = screen.getAllByRole('group');
    expect(details).toHaveLength(2);
    expect(details.every((element) => element.tagName.toLowerCase() === 'details')).toBe(true);
    expect(details.every((element) => !element.hasAttribute('open'))).toBe(true);
    expect(within(details[0]).getByText(PRIVACY_NOTICE)).toBeInTheDocument();
    expect(within(details[0]).getByText(UNCOMFORTABLE_CONTENT_GUIDANCE)).toBeInTheDocument();
  });
});
