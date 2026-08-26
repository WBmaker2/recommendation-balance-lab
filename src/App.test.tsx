import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';
import { LEARNING_GOALS, MODEL_WARNING } from './data/learningCopy';
import { MISSIONS } from './data/missions';
import { TOPICS } from './data/topics';

afterEach(cleanup);

describe('추천 알고리즘 균형 실험실 시작 화면', () => {
  it('학습 대상과 피드백 고리, 비목표와 개인정보 경계를 안내한다', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: '추천 알고리즘 균형 실험실' })).toBeInTheDocument();
    expect(screen.getByText('초등 5~6학년 · 30~40분')).toBeInTheDocument();
    expect(screen.getByText('선택과 추천 분포 사이의 피드백 고리를 살펴봅니다.')).toBeInTheDocument();
    expect(screen.getByText('기록 오류 검사, 사용 시간 진단, 개별 주장 팩트체크 활동이 아닙니다.')).toBeInTheDocument();
    expect(screen.getByText('실제 취향·검색 기록·계정 정보를 입력하지 않습니다.')).toBeInTheDocument();
    expect(screen.getByText(MODEL_WARNING)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '실험 시작' })).toBeEnabled();

    for (const goal of LEARNING_GOALS) {
      expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toContain(goal);
    }
    for (const topic of TOPICS) {
      expect(screen.getByText(topic.label)).toBeInTheDocument();
    }
    expect(screen.getByText('실제 추천 플랫폼의 동작이나 성능을 재현하지 않습니다.')).toBeInTheDocument();
    expect(screen.getByText('사용 습관이나 중독 여부를 진단하지 않습니다.')).toBeInTheDocument();
    expect(screen.getByText('실제 사용자 기록·쿠키·계정 정보를 수집하거나 온라인으로 공유하지 않습니다.')).toBeInTheDocument();
  });

  it('접근 가능한 랜드마크와 건너뛰기 링크, 전체 미션 진행을 제공한다', () => {
    render(<App />);

    expect(screen.getAllByRole('banner')).toHaveLength(1);
    expect(screen.getByRole('navigation', { name: '미션 진행' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '본문으로 건너뛰기' })).toHaveAttribute('href', '#main-content');

    for (const mission of MISSIONS) {
      expect(screen.getByText(`미션 ${mission.order}. ${mission.title}`)).toBeInTheDocument();
    }
    expect(screen.getAllByRole('listitem').filter((item) => item.getAttribute('aria-current'))).toHaveLength(0);
  });

  it('시작하면 미션 1만 현재 단계가 되고 모델 경계는 남는다', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByRole('button', { name: '기록 지우기' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '실험 시작' }));

    expect(screen.getByText('미션 1을 시작해 보세요.')).toBeInTheDocument();
    const currentMissions = screen.getAllByRole('listitem').filter((item) => item.getAttribute('aria-current') === 'step');
    expect(currentMissions).toHaveLength(1);
    expect(currentMissions[0]).toHaveTextContent('미션 1. 선택의 흔적');
    expect(screen.getByText(MODEL_WARNING)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '기록 지우기' })).toBeInTheDocument();
  });

  it('기록 지우기 취소는 현재 단계를 유지하고 확인은 처음으로 돌아간다', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '실험 시작' }));
    await user.click(screen.getByRole('button', { name: '기록 지우기' }));
    expect(screen.getByRole('dialog', { name: '실험 기록 지우기 확인' })).toBeInTheDocument();
    expect(screen.getByText('이 기록은 어디에도 전송되거나 저장되지 않았습니다.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('미션 1을 시작해 보세요.')).toBeInTheDocument();
    expect(screen.getByText(MODEL_WARNING)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '기록 지우기' }));
    await user.click(screen.getByRole('button', { name: '기록을 지우고 처음으로' }));
    expect(screen.getByRole('button', { name: '실험 시작' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '기록 지우기' })).not.toBeInTheDocument();
    expect(screen.getByText(MODEL_WARNING)).toBeInTheDocument();
  });
});
