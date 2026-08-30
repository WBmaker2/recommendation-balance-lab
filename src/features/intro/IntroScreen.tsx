import {
  FEEDBACK_LOOP_COPY,
  LEARNING_GOALS,
  NON_GOALS,
  PRIVACY_NOTICE,
  UNCOMFORTABLE_CONTENT_GUIDANCE,
} from '../../data/learningCopy';
import { TOPICS } from '../../data/topics';
import { TopicBadge } from '../../components/common/TopicBadge';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface IntroScreenProps {
  onStart(): void;
}

const feedbackSentences = FEEDBACK_LOOP_COPY.split(' 선택 기록');

export function IntroScreen({ onStart }: IntroScreenProps): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  return (
    <section className="intro-screen" aria-labelledby="intro-title">
      <div className="intro-hero" data-testid="intro-hero">
        <p className="intro-hero__eyebrow">초등 5~6학년 · 30~40분</p>
        <h2 id="intro-title">선택이 추천 분포에 남기는 흔적</h2>
        <p className="intro-hero__question">내가 고른 카드가 다음 추천 목록을 어떻게 바꿀까요?</p>
        <div className="intro-hero__description">
          <p>{feedbackSentences[0]}</p>
          <p>선택 기록{feedbackSentences[1]}</p>
        </div>
        <p className="intro-hero__safety">이 실험은 이 탭 안에서만 진행되고 선택 기록을 저장하거나 보내지 않아요.</p>
        <div className="intro-hero__action">
          {reducedMotion ? <p className="gi-pulse__label motion-static-label">지금 시작할 차례</p> : null}
          <button
            type="button"
            className={reducedMotion ? undefined : 'gi-pulse'}
            data-gi-pulse={reducedMotion ? 'false' : 'true'}
            onClick={onStart}
          >
            <span className="gi-pulse__label">실험 시작</span>
          </button>
        </div>
      </div>

      <section aria-labelledby="goals-title">
        <h3 id="goals-title">이번 실험에서 배울 것</h3>
        <ul>
          {LEARNING_GOALS.map((goal) => <li key={goal}>{goal}</li>)}
        </ul>
      </section>

      <section aria-labelledby="topics-title">
        <h3 id="topics-title">살펴볼 중립 주제</h3>
        <ul>
          {TOPICS.map((topic) => (
            <li key={topic.id}><TopicBadge topic={topic} decorativeIcon /></li>
          ))}
        </ul>
      </section>

      <details className="intro-more">
        <summary>안전하고 정확하게 살펴보기</summary>
        <section aria-labelledby="safety-title">
          <h3 id="safety-title">안전하고 정확하게 살펴보기</h3>
        <p>{PRIVACY_NOTICE}</p>
        <p>가상 실험의 결과를 실제 서비스 전체의 사실로 일반화하지 않습니다.</p>
        <p>{UNCOMFORTABLE_CONTENT_GUIDANCE}</p>
        </section>
      </details>

      <details className="intro-more">
        <summary>이 실험이 아닌 것</summary>
        <section aria-labelledby="not-goals-title">
          <h3 id="not-goals-title">이 실험이 아닌 것</h3>
          <ul>
            {NON_GOALS.map((nonGoal) => <li key={nonGoal}>{nonGoal}</li>)}
          </ul>
          <p>기록 오류 검사, 사용 시간 진단, 개별 주장 팩트체크 활동이 아닙니다.</p>
        </section>
      </details>
    </section>
  );
}
