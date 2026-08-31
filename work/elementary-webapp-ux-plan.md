# Elementary Web App UX Improvement Plan

작성일: 2026-08-31
대상: `/Volumes/ External Drive 256G/Dev2/codex/recommendation-balance-lab`
입력: 기존 설계·리디자인 문서, `work/elementary-webapp-ux-audit.md`, `work/elementary-webapp-ux-language-audit.md`, `work/elementary-webapp-ux-simulation-decision.md`

## Goal

초등 5~6학년이 기존 추천 알고리즘 균형 실험의 학습 목표를 바꾸지 않고 다음 행동을 한 번에 이해하게 합니다.

1. 선택·관심·다양성·공급 조건을 학생이 아는 말과 교과 용어의 짧은 풀이로 연결합니다.
2. 표의 정확한 수치와 결정적 모델은 보존하되, 미션의 첫 행동을 기술 근거보다 먼저 읽게 합니다.
3. 미션 3 탐색과 미션 5 감사의 활성 핵심 버튼도 기존 미션과 같은 `gi-pulse`/reduced-motion 계약을 사용하게 합니다.
4. 오답·빈 제출·reset·키보드·모바일·개인정보 경계를 기존과 동일하게 유지합니다.

완료 기준은 `EDU-UX-001`·`EDU-UX-002`·`EDU-UX-003`의 focused 테스트와 전체 품질 명령, 375×812 전체 흐름 재검증이 모두 통과하는 것입니다. VoiceOver와 실제 학생 표본 검토는 이 구현 범위에 포함하지 않습니다.

## Architecture

기존 계산·상태·증거 계약은 그대로 두고 프레젠테이션 계층만 조정합니다.

```text
deterministic domain + reducer
        ↓ unchanged
learner-facing hints / details disclosure / motion cue
        ↓
RuleTransparencyPanel · PredictionPanel · BalanceControlPanel
ExplorationPanel · SupplyAuditPanel
        ↓
existing App stage transitions, tests, mobile/a11y contracts
```

- `RuleTransparencyPanel`은 한 문장 요약과 접힌 기술 표를 담당합니다.
- `PredictionPanel`·`BalanceControlPanel`은 첫 등장 용어 풀이와 native `aria-describedby` 연결을 담당합니다.
- `ExplorationPanel`·`SupplyAuditPanel`은 활성 상태에서만 다음 행동을 pulse하고 reduced-motion에서 정적 cue를 담당합니다.
- `data-gi-pulse`는 시각 장식이 아니라 행동 위계를 확인하는 테스트 계약입니다. 선택지 자체의 의미·순서·결과는 바꾸지 않습니다.

## Tech Stack

- Node.js 24.15.0, npm, React 19, TypeScript, Vite
- Vitest + Testing Library for focused component and learner-flow tests
- Existing Playwright MCP browser evidence and existing `npm run test:e2e` contract
- Existing CSS tokens and `motion.css`; new package·font·server·storage·network API 없음

## Spec

### Content and learning contracts

- 5개 중립 주제, 40개 카드, 피드 8장, 선택→분포→탐색→균형→감사→보고서의 stage transition을 보존합니다.
- `포커스 주제`는 `방금 같은 자리에 세 번 고른 주제`, `토큰`은 `주제마다 붙는 점수`, `다양성 토큰`은 `다른 주제를 보여 주는 점수`로 첫 등장에 풀이합니다.
- `관심 토큰 × 2`, 결정적 위치 규칙, 공급 프로필 ID 등 기술 근거는 표/details 안에서만 유지하며 계산값·단위·caption을 바꾸지 않습니다.
- 오답은 정답을 비난하지 않고 현재 표·근거로 다시 보게 하며, 빈 보고서는 첫 누락 묶음으로 focus/scroll합니다.

### Responsive and motion contracts

- `RuleTransparencyPanel`의 6열 table은 native `details`의 닫힌 상태에서 기본적으로 숨기고, 열면 기존 accessible table을 그대로 제공합니다.
- 375×812에서 기본 choice view의 horizontal overflow가 없고, 카드 선택·예측 제목·핵심 action의 기존 focus 위치를 유지합니다.
- `ExplorationPanel`은 첫 번째 후보의 `낯선 주제 열기`에 `data-gi-pulse="true"`와 `gi-pulse`를 주고, `prefers-reduced-motion: reduce`에서는 pulse를 제거하고 한 번의 `지금 열어 볼 차례` 정적 cue를 표시합니다. 후보 2·3의 label과 동작은 그대로 둡니다.
- `SupplyAuditPanel`은 선택된 원인이 있을 때 `변화 원인 확인`에 `data-gi-pulse="true"`와 `gi-pulse`를 주고, reduced-motion에서는 `지금 원인을 확인할 차례`를 표시합니다. 선택 전 disabled 상태에는 pulse를 주지 않습니다.

### Safety, privacy, accessibility

- 실제 취향·검색 기록·계정·쿠키·사용 시간·중독 여부를 수집·저장·전송하지 않습니다.
- 모델 경계, 개인정보, 불편 콘텐츠 안내, 업데이트 내역 날짜 기록을 유지하고 이번 변경을 2026-08-31 `UPDATE_HISTORY`에 추가합니다.
- native button/radio/checkbox/range, 44px 터치 높이, visible focus, axe/keyboard/reduced-motion 계약을 유지합니다.
- VoiceOver는 구현·검증하지 않습니다.

## Global Constraints

- 도메인 파일(`src/domain/**`), 카드·주제 데이터, reducer action 이름, report validation 타입은 수정하지 않습니다.
- 단일 `src`/`tests`/`scripts` 파일은 500줄 미만입니다.
- 새 외부 이미지·웹 폰트·패키지·API를 추가하지 않습니다. 기존 favicon은 보존합니다.
- 공개 배포·Git commit·push·HVC 등록은 이번 요청의 범위가 아니므로 실행하지 않습니다.
- 계획의 명령은 구현 후 실행할 명령으로만 기록하며 계획 작성 단계에는 실행하지 않습니다.

## 예상 파일 구조와 책임

| Path | Responsibility |
| --- | --- |
| `src/features/transparency/RuleTransparencyPanel.tsx` | 토큰 쉬운 풀이와 접힌 계산표 |
| `src/features/prediction/PredictionPanel.tsx` | 포커스 주제 첫 설명 |
| `src/features/balance/BalanceControlPanel.tsx` | 다양성 토큰 help와 slider description |
| `src/features/exploration/ExplorationPanel.tsx` | 후보 primary pulse/reduced-motion cue |
| `src/features/audit/SupplyAuditPanel.tsx` | 감사 submit pulse/reduced-motion cue |
| `src/features/transparency/ruleTransparencyFlow.test.tsx` | 표 disclosure와 용어 hint 회귀 |
| `src/features/prediction/predictionFlow.test.tsx` | 포커스 설명과 기존 answer gate 회귀 |
| `src/features/exploration/explorationFlow.test.tsx` | candidate pulse/static cue/transition 회귀 |
| `src/features/audit/auditFlow.test.tsx` | audit pulse/static cue/disabled 회귀 |
| `src/features/balance/balanceFlow.test.tsx` | slider help와 기존 저장/비교 회귀 |
| `src/App.test.tsx` | 앱 전체 규칙표 disclosure 선택자 갱신 |
| `src/data/updateHistory.ts` | 2026-08-31 개선 기록 |
| `src/data/updateHistory.test.ts` | 최신 날짜·요약 회귀 |
| `work/elementary-webapp-ux-*.md` | 감사·언어·시뮬레이션 결정·계획·최종 보고서 |

## Work sequence and TDD

모든 코딩 작업은 `실패 테스트 → 최소 구현 → 통과 테스트` 순서입니다. 각 단계의 명령은 구현 시점에 실행합니다.

### Task 1 — 토큰 표 disclosure와 핵심 용어 풀이

**Files**

- `src/features/transparency/RuleTransparencyPanel.tsx`
- `src/features/transparency/ruleTransparencyFlow.test.tsx`
- `src/features/prediction/PredictionPanel.tsx`
- `src/features/prediction/predictionFlow.test.tsx`
- `src/features/balance/BalanceControlPanel.tsx`
- `src/features/balance/balanceFlow.test.tsx`
- `src/App.test.tsx`

**Interfaces**

- `RuleTransparencyPanelProps { result: RecommendationResult }` 유지
- `PredictionPanelProps { focusTopicId: TopicId; selectionCount: number; onSubmit(answer: PredictionAnswer): void }` 유지
- `BalanceControlPanelProps`의 config/snapshots/callback 타입 유지
- table accessible name `현재 추천 규칙의 주제별 토큰`, radio/slider accessible name, 도메인 계산식 유지

**실패 테스트**

- 닫힌 기본 상태에서 `토큰 계산표 자세히 보기` summary와 토큰 쉬운 풀이가 있고 table이 기본 노출되지 않음을 기대합니다.
- details를 연 뒤 기존 6개 columnheader와 모든 토큰 열이 존재함을 기대합니다.
- 예측 패널에 `포커스 주제는 방금 같은 자리에 세 번 고른 주제예요.`가 있고 두 답이 없으면 button이 disabled임을 기대합니다.
- balance slider에 다양성 토큰 help가 표시되고 `aria-describedby="diversity-level-help"`가 연결됨을 기대합니다.
- 기존 `App.test.tsx`의 details 클릭 후 table 검증을 새 summary로 먼저 여는 흐름으로 갱신합니다.

**최소 구현**

- RuleTransparencyPanel의 table을 native details 안으로 이동하고 설명 문장을 추가합니다.
- PredictionPanel legend 앞에 포커스 용어 풀이를 추가합니다.
- BalanceControlPanel에 id가 안정적인 help paragraph와 `aria-describedby`를 추가합니다.

**통과 테스트·합격 조건**

- `npm run test:run -- src/features/transparency/ruleTransparencyFlow.test.tsx src/features/prediction/predictionFlow.test.tsx src/features/balance/balanceFlow.test.tsx src/App.test.tsx`가 exit 0입니다.
- details를 열면 계산 표의 수치·headers·accessible name이 기존과 같고, 닫힌 기본 화면의 first action 위계가 짧아집니다.
- `npm run typecheck`가 exit 0입니다.

### Task 2 — 미션 3·5 핵심 행동 강조와 reduced-motion 대체

**Files**

- `src/features/exploration/ExplorationPanel.tsx`
- `src/features/exploration/explorationFlow.test.tsx`
- `src/features/audit/SupplyAuditPanel.tsx`
- `src/features/audit/auditFlow.test.tsx`
- `src/styles/motion.css`는 기존 규칙을 유지하며 새 CSS 추가가 필요한 경우에만 수정

**Interfaces**

- `ExplorationPanelProps { currentResult; focusTopicId; onExplore(topicId) }` 유지
- `SupplyAuditPanelProps { pair; onAnswer(factor) }` 유지
- `onExplore`/`onAnswer` callback 횟수와 stage transition 유지

**실패 테스트**

- exploration 첫 후보 button에 enabled 상태에서 `data-gi-pulse="true"`·`gi-pulse`가 있고 두 번째 후보에는 pulse가 없음을 기대합니다.
- exploration reduced-motion에서 `.gi-pulse`가 없고 `지금 열어 볼 차례`가 한 번 표시됨을 기대합니다.
- audit 선택 전 submit이 disabled이며 pulse가 없고, `콘텐츠 공급` 선택 후 submit이 enabled·pulse임을 기대합니다.
- audit reduced-motion에서 pulse 대신 `지금 원인을 확인할 차례`가 표시됨을 기대합니다.

**최소 구현**

- 각 컴포넌트에서 `useReducedMotion`을 호출합니다.
- exploration `visibleCandidates.map`의 index 0 실행 버튼에만 활성 pulse를 부여하고 reduced-motion cue를 panel 단위로 렌더링합니다.
- audit `selected !== null` 조건으로 submit pulse와 정적 cue를 제어합니다.

**통과 테스트·합격 조건**

- `npm run test:run -- src/features/exploration/explorationFlow.test.tsx src/features/audit/auditFlow.test.tsx`가 exit 0입니다.
- 기존 오답 status, `onAnswer` 1회 lock, exploration 결과 전이, 44px 버튼 높이를 유지합니다.
- `npm run lint && npm run typecheck`가 exit 0입니다.

### Task 3 — 업데이트 기록과 전체 회귀

**Files**

- `src/data/updateHistory.ts`
- `src/data/updateHistory.test.ts`
- `tests/e2e/mobile.spec.ts`는 필요한 새 selector assertion만 추가
- `tests/e2e/accessibility.spec.ts`는 기존 coverage를 보존하고 새 aria-describedby를 확인하는 경우에만 수정
- `work/elementary-webapp-ux-report.md`

**실패 테스트**

- update history 최신 날짜가 `2026-08-31`, category가 `개선`, summary가 이번 용어·표·행동 cue 변경을 포함함을 기대합니다.
- mobile E2E에서 375×812의 intro/choice/comparison/exploration/balance/audit/report/complete 각 stage `scrollWidth <= clientWidth`를 유지하고 pulse 대상 accessible name을 확인합니다.

**최소 구현**

- `UPDATE_HISTORY`에 `{ date: '2026-08-31', category: '개선', summary: '토큰 설명·근거 표 접기·탐색과 감사 행동 강조를 보강' }`를 추가합니다.
- 필요한 문서와 QA 체크리스트의 현재 상태만 갱신합니다. 기존 과거 기록은 수정하지 않습니다.

**통과 테스트·합격 조건**

- `npm run quality`가 lint, typecheck, scripts, line/boundary, Vitest, build까지 exit 0입니다.
- `npm run test:e2e` 또는 기존 macOS Chromium 환경 제약 시 MCP Playwright로 동일 시나리오를 증거화하며, 콘솔/page error·실패 요청 0건입니다.
- 375×812에서 details 기본 닫힘, 후보/감사 action pulse, reduced-motion static cue, 보고서·완료 reset을 확인합니다.

## 향후 실행 명령과 예상 결과

아래 명령은 계획 실행 단계에서만 사용합니다.

```sh
npm run test:run -- src/features/transparency/ruleTransparencyFlow.test.tsx src/features/prediction/predictionFlow.test.tsx src/features/balance/balanceFlow.test.tsx src/features/exploration/explorationFlow.test.tsx src/features/audit/auditFlow.test.tsx src/App.test.tsx
# 예상: 선택한 Vitest 파일 전체 통과

npm run typecheck
# 예상: TypeScript 오류 0건

npm run lint
# 예상: ESLint 오류·경고 0건

npm run check:lines && npm run check:boundaries
# 예상: 모든 소스 파일 500줄 미만, persistence/network 위반 0건

npm run test:run && npm run test:scripts && npm run build
# 예상: 전체 Vitest·script test 통과, dist production bundle 생성

PLAYWRIGHT_PORT=4176 npm run test:e2e
# 예상: CI/Linux 또는 허용된 로컬 Chromium에서 accessibility·learning·mobile 전체 통과
```

macOS Chromium이 기존처럼 `MachPortRendezvousServer` 권한 오류를 내면 같은 명령을 반복하지 않고 MCP Playwright로 public URL 동일 시나리오를 실행하고, CLI 실행은 환경 제약으로 보고서에서 분리합니다.

## 향후 커밋 단계

이번 요청에서는 실행하지 않습니다. 사용자가 별도로 release gate를 승인한 경우에만 다음 순서를 적용합니다.

1. `git diff --check`와 `git status --short`로 의도한 소스·테스트·문서만 확인합니다.
2. `git add`에는 이번 개선 파일만 명시하고 기존 `redesign-audit-intro-desktop.png` 같은 무관한 파일은 포함하지 않습니다.
3. `git commit -m "fix: improve elementary learner cues"`로 하나의 원자 커밋을 만듭니다.
4. 사용자가 요청한 원격·브랜치가 확인된 뒤에만 `git push`를 수행합니다.
5. Pages workflow 성공, 공개 URL HTTP 200·title·relative assets·375×812 학습자 경로를 확인한 뒤 배포 주소를 보고합니다.

## Rollback and stop conditions

- 도메인 결과·단위·상태 전이가 변하면 즉시 해당 작업을 중단하고 presentation-only patch로 되돌립니다.
- 같은 브라우저/테스트 실패를 세 번 반복하면 추가 시도 대신 실패 원인과 선택지를 사용자에게 보고합니다.
- 개인정보·네트워크·외부 이미지·새 의존성이 요구되는 경우 범위를 확장하지 않고 사용자 승인을 요청합니다.
