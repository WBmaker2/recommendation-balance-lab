import { useRef, useState } from 'react';
import { CARDS } from '../../data/cards';
import { SUPPLY_PROFILES } from '../../data/supplyProfiles';
import { TOPIC_ORDER, TOPICS } from '../../data/topics';
import { countSupplyCandidates, type AuditPair } from '../../domain/auditComparison';
import { countTopicCards } from '../../domain/distribution';
import type { InfluenceFactor, SupplyProfile, TopicId } from '../../domain/types';
import { TopicCountSummary } from '../../components/common/TopicCountSummary';

export interface SupplyAuditPanelProps {
  pair: AuditPair;
  onAnswer(factor: InfluenceFactor): void;
}

const findSupply = (id: SupplyProfile['id']): SupplyProfile => {
  const supply = SUPPLY_PROFILES.find((item) => item.id === id);
  if (!supply) throw new Error('감사 비교 공급 프로필이 올바르지 않습니다.');
  return supply;
};

interface EvidenceTableProps {
  result: AuditPair['balanced'];
  heading: string;
}

function EvidenceTable({ result, heading }: EvidenceTableProps): React.JSX.Element {
  const supply = findSupply(result.request.supplyProfileId);
  const candidateCounts = countSupplyCandidates(CARDS, supply);
  const resultCounts = countTopicCards(result.cards);
  return (
    <section aria-labelledby={`${result.request.supplyProfileId}-audit-title`}>
      <h4 id={`${result.request.supplyProfileId}-audit-title`}>{heading}</h4>
      <table aria-label={`${heading} 표`}>
        <caption>{heading}</caption>
        <thead>
          <tr>
            <th scope="col">주제</th>
            <th scope="col">후보 카드 수</th>
            <th scope="col">기본 토큰</th>
            <th scope="col">결과 카드 수</th>
          </tr>
        </thead>
        <tbody>
          {TOPIC_ORDER.map((topicId: TopicId) => {
            const topic = TOPICS.find((item) => item.id === topicId);
            if (!topic) throw new Error('감사 표 주제 정의가 올바르지 않습니다.');
            return (
              <tr key={topicId}>
                <th scope="row">{topic.icon} {topic.label}</th>
                <td>{candidateCounts[topicId]}장</td>
                <td>{supply.baseTokens[topicId]}</td>
                <td>{resultCounts[topicId]}장</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export function SupplyAuditPanel({ pair, onAnswer }: SupplyAuditPanelProps): React.JSX.Element {
  const [selected, setSelected] = useState<InfluenceFactor | null>(null);
  const answerLock = useRef(false);
  const handleSubmit = (): void => {
    if (!selected || (selected === 'supply-condition' && answerLock.current)) return;
    if (selected === 'supply-condition') answerLock.current = true;
    onAnswer(selected);
  };
  return (
    <section className="action-panel supply-audit" aria-labelledby="supply-audit-title">
      <h3 id="supply-audit-title">공급 조건 모델 감사</h3>
      <p>선택과 설정은 같고, 공급 목록의 기본 토큰만 달라졌습니다.</p>
      <p>사용자 선택은 여러 영향 요인 가운데 하나이며, 이 비교에서는 콘텐츠 공급만 바뀌었습니다.</p>
      <div>
        <TopicCountSummary label="균형 공급 카드 수 요약" counts={countTopicCards(pair.balanced.cards)} />
        <TopicCountSummary label="자연 풍부 공급 카드 수 요약" counts={countTopicCards(pair.natureRich.cards)} />
        <details>
          <summary>자세한 근거 보기</summary>
          <EvidenceTable result={pair.balanced} heading="균형 공급 결과" />
          <EvidenceTable result={pair.natureRich} heading="자연 풍부 공급 결과" />
        </details>
      </div>
      <fieldset>
        <legend>어떤 조건이 달라졌나요?</legend>
        <label>
          <input
            type="radio"
            name="어떤 조건이 달라졌나요?"
            value="choice-record"
            checked={selected === 'choice-record'}
            onChange={() => setSelected('choice-record')}
          />
          선택 기록
        </label>
        <label>
          <input
            type="radio"
            name="어떤 조건이 달라졌나요?"
            value="balance-setting"
            checked={selected === 'balance-setting'}
            onChange={() => setSelected('balance-setting')}
          />
          다양성 설정
        </label>
        <label>
          <input
            type="radio"
            name="어떤 조건이 달라졌나요?"
            value="supply-condition"
            checked={selected === 'supply-condition'}
            onChange={() => setSelected('supply-condition')}
          />
          콘텐츠 공급
        </label>
      </fieldset>
      {selected && selected !== 'supply-condition' ? (
        <p role="status">선택과 설정은 같았습니다. 바뀐 공급 조건을 다시 찾아보세요.</p>
      ) : null}
      <button type="button" onClick={handleSubmit} disabled={!selected}>변화 원인 확인</button>
    </section>
  );
}
