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
      <p className="rule-transparency__hint">토큰은 주제마다 붙는 점수예요. 관심을 보인 주제와 다른 주제를 보여 주는 점수가 카드 8장 배분에 쓰여요.</p>
      <p>카드 8장을 정해진 순서로 나누기 때문에 같은 입력이면 같은 목록이 나와요.</p>
      <details>
        <summary>토큰 계산표 자세히 보기</summary>
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
      </details>
    </section>
  );
}
