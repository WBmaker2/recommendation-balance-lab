export type TopicId = 'science' | 'art' | 'sports' | 'nature' | 'history';

export type CardId = `${TopicId}-${number}`;

export type DiversityLevel = 0 | 1 | 2;

export type MemoryMode = 'keep' | 'clear';

export type SupplyProfileId = 'balanced' | 'nature-rich';

export type LearningPurpose = 'discover' | 'deepen';

export type InfluenceFactor = 'choice-record' | 'balance-setting' | 'supply-condition';

export type TopicPattern = 'dots' | 'diagonal' | 'grid' | 'waves' | 'crosshatch';

export type MissionId =
  | 'selection-trace'
  | 'narrowed-window'
  | 'exploration'
  | 'balance-adjustment'
  | 'model-audit';

export type MissionCompletionRule =
  | 'three-same-topic-selections'
  | 'correct-distribution-reading'
  | 'one-non-focus-exploration'
  | 'three-distinct-snapshots'
  | 'supply-factor-identified';

export type CurriculumCode = '6실05-05' | '6실05-04' | 'digital-citizenship';

export type TopicCounts = Record<TopicId, number>;

export type InterestRecord = Record<TopicId, number>;

export interface TopicDefinition {
  id: TopicId;
  label: string;
  icon: string;
  pattern: TopicPattern;
}

export interface ContentCard {
  id: CardId;
  topicId: TopicId;
  title: string;
  summary: string;
}

export interface MissionDefinition {
  id: MissionId;
  order: 1 | 2 | 3 | 4 | 5;
  title: string;
  activity: string;
  coreQuestion: string;
  completionRule: MissionCompletionRule;
}

export interface SupplyProfile {
  id: SupplyProfileId;
  label: string;
  baseTokens: TopicCounts;
  candidateCardIds: readonly CardId[];
}

export interface CurriculumLink {
  code: CurriculumCode;
  description: string;
}

export interface ContentIssue {
  code:
    | 'duplicate-card-id'
    | 'topic-set-mismatch'
    | 'topic-card-count'
    | 'unknown-candidate'
    | 'insufficient-candidates'
    | 'missing-topic-display'
    | 'empty-mission-question';
  path: string;
  message: string;
}
