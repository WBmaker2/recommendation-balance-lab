import { TOPIC_ORDER, TOPICS } from '../../data/topics';
import { PURPOSE_LABELS } from '../../data/learningCopy';
import { countTopicCards } from '../../domain/distribution';
import type { BalanceSnapshot } from '../../domain/balanceScenarios';

interface ScenarioComparisonProps {
  snapshots: readonly BalanceSnapshot[];
}

const diversityLabel = (level: number): string => ['관심 중심', '균형 더하기', '다양성 더하기'][level] ?? '설정 확인';
const topicLabel = (topicId: string): string => TOPICS.find((topic) => topic.id === topicId)?.label ?? topicId;

export function ScenarioComparison({ snapshots }: ScenarioComparisonProps): React.JSX.Element {
  return (
    <section aria-labelledby="scenario-comparison-title">
      <h3 id="scenario-comparison-title">설정별 추천 목록 비교</h3>
      <p>{PURPOSE_LABELS.discover}와 {PURPOSE_LABELS.deepen}를 서로 다른 설정으로 살펴봅니다.</p>
      <p>관심 기록 비우기는 이전 미션 증거를 삭제하지 않고 이번 계산에서만 관심 토큰을 0으로 둡니다.</p>
      {snapshots.map((snapshot, index) => {
        const counts = countTopicCards(snapshot.result.cards);
        const represented = TOPIC_ORDER.filter((topicId) => counts[topicId] > 0).length;
        const focus = TOPIC_ORDER.reduce((best, topicId) => snapshot.result.request.interest[topicId] > snapshot.result.request.interest[best] ? topicId : best, TOPIC_ORDER[0]);
        return (
          <article key={snapshot.id} aria-labelledby={`scenario-title-${snapshot.id}`}>
            <h4 id={`scenario-title-${snapshot.id}`}>{String.fromCharCode(65 + index)} 설정 · {snapshot.id}</h4>
            <p>다양성 설정: {snapshot.config.diversityLevel} · {diversityLabel(snapshot.config.diversityLevel)}</p>
            <p>관심 기록: {snapshot.config.memoryMode === 'keep' ? '관심 기록 유지' : '관심 기록 비우기'}</p>
            <p>표현된 주제 수: {represented} · 포커스 주제: {topicLabel(focus)} · 포커스 주제 카드 수: {counts[focus]}장</p>
            <table aria-label={`${snapshot.id} 주제별 실제 카드 수`}>
              <caption>{snapshot.id} 주제별 실제 카드 수</caption>
              <thead><tr><th scope="col">주제</th><th scope="col">카드 수</th></tr></thead>
              <tbody>{TOPIC_ORDER.map((topicId) => <tr key={topicId}><th scope="row">{topicLabel(topicId)}</th><td>{counts[topicId]}</td></tr>)}</tbody>
            </table>
            <table aria-label={`${snapshot.id} 정수 토큰 근거`}>
              <caption>{snapshot.id} 정수 토큰 근거</caption>
              <thead><tr><th scope="col">주제</th><th scope="col">전체 토큰</th></tr></thead>
              <tbody>{TOPIC_ORDER.map((topicId) => <tr key={topicId}><th scope="row">{topicLabel(topicId)}</th><td>{snapshot.result.tokenBreakdown[topicId].totalTokens}</td></tr>)}</tbody>
            </table>
            <ul aria-label={`${snapshot.id} 카드 근거`}>
              {snapshot.result.cards.map((card) => <li key={card.id}>{topicLabel(card.topicId)} · {card.title}</li>)}
            </ul>
          </article>
        );
      })}
    </section>
  );
}
