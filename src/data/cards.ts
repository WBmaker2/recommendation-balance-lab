import type { CardId, ContentCard, TopicId } from '../domain/types';
import { TOPIC_ORDER } from './topics';

const TITLES: Record<TopicId, readonly string[]> = {
  science: ['달의 모양 기록', '소리의 떨림', '자석의 힘', '빛의 길', '물의 상태 변화', '식물의 성장', '간단한 전기 회로', '그림자 길이'],
  art: ['색의 느낌', '종이 무늬', '리듬 만들기', '점과 선의 표현', '찰흙 모양', '이야기 그림', '생활 속 디자인', '전통 문양'],
  sports: ['공 던지기', '균형 잡기', '이어달리기', '줄넘기 리듬', '안전한 준비 운동', '협동 공놀이', '목표 세우기', '경기 규칙'],
  nature: ['숲의 층', '도시의 새', '계절의 꽃', '강가 생물', '날씨 관찰', '흙 속 생물', '씨앗의 이동', '별자리 찾기'],
  history: ['옛날 학교', '생활 도구 변화', '마을 지도', '문화유산 지키기', '시간을 재는 도구', '옛 교통수단', '기록으로 보는 하루', '전통 시장'],
};

const createCards = (topicId: TopicId): readonly ContentCard[] =>
  TITLES[topicId].map((title, index) => ({
    id: `${topicId}-${index + 1}` as CardId,
    topicId,
    title,
    summary: `실험에서 살펴보는 중립적인 ${title} 카드입니다.`,
  }));

export const CARDS: readonly ContentCard[] = TOPIC_ORDER.flatMap(createCards);
