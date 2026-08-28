import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MODEL_WARNING, PRIVACY_NOTICE, UNCOMFORTABLE_CONTENT_GUIDANCE } from '../../data/learningCopy';
import { IntroScreen } from './IntroScreen';

describe('IntroScreen 안전 안내', () => {
  it('shows privacy, model, and uncomfortable-content guidance exactly where expected', () => {
    render(<IntroScreen onStart={() => undefined} />);

    expect(screen.getAllByText(PRIVACY_NOTICE)).toHaveLength(1);
    expect(screen.getByText('가상 실험의 결과를 실제 서비스 전체의 사실로 일반화하지 않습니다.')).toBeInTheDocument();
    expect(screen.getByText(UNCOMFORTABLE_CONTENT_GUIDANCE)).toBeInTheDocument();
    expect(screen.queryByText(MODEL_WARNING)).not.toBeInTheDocument();
  });
});
