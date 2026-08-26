import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { ResetExperimentButton } from './components/common/ResetExperimentButton';
import { LEARNING_GOALS, MODEL_WARNING } from './data/learningCopy';
import { MISSIONS } from './data/missions';
import { TOPICS } from './data/topics';
import { CARDS } from './data/cards';
import { SUPPLY_PROFILES } from './data/supplyProfiles';
import { recommend, type RecommendationResult } from './domain/recommendationEngine';
import { DistributionComparison } from './features/comparison/DistributionComparison';

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

  it('같은 확인 버튼을 동기적으로 두 번 눌러도 초기화 callback은 한 번만 호출한다', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(<ResetExperimentButton onReset={onReset} />);

    await user.click(screen.getByRole('button', { name: '기록 지우기' }));
    await user.click(screen.getByRole('button', { name: '취소' }));
    expect(onReset).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '기록 지우기' }));
    const confirmButton = screen.getByRole('button', { name: '기록을 지우고 처음으로' });

    act(() => {
      confirmButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      confirmButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '기록 지우기' }));
    await user.click(screen.getByRole('button', { name: '기록을 지우고 처음으로' }));
    expect(onReset).toHaveBeenCalledTimes(2);
  });
});

describe('미션 1: 반복 선택과 다음 목록 예측', () => {
  it('여덟 장 피드와 선택 이유를 보여 준다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '실험 시작' }));

    expect(screen.getAllByRole('article', { name: /추천 카드/ })).toHaveLength(8);
    expect(screen.getAllByRole('button', { name: '이 카드 선택' })).toHaveLength(8);
    expect(screen.getAllByRole('button', { name: '왜 이 카드가 나왔나요?' })).toHaveLength(8);
    await user.click(screen.getAllByRole('button', { name: '왜 이 카드가 나왔나요?' })[0]);
    const dialog = screen.getByRole('dialog', { name: '추천 이유' });
    for (const field of ['기본 토큰', '관심 토큰', '관심 토큰 × 2', '다양성 토큰', '전체 토큰', '이 주제에 배정된 카드 수']) {
      expect(dialog).toHaveTextContent(field);
    }
    expect(dialog).toHaveTextContent('균형 공급');
    expect(dialog).toHaveTextContent('round × 2');
    expect(dialog).toHaveTextContent('가상의 단순 규칙이며 실제 서비스 추천을 판정하지 않습니다');
    expect(dialog).not.toHaveTextContent(/확률|신뢰도|정확도|참여도/);
    await user.click(screen.getByRole('button', { name: '닫기' }));
    expect(screen.queryByRole('dialog', { name: '추천 이유' })).not.toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: '왜 이 카드가 나왔나요?' })[0]);
    expect(screen.getByRole('dialog', { name: '추천 이유' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: '현재 추천 규칙의 주제별 토큰' })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(6);
    for (const heading of ['주제', '기본 토큰', '관심 토큰', '관심 토큰 × 2', '다양성 토큰', '전체 토큰']) {
      expect(screen.getByRole('columnheader', { name: heading })).toBeInTheDocument();
    }
  });

  it('같은 슬롯을 세 번 선택하면 토큰 안내와 예측 gate가 열린다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '실험 시작' }));

    const slot = screen.getAllByRole('article', { name: /추천 카드/ })[0];
    const topic = slot.textContent?.includes('과학') ? '과학' : '주제';
    const firstTitle = slot.textContent;
    const selection = slot.querySelector<HTMLButtonElement>('button');
    expect(selection).not.toBeNull();
    await user.click(selection!);
    expect(screen.getByText('관심 토큰 1개')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(`${topic} 관심 토큰이 1개가 되었습니다`);
    expect(screen.getByRole('button', { name: '다음 목록 예측' })).toBeDisabled();
    expect(slot.textContent).not.toBe(firstTitle);
    expect(document.activeElement).toBe(slot.querySelector('button'));

    await user.click(slot.querySelector<HTMLButtonElement>('button')!);
    expect(screen.getByText('관심 토큰 2개')).toBeInTheDocument();
    expect(document.activeElement).toBe(slot.querySelector('button'));
    await user.click(slot.querySelector<HTMLButtonElement>('button')!);
    expect(screen.getByText('관심 토큰 3개')).toBeInTheDocument();
    expect(document.activeElement).toBe(slot.querySelector('button'));
    await user.click(screen.getAllByRole('radio', { name: '늘어난다' })[0]);
    await user.click(screen.getAllByRole('radio', { name: '줄어든다' })[1]);
    expect(screen.getByRole('button', { name: '다음 목록 예측' })).toHaveAttribute('data-gi-pulse', 'true');
  });

  it('다른 주제 카드는 거부하고 예측은 두 답과 세 선택을 요구한다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '실험 시작' }));
    const articles = screen.getAllByRole('article', { name: /추천 카드/ });
    const firstTopic = articles[0].getAttribute('data-topic-id');
    const other = articles.find((article) => article.getAttribute('data-topic-id') !== firstTopic);
    expect(other).toBeDefined();
    await user.click(articles[0].querySelector<HTMLButtonElement>('button')!);
    await user.click(other!.querySelector<HTMLButtonElement>('button')!);
    expect(screen.getByRole('alert')).toHaveTextContent('같은 주제 카드를 세 번 선택해 주세요.');
    expect(screen.getByText('관심 토큰 1개')).toBeInTheDocument();
  });

  it('세 번 선택하고 두 예측을 고르면 결정적 비교 placeholder로 이동한다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '실험 시작' }));
    const slot = screen.getAllByRole('article', { name: /추천 카드/ })[0];
    for (let count = 0; count < 3; count += 1) {
      await user.click(slot.querySelector<HTMLButtonElement>('button')!);
    }
    const submit = screen.getByRole('button', { name: '다음 목록 예측' });
    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute('data-gi-pulse', 'false');
    await user.click(screen.getAllByRole('radio', { name: '늘어난다' })[0]);
    expect(submit).toBeDisabled();
    await user.click(screen.getAllByRole('radio', { name: '줄어든다' })[1]);
    expect(submit).toBeEnabled();
    expect(submit).toHaveAttribute('data-gi-pulse', 'true');
    await user.click(submit);
    expect(screen.getByText('미션 2 비교 화면을 준비했습니다.')).toBeInTheDocument();
    expect(screen.getByText('과학 5장')).toBeInTheDocument();
  });
});

describe('미션 2: 추천 분포 전후 비교', () => {
  const balanced = SUPPLY_PROFILES.find((profile) => profile.id === 'balanced')!;
  const initial = recommend({
    interest: { science: 0, art: 0, sports: 0, nature: 0, history: 0 },
    diversityLevel: 0,
    memoryMode: 'keep',
    supplyProfileId: 'balanced',
    round: 0,
    feedSize: 8,
  }, CARDS, balanced);
  const scienceHeavy = recommend({
    interest: { science: 3, art: 0, sports: 0, nature: 0, history: 0 },
    diversityLevel: 0,
    memoryMode: 'keep',
    supplyProfileId: 'balanced',
    round: 1,
    feedSize: 8,
  }, CARDS, balanced);

  it('실제 카드의 정수 표를 보여 주고 두 사실을 답하기 전에는 막는다', () => {
    const onCorrect = vi.fn();
    render(<DistributionComparison before={initial} after={scienceHeavy} focusTopicId="science" onCorrect={onCorrect} />);

    expect(screen.getByRole('table', { name: '추천 주제 분포 전후 비교' })).toBeInTheDocument();
    for (const heading of ['주제', '선택 전 카드 수', '선택 후 카드 수', '차이']) {
      expect(screen.getByRole('columnheader', { name: heading })).toBeInTheDocument();
    }
    expect(screen.getByText('과학 카드는 3장 늘고, 나타난 주제는 5개에서 4개로 줄었습니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '분포 문장 확인' })).toBeDisabled();
    const evidence = {
      science: { before: 2, after: 5, delta: '+3장' },
      art: { before: 2, after: 1, delta: '-1장' },
      sports: { before: 2, after: 1, delta: '-1장' },
      nature: { before: 1, after: 1, delta: '0장' },
      history: { before: 1, after: 0, delta: '-1장' },
    } as const;
    for (const [topicId, counts] of Object.entries(evidence)) {
      const beforeCell = document.getElementById(`distribution-${topicId}-before`);
      const afterCell = document.getElementById(`distribution-${topicId}-after`);
      expect(beforeCell).toBeInTheDocument();
      expect(afterCell).toBeInTheDocument();
      expect(beforeCell).toHaveTextContent(`${counts.before}장`);
      expect(afterCell).toHaveTextContent(`${counts.after}장`);
      const beforeBar = beforeCell!.querySelector('[data-distribution-bar="before"]');
      const afterBar = afterCell!.querySelector('[data-distribution-bar="after"]');
      expect(beforeBar).toHaveAttribute('aria-hidden', 'true');
      expect(afterBar).toHaveAttribute('aria-hidden', 'true');
      expect(beforeBar).toHaveStyle({ width: `${(counts.before / 8) * 100}%` });
      expect(afterBar).toHaveStyle({ width: `${(counts.after / 8) * 100}%` });
      expect(within(beforeCell!.closest('tr')!).getByText(counts.delta)).toBeInTheDocument();
    }
    expect(screen.getAllByRole('radio', { name: '늘었다' })).toHaveLength(2);
    expect(screen.getAllByRole('radio', { name: '같다' })).toHaveLength(2);
    expect(screen.getAllByRole('radio', { name: '줄었다' })).toHaveLength(2);
  });

  it('오답은 미션 2에 남아 실제 셀 근거를 제시하고 정답은 미션 3으로 한 번만 연다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '실험 시작' }));
    const slot = screen.getAllByRole('article', { name: /추천 카드/ })[0];
    for (let count = 0; count < 3; count += 1) await user.click(slot.querySelector<HTMLButtonElement>('button')!);
    await user.click(screen.getAllByRole('radio', { name: '늘어난다' })[0]);
    await user.click(screen.getAllByRole('radio', { name: '줄어든다' })[1]);
    await user.click(screen.getByRole('button', { name: '다음 목록 예측' }));

    await user.click(screen.getAllByRole('radio', { name: /^같다$/ })[0]);
    await user.click(screen.getAllByRole('radio', { name: /^같다$/ })[1]);
    await user.click(screen.getByRole('button', { name: '분포 문장 확인' }));
    expect(screen.getByRole('heading', { name: '미션 2. 좁아진 창' })).toBeInTheDocument();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('과학');
    expect(alert).toHaveTextContent('선택 전 2장');
    expect(alert).toHaveTextContent('선택 후 5장');
    expect(alert).toHaveTextContent('나타난 주제: 5개 → 4개');
    expect(alert).toHaveTextContent('좋고 나쁜 비율을 고르는 문제가 아니라 표의 사실을 읽는 활동입니다.');
    expect(screen.getByRole('link', { name: '2장' })).toHaveAttribute('href', '#distribution-science-before');
    expect(screen.getByRole('link', { name: '5장' })).toHaveAttribute('href', '#distribution-science-after');

    await user.click(screen.getAllByRole('radio', { name: /^늘었다$/ })[0]);
    await user.click(screen.getAllByRole('radio', { name: /^줄었다$/ })[1]);
    const submit = screen.getByRole('button', { name: '분포 문장 확인' });
    await user.click(submit);
    expect(screen.getByRole('heading', { name: '미션 3. 탐색 버튼' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '분포 문장 확인' })).not.toBeInTheDocument();
  });

  it('저장된 topicCounts가 달라도 실제 카드 표를 따른다', () => {
    const inconsistent: RecommendationResult = {
      ...initial,
      topicCounts: { science: 8, art: 0, sports: 0, nature: 0, history: 0 },
    };
    render(<DistributionComparison before={inconsistent} after={scienceHeavy} focusTopicId="science" onCorrect={vi.fn()} />);
    expect(document.getElementById('distribution-science-before')).toHaveTextContent('2장');
    expect(document.getElementById('distribution-science-before')).not.toHaveTextContent('8장');
  });
});
