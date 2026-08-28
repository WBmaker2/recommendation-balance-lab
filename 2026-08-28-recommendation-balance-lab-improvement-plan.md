# Recommendation Balance Lab Improvement Plan

## Goal

이번 개선의 목표는 초등 5~6학년 학생이 추천 알고리즘 균형 실험실을 처음 열었을 때 다음 세 가지를 막힘없이 이해하고 행동하게 만드는 것입니다.

1. 왜 이 카드와 목록이 나왔는지 어린이용 한 문장으로 이해합니다.
2. 각 미션에서 지금 할 일과 다음 행동을 현재 화면에서 바로 찾습니다.
3. 마지막 보고서에서 실제로 관찰한 카드 수·주제 수·영향 조건을 정확한 말로 설명합니다.

현재 배포된 기능과 결정적 추천 모델, 5개 중립 주제·40개 카드, 선택·설정·공급 조건을 함께 비교하는 학습 목표는 유지합니다. 변경 범위는 학습자용 표현, 흐름 안내, 모바일 밀도, 진행 표시, 오류 피드백, 핵심 버튼 강조, favicon 품질입니다.

## Source of truth and baseline

- 제품 설계: 2026-08-26-recommendation-balance-lab-design.md
- 기존 구현 계획: 2026-08-26-recommendation-balance-lab-implementation-plan.md
- 사용성 검수: .gstack/qa-reports/qa-report-wbmaker2-github-io-recommendation-balance-lab-2026-08-28.md
- 회귀 기준: .gstack/qa-reports/baseline.json
- 검수 URL: https://wbmaker2.github.io/recommendation-balance-lab/
- 기준 커밋: 7e857637ec6cb992f512a0a20959d45dc2a64fa2

기준 상태에서 npm run quality는 lint, typecheck, 스크립트 테스트 6개, Vitest 25개 파일·140개 테스트, 줄 수·경계 검사, production build까지 exit 0입니다. 기준 브라우저 검수는 모바일 가로 넘침 없음, 모달 포커스 복귀 통과, favicon 404 1건, 학습자용 문장·긴 세로 스크롤·보고서 피드백 문제를 확인했습니다.

## Architecture

도메인 계산과 내부 ID는 변경하지 않고, 학습자에게 보이는 표현을 별도 프레젠테이션 계층으로 분리합니다.

    domain calculation
      ├─ RecommendationExplanation, BalanceSnapshot, ReportDraft
      └─ existing reducer and deterministic rules
              ↓
    learner presentation helpers
      ├─ scenarioLabel
      ├─ formatObservedMetric
      ├─ reasonSummary
      └─ report validation messages
              ↓
    feature UI
      ├─ concise summary first
      ├─ details for technical evidence
      ├─ next-task focus/reveal
      └─ mobile visual summaries and progress state

내부 식별자 scenario-a, scenario-b, scenario-c는 상태 검증과 계산에만 남기고 화면 텍스트·accessible name에서는 화면용 이름으로 변환합니다. 계산식은 상세 펼침 안에만 두며, 기본 화면은 관심·다양성·공급 조건이 결과에 영향을 준다는 어린이용 설명을 우선합니다.

## Tech Stack

- Node.js 24.15.0, npm
- React 19.2.8, React DOM 19.2.8
- TypeScript 6.0.3, Vite 8.2.2
- Vitest 4.1.11, Testing Library, user-event
- Playwright 1.62.1, @axe-core/playwright 4.13.0
- 기존 전역 CSS 파일 구조 유지
- 새 외부 패키지, 서버, 브라우저 저장소, 네트워크 API, 분석 SDK를 추가하지 않음

## Spec

### 학습자용 콘텐츠 규칙

- 추천 이유 기본 문장: “관심을 보인 주제에 점수를 더해 이 카드가 먼저 보였어요.”
- 기술 근거: details 요소의 “자세한 계산 보기” 안에서만 토큰 표와 결정적 위치 규칙을 표시합니다.
- 시나리오 표시명: 설정 1, 설정 2, 설정 3. 설정 문맥에서는 관심 중심, 균형 더하기, 다양성 더하기를 함께 표시할 수 있습니다.
- 목적 문장: “새로운 주제를 찾는 목적에서”, “이미 아는 주제를 깊게 보는 목적에서”.
- 단위: 카드 수는 장, 나타난 주제 수는 개. 장(개) 혼합 표기는 금지합니다.
- 모형 경고는 완료 화면에서 한 번만 표시하고, 짧은 한계 문장으로 결과 문장과 분리합니다.
- 개인정보 안내는 실제 취향·검색 기록·계정 정보를 묻거나 전송하지 않는다는 뜻을 한 번만 전달합니다.

### 단계 흐름 규칙

- 미션 1에서 세 번째 카드 선택이 끝나면 예측 패널을 화면에 드러내고 키보드 포커스를 예측 제목으로 이동합니다.
- 이동은 reduced-motion 환경에서 즉시 처리하고, 일반 환경에서도 사용자가 다음 패널을 놓치지 않도록 합니다.
- 빈 모델 보고서 제출 시 첫 번째 누락 묶음의 짧은 오류가 보고서 내부에 보이고, 해당 입력으로 포커스를 이동합니다.
- 탐색 카드 선택 직후 “미션 3 완료”와 관찰 결과를 보여 주고, “다음 미션: 균형 설정”이라는 이유를 안내합니다. 기존 결정적 stage 전이는 유지합니다.

### 시각·반응형 규칙

- StageProgress에 현재·완료·예정 상태를 data-stage-state로 표시하고 텍스트·아이콘·색을 함께 사용합니다.
- 저장 가능한 균형 설정에는 현재 설정 저장 버튼도 gi-pulse를 사용하고, reduced-motion에서는 정적 “지금 저장할 차례” 문구를 표시합니다.
- 균형·감사·보고서 단계는 핵심 숫자를 TopicCountSummary 시각 요약으로 먼저 보여 주고, 긴 근거 표는 details로 접을 수 있게 합니다.
- 375×812에서 현재 행동과 다음 버튼이 첫 두 화면 안에 보이도록 콘텐츠 우선순위를 조정합니다.
- favicon.svg를 정적 public 자산으로 제공하여 콘솔 404를 제거합니다.

## Global Constraints

- 설계 문서의 학습 목표, 선택→추천 분포 피드백 고리, 선택·설정·공급 조건의 인과 구분, 가상 모델 한계를 유지합니다.
- 실제 서비스 추천의 정확도·확률·성능을 주장하지 않고 카드 수·상대 막대·문장으로만 표현합니다.
- 실제 취향·검색 기록·계정·민감 정보·사용 시간·중독 여부를 받거나 저장하거나 전송하지 않습니다.
- 서버·로그인·쿠키·localStorage·sessionStorage·fetch·XMLHttpRequest·sendBeacon·외부 AI·분석 SDK를 추가하지 않습니다.
- 5개 중립 주제, 총 40개 카드, 목록 8장, 결정적 결과, 기존 상태 검증과 리듀서 계약을 유지합니다.
- 모든 주요 조작은 명시적 버튼·라디오·체크박스로 제공하고 44px 이상 터치 영역을 유지합니다.
- 현재 단계 핵심 버튼은 gi-pulse 또는 reduced-motion 정적 안내를 제공해야 합니다.
- VoiceOver 구현과 VoiceOver 검증은 이 계획과 작업에서 제외합니다. 키보드, DOM 의미, axe 자동 검사는 유지합니다.
- src, tests, scripts의 단일 파일은 499줄 이하입니다.
- 수정 후 업데이트 내역에 2026-08-28 개선 날짜와 실제 변경 내용을 추가합니다.
- 사용자 요청이 없으면 Git commit, push, Pages 재배포를 실행하지 않습니다.

## Expected file structure and responsibilities

    2026-08-28-recommendation-balance-lab-improvement-plan.md
    index.html                                  # favicon link
    public/favicon.svg                          # 정적 앱 아이콘
    src/
      data/learningCopy.ts                      # 어린이용 목적·개인정보 문장
      data/learnerPresentation.ts               # 시나리오·지표 표시명/단위
      data/updateHistory.test.ts                # 2026-08-28 업데이트 기록 계약
      domain/reportValidation.ts                # 보고서 누락 묶음과 입력 target
      domain/reportValidation.test.ts
      domain/reportAssessment.ts                # 간결한 완료 문장과 warning 분리
      features/transparency/WhyThisCardDialog.tsx
      features/transparency/whyThisCardFlow.test.tsx
      features/balance/ScenarioComparison.tsx
      features/balance/BalanceControlPanel.tsx
      features/balance/balanceFlow.test.tsx
      features/report/ModelReport.tsx
      features/report/CompletionScreen.tsx
      features/report/reportFlow.test.tsx
      features/exploration/ExplorationOutcome.tsx
      features/experiment/useNextTaskReveal.ts
      features/experiment/useNextTaskReveal.test.tsx
      components/layout/StageProgress.tsx
      components/common/TopicCountSummary.tsx
      styles/components.css
      styles/global.css
      styles/motion.css
      data/updateHistory.ts
      features/intro/IntroScreen.test.tsx       # 개인정보·안전 문장 회귀
    scripts/static-assets.test.mjs              # favicon 정적 자산 계약
    tests/e2e/helpers/completeExperiment.ts     # 표시명과 단위에 맞춘 학습 흐름 선택자

## Interfaces

### src/data/learnerPresentation.ts

    export type LearnerScenarioId = 'scenario-a' | 'scenario-b' | 'scenario-c';
    export type MetricUnit = '장' | '개';
    export const SCENARIO_LABELS: Readonly<Record<LearnerScenarioId, string>>;
    export function scenarioLabel(id: LearnerScenarioId): string;
    export function metricUnit(metric: EvidenceMetric): MetricUnit;
    export function learnerMetricLabel(metric: EvidenceMetric, focusTopicLabel?: string): string;
    export function formatObservedMetric(metric: EvidenceMetric, value: number, focusTopicLabel?: string): string;

### src/domain/reportValidation.ts

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
    export function getReportValidationErrors(draft: ReportDraft): readonly ReportValidationError[];
    export function isReportReady(draft: ReportDraft): boolean;

### src/features/experiment/useNextTaskReveal.ts

    export interface NextTaskRevealOptions {
      active: boolean;
      targetId: string;
    }
    export function useNextTaskReveal(options: NextTaskRevealOptions): void;

세 번째 카드 선택 직후 targetId는 prediction-panel-title로 고정합니다. hook은 대상에 tabIndex=-1이 없으면 feature 컴포넌트에서 제공하도록 하고, focus와 scroll을 한 번만 수행합니다.

### 변경되는 기존 props

    export interface ModelReportProps {
      draft: ReportDraft;
      evidence: ReportEvidence;
      errorMessage?: string | null;
      onChange(draft: ReportDraft): void;
      onSubmit(): void;
    }

## Work sequence and TDD

각 작업은 실패 테스트 → 최소 구현 → 통과 테스트 순서로 진행합니다. 각 작업이 끝날 때 npm run typecheck와 해당 테스트 파일을 실행합니다. 구현 에이전트는 코드를 수정하되 commit·push·배포는 하지 않습니다.

### Task 1 — 학습자용 표시 계층과 추천 이유 단순화 (completed)

- [x] 실패 테스트 작성
  - Create src/data/learnerPresentation.test.ts.
  - scenarioLabel은 세 내부 ID를 설정 1·설정 2·설정 3으로 변환하고 알 수 없는 값은 허용하지 않는 타입 계약을 확인합니다.
  - formatObservedMetric은 focus-card-count에 장, topic-variety에 개를 붙이는지 확인합니다.
  - Create src/features/transparency/whyThisCardFlow.test.tsx.
  - WhyThisCardDialog 기본 렌더링에는 round, topicIndex, topicCandidateCount가 없고 “자세한 계산 보기” details가 닫혀 있는지 확인합니다.
  - details를 열면 deterministicPositionRule이 보이고 dialog의 Escape·Tab 포커스 계약이 유지되는지 확인합니다.
- [x] 최소 구현
  - Create src/data/learnerPresentation.ts.
  - WhyThisCardDialog.tsx에서 어린이용 요약을 먼저 렌더링하고 기술 표·계산식을 details 안으로 이동합니다.
  - ScenarioComparison.tsx와 ModelReport.tsx의 화면 제목·caption·aria label에서 scenarioLabel을 사용합니다.
  - 기존 domain ID와 isSnapshotShape 검증은 변경하지 않습니다.
- [x] 통과 테스트
  - npm run test:run -- src/data/learnerPresentation.test.ts src/features/transparency/whyThisCardFlow.test.tsx
  - npm run typecheck
- [x] 합격 조건
  - 학습자용 DOM에 내부 변수명과 raw scenario ID가 없고, 상세 계산을 펼친 경우에만 기술 근거가 보입니다.
  - 추천 이유 대화상자의 Escape, Tab 순환, 닫기 후 트리거 복귀가 기존과 동일합니다.

### Task 2 — 보고서 문장·단위·검증 피드백 정리 (completed)

- [x] 실패 테스트 작성
  - Create src/domain/reportValidation.test.ts.
  - emptyReportDraft에서 정확히 8개 요구 묶음 오류가 stable order로 반환되는지 확인합니다.
  - 모든 필수 값이 있는 draft에서 isReportReady가 true인지 확인합니다.
  - reportFlow.test.tsx에 topic-variety가 5개, focus-card-count가 3장으로 표시되는 실패 assertion을 추가합니다.
  - 완료 문장에 scenario-c, 장(개), “새로운 주제를 찾기 목적에서”, 중복 warning이 없고, “새로운 주제를 찾는 목적에서”가 포함되는지 확인합니다.
- [x] 최소 구현
  - Create src/domain/reportValidation.ts.
  - learningCopy.ts에 문장용 목적 label과 한 번만 표시할 짧은 model warning을 추가하고 개인정보 중복 문장을 제거합니다.
  - reportAssessment.ts의 buildReportSentence가 scenarioLabel, learnerMetricLabel, metricUnit을 사용하고 warning을 반환하지 않도록 합니다.
  - ModelReport.tsx는 errorMessage를 받고 각 요구 묶음의 id·aria-describedby·짧은 안내를 렌더링합니다. 오류가 새로 생기면 첫 누락 target으로 focus와 즉시 scroll을 수행합니다.
  - CompletionScreen.tsx는 model warning을 한 번만 별도 표시합니다.
- [x] 통과 테스트
  - npm run test:run -- src/domain/reportValidation.test.ts src/domain/reportAssessment.test.ts src/features/report/reportFlow.test.tsx src/features/report/appReportFlow.test.tsx
  - npm run typecheck
- [x] 합격 조건
  - 빈 제출 시 첫 누락 묶음의 안내가 report 안에서 보이고 그 입력이 focus됩니다.
  - 카드 수 단위는 장, 주제 수 단위는 개이며, 완료 문장은 내부 ID·어색한 조사·중복 warning 없이 읽힙니다.

### Task 3 — 다음 행동 노출과 탐색 완료 안내 (completed)

- [x] 실패 테스트 작성
  - Create src/features/experiment/useNextTaskReveal.test.tsx.
  - active가 false일 때 focus·scroll이 호출되지 않고, true로 바뀐 한 번에 target focus와 scroll이 호출되는지 확인합니다.
  - App.test.tsx 또는 신규 choice learner-flow test에서 selectionHistory가 3일 때 prediction-panel-title이 tabIndex=-1인지 확인합니다.
  - ExplorationOutcome 테스트에 미션 3 완료 문장과 다음 미션 안내 assertion을 추가합니다.
- [x] 최소 구현
  - Create useNextTaskReveal.ts. document.getElementById(targetId)를 찾고 focus({ preventScroll: true }) 뒤 scrollIntoView({ block: 'start', behavior: 'auto' })를 한 번 수행합니다.
  - App.tsx의 choice 화면에서 selectionHistory.length === 3일 때 hook을 사용합니다.
  - PredictionPanel.tsx의 section 또는 h3에 prediction-panel-title target이 focus 가능하도록 tabIndex=-1을 제공합니다.
  - ExplorationOutcome.tsx 상단에 “미션 3 완료”와 관찰 결과, “다음 미션: 균형 설정” 안내를 추가합니다.
- [x] 통과 테스트
  - npm run test:run -- src/features/experiment/useNextTaskReveal.test.tsx src/App.test.tsx src/features/exploration
  - npm run typecheck
- [x] 합격 조건
  - 세 번째 선택 직후 예측 제목이 focus되고 모바일 viewport에서 다음 행동이 발견됩니다.
  - 탐색 후 학생이 관찰 결과와 다음 단계 이유를 읽은 뒤에도 기존 balance stage 전이가 유지됩니다.

### Task 4 — 진행 상태·핵심 버튼·모바일 요약 시각화 (completed)

- [x] 실패 테스트 작성
  - StageProgress 렌더링 테스트에서 현재 mission에 data-stage-state=current, 이전 mission에 complete, 이후 mission에 upcoming을 기대합니다.
  - balanceFlow.test.tsx에서 새 설정 저장 가능 상태의 저장 버튼이 data-gi-pulse=true이고 reduced-motion 상태에서는 static label이 보이는지 확인합니다.
  - Create src/components/common/TopicCountSummary.test.tsx에서 5개 주제 이름과 카드 수, accessible summary가 함께 렌더링되는지 확인합니다.
- [x] 최소 구현
  - StageProgress.tsx에 상태 data attribute와 완료·현재 텍스트/아이콘을 추가합니다. aria-current 의미와 순서는 유지합니다.
  - BalanceControlPanel.tsx에서 duplicate가 아니고 3개 미만일 때 저장 버튼에 gi-pulse와 reduced-motion 대체 문구를 추가합니다.
  - Create src/components/common/TopicCountSummary.tsx. TopicId별 count를 막대와 숫자, aria-label로 표현합니다.
  - ScenarioComparison.tsx, SupplyAuditPanel.tsx, ModelReport.tsx에 요약을 표보다 먼저 배치하고 기술 표·토큰 목록을 details로 접습니다.
  - components.css에 stage 상태, summary bar, details spacing, mobile 핵심 행동 스타일을 추가합니다.
- [x] 통과 테스트
  - npm run test:run -- src/components/layout src/features/balance src/components/common/TopicCountSummary.test.tsx
  - npm run typecheck
  - npm run lint
- [x] 합격 조건
  - 현재·완료·예정 미션이 색만이 아니라 텍스트 또는 아이콘으로도 구분됩니다.
  - 저장 가능한 설정과 균형 비교 버튼 모두 일반 모션·reduced-motion 규칙을 지킵니다.
  - 핵심 숫자가 표를 열지 않아도 보이고, 표 헤더·accessible name은 details 안에서 보존됩니다.

### Task 5 — 개인정보 문장·favicon·업데이트 내역·정적 경계 회귀 (completed)

- [x] 실패 테스트 작성
  - IntroScreen 테스트에서 개인정보 의미가 한 번만 노출되고 가상 모델·불편 콘텐츠 안내가 남는지 확인합니다.
  - index.html 또는 build artifact 검증에서 favicon link가 있고 public/favicon.svg가 존재하는지 확인합니다.
  - src/data/updateHistory.test.ts에서 2026-08-28 개선 항목의 date/category/summary가 유효한지 확인합니다.
  - scripts/check-boundaries.test.mjs에 새 파일에서도 네트워크·저장 API가 검출되는 경우 실패하는 assertion을 유지합니다.
- [x] 최소 구현
  - IntroScreen.tsx에서 반복 privacy paragraph를 하나로 합칩니다.
  - Create public/favicon.svg와 index.html의 rel=icon link를 추가합니다.
  - data/updateHistory.ts에 2026-08-28 “학습자용 문장과 모바일 흐름 개선” 기록을 추가합니다.
- [x] 통과 테스트
  - npm run test:run -- src/features/intro scripts
  - npm run test:scripts
  - npm run check:lines
  - npm run check:boundaries
  - npm run build
- [x] 합격 조건
  - favicon 404가 없고, 개인정보 문장이 중복되지 않으며, 업데이트 내역에 이번 변경 날짜가 보입니다.
  - 모든 소스 파일이 499줄 이하이고 개인정보·네트워크 경계 검사 결과가 위반 0건입니다.

### Task 6 — 전체 검증과 HVC 확인 링크 기록 (completed)

- [x] npm run quality를 실행해 lint, typecheck, scripts, line/boundary, Vitest, build가 모두 exit 0인지 확인합니다.
- [x] `PLAYWRIGHT_PORT=4176 npm run test:e2e`를 실행합니다. 기본 포트 점유와 브라우저 런너 권한 오류가 발생하면 오류를 제품 결함으로 기록하지 않고, 실행 환경과 실제 브라우저 상호작용 범위를 보고서에 분리합니다.
- [x] 375×812에서 intro부터 complete까지 실제 클릭·키보드 흐름을 다시 수행하고, 각 단계의 핵심 행동과 가로 넘침을 확인합니다.
- [x] MCP Playwright 또는 허용된 브라우저에서 console error 0건, favicon 200, title·HTML 참조 자산 200을 확인합니다.
- [x] VoiceOver 검증은 수행하지 않습니다.
- [x] .gstack/qa-reports/qa-report-wbmaker2-github-io-recommendation-balance-lab-2026-08-28.md에 수정 결과와 남은 사람 검수 범위를 추가합니다.
- [x] HVC 확인을 위한 현재 Pages 링크 https://wbmaker2.github.io/recommendation-balance-lab/를 결과 보고서에 포함합니다. 배포하지 않은 상태에서는 새 배포가 완료되었다고 표현하지 않습니다.

## Future commands and expected results

    npm run test:run -- src/data/learnerPresentation.test.ts src/features/transparency/whyThisCardFlow.test.tsx
    Expected: learner presentation and reason dialog tests pass.

    npm run test:run -- src/domain/reportValidation.test.ts src/domain/reportAssessment.test.ts src/features/report
    Expected: report validation, units, sentence, and completion tests pass.

    npm run test:run -- src/features/experiment/useNextTaskReveal.test.tsx src/App.test.tsx src/features/exploration
    Expected: next-task focus and exploration completion tests pass.

    npm run test:run -- src/components/layout src/features/balance src/components/common/TopicCountSummary.test.tsx
    Expected: progress, pulse, and visual summary tests pass.

    npm run test:scripts && npm run check:lines && npm run check:boundaries
    Expected: all script tests pass, all source files are under 500 lines, no boundary violations.

    npm run lint && npm run typecheck && npm run build
    Expected: exit 0 with no lint/type errors and a Vite production bundle.

    npm run quality
    Expected: complete local quality gate exits 0.

    PLAYWRIGHT_PORT=4176 npm run test:e2e
    Expected: configured Chromium learner, accessibility, and mobile specs pass. A host-only Chrome permission failure must be reported separately from app results.

## Commit sequence to use later

커밋은 구현과 검증이 모두 끝난 뒤 사용자의 명시적 release 지시가 있을 때 실행합니다. 각 커밋은 독립적으로 되돌릴 수 있도록 다음 순서를 따릅니다.

1. fix: simplify learner-facing recommendation evidence
   - learnerPresentation, reason dialog, scenario labels, report units
2. fix: guide mobile learner flow and report validation
   - next-task focus, inline report errors, exploration completion copy
3. fix: improve mission progress and evidence summaries
   - StageProgress state, TopicCountSummary, details layout, save pulse
4. chore: add favicon and document learner improvements
   - public/favicon.svg, index.html, intro privacy copy, update history, QA evidence
5. test: verify recommendation balance lab learner flow
   - final quality, E2E result, mobile evidence and report links

각 커밋 전에는 git diff --check와 npm run quality를 실행하고, 커밋 후에는 git status가 의도한 변경만 포함하는지 확인합니다. push·Pages 배포·HVC 등록은 별도 승인 단계로 남깁니다.

## Definition of done

- [x] ISSUE-001부터 ISSUE-011까지의 개선 방향이 코드와 테스트에 반영되었습니다.
- [x] 학습자용 DOM에 raw scenario ID, 내부 계산 변수명, 장(개)가 남아 있지 않습니다.
- [x] 세 번째 카드 선택, 빈 보고서 제출, 탐색 완료가 현재 화면과 포커스로 안내됩니다.
- [x] 모바일 요약·진행 상태·저장 pulse·reduced-motion 대체가 동작합니다.
- [x] 개인정보·네트워크·저장 경계와 500줄 제한을 통과합니다.
- [x] npm run quality와 가능한 E2E 결과가 기록되었습니다.
- [x] 업데이트 내역과 HVC 확인 링크가 보고서에 포함되었습니다.
- [x] VoiceOver 구현·검증은 수행하지 않았습니다.
