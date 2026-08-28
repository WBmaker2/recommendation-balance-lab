import type { ReportDraft } from './reportAssessment';

export type ReportRequirementId =
  | 'focus-direction'
  | 'variety-direction'
  | 'acknowledged-factors'
  | 'purpose'
  | 'snapshot'
  | 'metric'
  | 'observed-value'
  | 'limitation';

export interface ReportValidationError {
  id: ReportRequirementId;
  message: string;
  targetId: string;
}

const REQUIRED_FACTORS = ['choice-record', 'balance-setting', 'supply-condition'] as const;

const requirement = (
  id: ReportRequirementId,
  message: string,
  targetId: string,
  missing: boolean,
): ReportValidationError | null => (missing ? { id, message, targetId } : null);

export const getReportValidationErrors = (draft: ReportDraft): readonly ReportValidationError[] => [
  requirement('focus-direction', '포커스 주제 카드 수 변화를 골라 주세요.', 'report-focus-direction', draft.focusDirection === null),
  requirement('variety-direction', '나타난 주제 수 변화를 골라 주세요.', 'report-variety-direction', draft.varietyDirection === null),
  requirement(
    'acknowledged-factors',
    '영향을 준 조건을 모두 골라 주세요.',
    'report-acknowledged-factors',
    REQUIRED_FACTORS.some((factor) => !draft.acknowledgedFactors.includes(factor)),
  ),
  requirement('purpose', '보고서의 목적을 골라 주세요.', 'report-purpose', draft.purpose === null),
  requirement('snapshot', '비교할 설정을 골라 주세요.', 'report-snapshot', draft.chosenSnapshotId === null),
  requirement('metric', '관찰할 지표를 골라 주세요.', 'report-metric', draft.evidenceMetric === null),
  requirement('observed-value', '관찰한 값을 확인해 주세요.', 'report-observed-value', draft.evidenceValue === null),
  requirement('limitation', '모형의 한계를 골라 주세요.', 'report-limitation', draft.limitationChoice === null),
].filter((error): error is ReportValidationError => error !== null);

export const isReportReady = (draft: ReportDraft): boolean => getReportValidationErrors(draft).length === 0;
