import type {
  ContentCard,
  ContentIssue,
  MissionDefinition,
  SupplyProfile,
  TopicDefinition,
  TopicId,
} from './types';

const APPROVED_TOPIC_IDS = ['science', 'art', 'sports', 'nature', 'history'] as const;
const APPROVED_TOPIC_SET = new Set<string>(APPROVED_TOPIC_IDS);

const isApprovedTopicId = (value: string): value is TopicId => APPROVED_TOPIC_SET.has(value);

const issue = (code: ContentIssue['code'], path: string, message: string): ContentIssue => ({
  code,
  path,
  message,
});

export const validateContent = (
  topics: readonly TopicDefinition[],
  cards: readonly ContentCard[],
  supplies: readonly SupplyProfile[],
  missions: readonly MissionDefinition[],
): readonly ContentIssue[] => {
  const issues: ContentIssue[] = [];
  const topicIds = new Set(topics.map((topic) => topic.id));
  const cardIds = new Set<string>();

  if (topics.length !== APPROVED_TOPIC_IDS.length || APPROVED_TOPIC_IDS.some((id) => !topicIds.has(id)) || [...topicIds].some((id) => !APPROVED_TOPIC_SET.has(id))) {
    issues.push(issue('topic-set-mismatch', 'topics', '승인된 주제 5종과 일치해야 합니다.'));
  }

  for (const topic of topics) {
    if (!topic.label.trim() || !topic.icon.trim() || !topic.pattern.trim()) {
      const missingField = !topic.label.trim() ? 'label' : !topic.icon.trim() ? 'icon' : 'pattern';
      issues.push(issue('missing-topic-display', `topics.${topic.id}.${missingField}`, '주제 이름, 아이콘, 무늬는 비어 있을 수 없습니다.'));
    }
    if (!isApprovedTopicId(topic.id)) {
      issues.push(issue('topic-set-mismatch', `topics.${topic.id}`, '승인되지 않은 주제입니다.'));
    }
  }

  for (const card of cards) {
    if (cardIds.has(card.id)) {
      issues.push(issue('duplicate-card-id', `cards.${card.id}`, '카드 ID가 중복됩니다.'));
    }
    cardIds.add(card.id);
    if (!isApprovedTopicId(card.topicId)) {
      issues.push(issue('topic-set-mismatch', `cards.${card.id}.topicId`, '승인되지 않은 주제의 카드입니다.'));
    }
  }

  for (const topicId of APPROVED_TOPIC_IDS) {
    const count = cards.filter((card) => card.topicId === topicId).length;
    if (count !== 8) {
      issues.push(issue('topic-card-count', `cards.${topicId}`, `주제별 카드 수가 8장이 아닙니다: ${count}장.`));
    }
  }

  for (const supply of supplies) {
    const candidateTopicIds = new Map<TopicId, Set<string>>();
    for (const candidateId of supply.candidateCardIds) {
      const candidate = cards.find((card) => card.id === candidateId);
      if (!candidate) {
        issues.push(issue('unknown-candidate', `supplies.${supply.id}.candidateCardIds`, `존재하지 않는 후보 카드입니다: ${candidateId}.`));
        continue;
      }
      if (isApprovedTopicId(candidate.topicId)) {
        const topicCandidateIds = candidateTopicIds.get(candidate.topicId) ?? new Set<string>();
        topicCandidateIds.add(candidate.id);
        candidateTopicIds.set(candidate.topicId, topicCandidateIds);
      }
    }
    for (const topicId of APPROVED_TOPIC_IDS) {
      if ((candidateTopicIds.get(topicId)?.size ?? 0) < 5) {
        issues.push(issue('insufficient-candidates', `supplies.${supply.id}.candidateCardIds.${topicId}`, '모든 주제에 후보 카드가 최소 5장 필요합니다.'));
      }
    }
  }

  for (const mission of missions) {
    if (!mission.coreQuestion.trim()) {
      issues.push(issue('empty-mission-question', `missions.${mission.id}.coreQuestion`, '미션 핵심 질문은 비어 있을 수 없습니다.'));
    }
  }

  return issues;
};
