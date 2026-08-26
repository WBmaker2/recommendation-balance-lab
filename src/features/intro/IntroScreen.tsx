import {
  FEEDBACK_LOOP_COPY,
  LEARNING_GOALS,
  NON_GOALS,
  PRIVACY_NOTICE,
  UNCOMFORTABLE_CONTENT_GUIDANCE,
} from '../../data/learningCopy';
import { TOPICS } from '../../data/topics';
import { TopicBadge } from '../../components/common/TopicBadge';

export interface IntroScreenProps {
  onStart(): void;
}

const feedbackSentences = FEEDBACK_LOOP_COPY.split(' 선택 기록');

export function IntroScreen({ onStart }: IntroScreenProps): React.JSX.Element {
  return (
    <section aria-labelledby="intro-title">
      <p>초등 5~6학년 · 30~40분</p>
      <h2 id="intro-title">선택이 추천 분포에 남기는 흔적</h2>
      <p>{feedbackSentences[0]}</p>
      <p>선택 기록{feedbackSentences[1]}</p>

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

      <section aria-labelledby="safety-title">
        <h3 id="safety-title">안전하고 정확하게 살펴보기</h3>
        <p>실제 취향·검색 기록·계정 정보를 입력하지 않습니다.</p>
        <p>{PRIVACY_NOTICE}</p>
        <p>가상 실험의 결과를 실제 서비스 전체의 사실로 일반화하지 않습니다.</p>
        <p>{UNCOMFORTABLE_CONTENT_GUIDANCE}</p>
      </section>

      <section aria-labelledby="not-goals-title">
        <h3 id="not-goals-title">이 실험이 아닌 것</h3>
        <ul>
          {NON_GOALS.map((nonGoal) => <li key={nonGoal}>{nonGoal}</li>)}
        </ul>
        <p>기록 오류 검사, 사용 시간 진단, 개별 주장 팩트체크 활동이 아닙니다.</p>
      </section>

      <button type="button" onClick={onStart}>
        실험 시작
      </button>
    </section>
  );
}
