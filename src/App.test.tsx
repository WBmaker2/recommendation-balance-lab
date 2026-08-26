import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('앱 시작 화면', () => {
  it('추천 알고리즘 균형 실험실과 모델 경계를 안내한다', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: '추천 알고리즘 균형 실험실' })).toBeInTheDocument();
    expect(screen.getByText('가상의 단순 규칙이며 실제 서비스 추천을 판정하지 않습니다')).toBeInTheDocument();
  });
});
