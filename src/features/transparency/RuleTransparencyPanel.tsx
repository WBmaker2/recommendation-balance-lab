import { TOPIC_ORDER, TOPICS } from '../../data/topics';
import type { RecommendationResult } from '../../domain/recommendationEngine';

interface RuleTransparencyPanelProps {
  result: RecommendationResult;
}

export function RuleTransparencyPanel({ result }: RuleTransparencyPanelProps): React.JSX.Element {
  return (
    <section className="evidence-card rule-transparency" aria-labelledby="rule-transparency-title">
      <h3 id="rule-transparency-title">추천 규칙 투명창</h3>
      <p>공급 조건: 균형 공급</p>
      <p>카드 8장을 고정하고, 토큰이 큰 주제부터 결정적 규칙으로 배정합니다. 같은 입력은 같은 목록을 만듭니다.</p>
      <table aria-label="현재 추천 규칙의 주제별 토큰">
        <caption>현재 추천 규칙의 주제별 토큰</caption>
        <thead>
          <tr>
            <th scope="col">주제</th>
            <th scope="col">기본 토큰</th>
            <th scope="col">관심 토큰</th>
            <th scope="col">관심 토큰 × 2</th>
            <th scope="col">다양성 토큰</th>
            <th scope="col">전체 토큰</th>
          </tr>
        </thead>
        <tbody>
          {TOPIC_ORDER.map((topicId) => {
            const topic = TOPICS.find((item) => item.id === topicId);
            const tokens = result.tokenBreakdown[topicId];
            return (
              <tr key={topicId}>
                <th scope="row">{topic?.label ?? topicId}</th>
                <td>{tokens.baseTokens}</td>
                <td>{tokens.interestTokens}</td>
                <td>{tokens.weightedInterestTokens}</td>
                <td>{tokens.diversityTokens}</td>
                <td>{tokens.totalTokens}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
