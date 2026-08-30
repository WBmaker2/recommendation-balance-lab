# Recommendation Balance Lab Education Web App Redesign Plan

작성일: 2026-08-29
모드: `full`
대상: `/Volumes/ External Drive 256G/Dev2/codex/recommendation-balance-lab`

## Goal

초등 5~6학년 학습자가 375px 모바일 또는 데스크톱에서 앱을 처음 열었을 때 다음 행동을 빠르게 찾고, 선택 → 추천 분포 → 균형 설정 → 모델 감사 → 보고서 흐름을 같은 의미로 끝까지 수행하도록 기존 교육용 React/Vite 앱을 안전하게 리디자인합니다.

이번 작업은 화면 위계·문구 배치·반응형 밀도·상태 시각화·공통 행동 안내를 개선합니다. 5개 중립 주제, 40개 카드, 8장 결정적 피드, 선택·설정·공급 조건의 인과 구분, 보고서 판정, 개인정보·모형 한계 경계는 유지합니다.

## Source of truth and audit status

- 교육 설계: `2026-08-26-recommendation-balance-lab-design.md`
- 이전 구현 계획: `2026-08-26-recommendation-balance-lab-implementation-plan.md`
- 이전 개선 계획: `2026-08-28-recommendation-balance-lab-improvement-plan.md`
- 이전 QA: `.gstack/qa-reports/qa-report-wbmaker2-github-io-recommendation-balance-lab-2026-08-28.md`, `docs/qa-checklist.md`
- 초기 감사: `work/education-webapp-redesign-audit.md`
- 공개 기준 URL: `https://wbmaker2.github.io/recommendation-balance-lab/`
- 프로젝트 규칙 문서 확인 결과: `AGENTS.md`, `EDUCATION_DESIGN.md`, `design-system/MASTER.md`는 저장소에 없었으며 이를 추측해 채우지 않습니다.
- 지원 역할 상태: `impeccable`, `ui-ux-pro-max`, `redesign-existing-projects`는 현재 세션에 없어 `unavailable/not run`으로 기록합니다. 이 계획과 감사는 직접 수행한 증거만 사용합니다.

초기 감사의 핵심 근거는 375×812에서 intro 높이 2016px·시작 버튼 y=1803, choice 높이 4587px·8개 카드 1열, header 높이 476px, report 높이 4147px입니다. 1440×900에서도 header 416px와 시작 버튼 y=1477px로 첫 행동의 위계가 약합니다.

## Architecture

현재 도메인 계산·상태 전이·콘텐츠는 그대로 두고 프레젠테이션 계층과 레이아웃 계층만 정리합니다.

```text
domain calculations and reducer
  ├─ recommendationEngine, distribution, balanceScenarios, reportAssessment
  └─ existing ExperimentController and stage transitions (unchanged)
            ↓
presentation/data
  ├─ learningCopy and learnerPresentation (existing copy contracts)
  └─ updateHistory (append 2026-08-29 redesign entry)
            ↓
shared layout
  ├─ AppShell: brand, progress rail, boundary notice, reset/update actions
  ├─ StageProgress: current/complete/upcoming state rail
  └─ StagePrompt: one primary action and completion hint per mission
            ↓
feature UI
  ├─ IntroScreen: hero CTA and progressive disclosure
  ├─ RecommendationFeed/Card: compact responsive two-column mobile feed
  ├─ comparison/balance/audit/report: evidence-first cards and details
  └─ CompletionScreen: single model-boundary statement and next action
            ↓
styles
  ├─ tokens.css: light educational lab palette, type, spacing, breakpoints
  ├─ components.css: surfaces, cards, prompts, responsive grids
  └─ motion.css: gi-pulse and reduced-motion fallback
```

No domain import may be reversed to depend on CSS or browser APIs. `StagePrompt` is presentational only. All stateful actions continue to arrive through existing props and `ExperimentController` commands.

## Tech Stack

- Node.js `24.15.0`, npm, React `19.2.8`, TypeScript `6.0.3`, Vite `8.2.2`
- Existing Vitest `4.1.11`, Testing Library, user-event
- Existing Playwright `1.62.1` and `@axe-core/playwright` `4.13.0`
- Existing CSS files and no new runtime dependency
- Existing static GitHub Pages base path and relative asset references

## Spec

### Learner experience

- Intro hero presents one child-readable question, `30~40분`, one `실험 시작` primary CTA, and a short local-only safety line before long explanations.
- Detailed privacy, uncomfortable-content guidance, and non-goals remain in the DOM inside clearly labeled collapsed `details`; the short safety line is not a second copy of the full paragraph.
- Header progress uses 5 mission items with current/complete/upcoming text and icon. Desktop uses 5 compact columns; widths at or below 760px use a readable 2-column grid with the fifth item spanning both columns.
- Model boundary uses a short strong sentence plus a secondary sentence. The complete stage renders the boundary exactly once inside `CompletionScreen`; other stages keep the header notice.
- `StagePrompt` labels the current action with `data-prompt-kind="current-action"`, keeps one primary CTA, and supports an optional completion hint without changing existing role/name strings.
- Recommendation feed uses 4 columns at desktop, 3 columns at tablet widths, and 2 columns at 375px. Card actions remain native buttons with `aria-pressed` and existing Korean names.
- Card layout order is topic badge → title → summary → action group → token evidence. Long titles wrap naturally; action buttons keep at least 44px height.
- Comparison, balance, audit, and report retain summary-first numbers, closed technical details, fieldset legends, error alert semantics, and existing focus/scroll behavior.
- Primary educational buttons (`실험 시작`, `다음 목록 예측`, `분포 문장 확인`, `낯선 주제 열기`, `현재 설정 저장`, `균형 비교`, `변화 원인 확인`, `모델 보고서 제출`, `새 실험 시작`) use the existing `gi-pulse` pattern only when actionable. `prefers-reduced-motion: reduce` removes animation and shows a static cue.

### Visual system

- Light mode only. Use paper background, navy ink, muted blue-gray, blue primary action, teal evidence accent, amber focus, and red only for validation errors.
- Use rounded surfaces for hierarchy, not decoration: `app-header`, `stage-hero`, `action-panel`, `evidence-card`, `details-panel`, `completion-card`.
- Use `:focus-visible` with a 3px amber outline and no color-only state distinction.
- Maintain max content width near 1180px, 16–24px page padding, 12–24px gaps, and 16px card radius.
- Keep icon/emoji topics as existing decorative or semantic labels; no generated imagery is necessary.

### Image asset decision

`public/favicon.svg` is a small identity asset, not a general illustration. It remains unchanged. There are no photos, diagrams, charts, screenshots, CSS backgrounds, `srcset`, or preload assets eligible for safe generation. `imagegen` is not run; this decision is recorded in `work/education-webapp-redesign-assets.md`.

### Safety and scope

- Do not alter recommendation arithmetic, card data, supply profiles, report scoring/validation, or reducer stage transitions.
- Do not add server calls, fetch/XHR, analytics, cookies, localStorage/sessionStorage, account fields, or student profiling.
- Do not add student-facing TTS, narration, audio playback/recording, social sharing, ranking, or time diagnosis.
- Do not claim human child testing, VoiceOver approval, source attribution, or accessibility certification. VoiceOver implementation and verification remain excluded.
- Do not create or modify Git commits, branches, pushes, releases, deployments, HVC records, or external services during this redesign unless the user separately requests them.

## Expected file structure and responsibilities

```text
work/
  education-webapp-redesign-plan.md       # this scope, acceptance, rollback, commands
  education-webapp-redesign-audit.md     # initial and prioritized findings
  education-webapp-redesign-assets.md    # asset classification and no-generation record
  education-webapp-redesign-report.md    # final evidence and pending human review
design-system/
  MASTER.md                               # applied light educational lab tokens and patterns
src/
  components/layout/AppShell.tsx         # semantic frame and complete-stage boundary rule
  components/layout/StageProgress.tsx    # compact responsive mission rail
  components/layout/StagePrompt.tsx      # shared current-action prompt interface
  components/layout/StagePrompt.test.tsx
  components/common/ModelBoundaryNotice.tsx
  components/common/TopicBadge.tsx
  components/common/UpdateHistoryDialog.tsx
  components/common/ResetExperimentButton.tsx
  features/intro/IntroScreen.tsx         # hero, CTA, progressive disclosure
  features/feed/RecommendationFeed.tsx   # density classes and focus-preserving grid
  features/feed/RecommendationCard.tsx   # compact card/action grouping
  features/comparison/*.tsx              # prompt/evidence surface classes only
  features/exploration/*.tsx             # prompt and candidate card classes only
  features/balance/*.tsx                 # prompt/action/evidence classes only
  features/audit/SupplyAuditPanel.tsx    # prompt/evidence classes only
  features/report/*.tsx                  # report sequence and completion surface
  data/updateHistory.ts                  # append 2026-08-29 entry
  data/updateHistory.test.ts              # date/order assertion update
  styles/tokens.css                      # palette/type/spacing/breakpoints
  styles/global.css                      # base typography/focus/table defaults
  styles/components.css                  # layout and component patterns
  styles/motion.css                      # gi-pulse/reduced-motion rules
tests/e2e/mobile.spec.ts                 # 375px CTA, two-column feed, all-stage overflow
tests/e2e/accessibility.spec.ts          # axe stage coverage and keyboard regression
```

## Work sequence and TDD

Every implementation task follows `실패 테스트 → 최소 구현 → 통과 테스트`. Each task runs its focused test and `npm run typecheck` before moving on. No task changes domain data or creates a new dependency.

### Task 0 — Baseline and design documents (completed before code)

- [x] `git status --short --branch` confirms `main` is clean.
- [x] Read existing design/implementation/QA documents and recorded missing project rule files.
- [x] Captured fresh 1440×900 and 375×812 browser metrics, stage heights, console error count, and asset usage.
- [x] Wrote `work/education-webapp-redesign-audit.md` with P1/P2/P3 findings.
- [x] Read `references/asset-safety.md` before deciding image work.

### Task 1 — Design system and shell hierarchy

**Files**

- `design-system/MASTER.md`
- `src/components/layout/AppShell.tsx`
- `src/components/layout/StageProgress.tsx`
- `src/components/common/ModelBoundaryNotice.tsx`
- `src/styles/tokens.css`
- `src/styles/global.css`
- `src/styles/components.css`
- `src/styles/motion.css`
- `src/components/layout/StageProgress.test.tsx`
- `src/components/layout/AppShell.test.tsx`
- `src/App.test.tsx`

**Interfaces and selectors**

- Preserve `AppShellProps { stage: ExperimentStage; onReset(): void; children: ReactNode }`.
- Preserve `StageProgressProps { stage: ExperimentStage }` and existing `aria-label="미션 진행"`.
- Add stable classes `app-shell`, `app-header`, `app-header__brand`, `app-header__progress`, `app-header__boundary`, `app-main`, `app-footer`.
- Add `data-stage-state` values `complete | current | upcoming` without changing `aria-current="step"`.

**TDD**

- [x] 실패 테스트: StageProgress expects compact state classes and five mission items; AppShell expects landmark classes, boundary hidden on `complete`, and update/reset controls preserved.
- [x] 최소 구현: add semantic wrappers/classes, responsive token rules, and complete-stage boundary condition; keep text and commands intact.
- [x] 통과 테스트: focused layout tests and `npm run typecheck` exit 0.

**Acceptance**

- At 375px the header is shorter than the baseline 476px while all mission states remain readable.
- Complete DOM contains one `MODEL_WARNING`; intro and active stages contain the header boundary.
- No new dark mode, network, storage, or browser-only state is introduced.

### Task 2 — Intro hero and first-action disclosure

**Files**

- `src/features/intro/IntroScreen.tsx`
- `src/features/intro/IntroScreen.test.tsx`
- `src/data/learningCopy.ts` only if a new short prompt constant is needed
- `src/styles/components.css`
- `tests/e2e/mobile.spec.ts`

**Interfaces and selectors**

- Preserve `IntroScreenProps { onStart(): void }` and button accessible name `실험 시작`.
- Add `section.intro-screen`, `div.intro-hero`, `div.intro-hero__question`, `div.intro-hero__action`, `details.intro-more`, and `data-gi-pulse="true"` only on the start CTA.
- Keep `PRIVACY_NOTICE`, `UNCOMFORTABLE_CONTENT_GUIDANCE`, `NON_GOALS`, and model-boundary copy in the DOM.

**TDD**

- [x] 실패 테스트: IntroScreen expects a hero question, one start CTA in the hero, a static safety line, and collapsed details containing the existing safety/non-goal copy.
- [x] 최소 구현: move existing content into semantic groups, shorten only duplicated lead text, place the single CTA before details, and style the primary action.
- [x] 통과 테스트: IntroScreen tests plus mobile CTA visibility at 375×812 pass; `npm run typecheck` exits 0.

**Acceptance**

- Fresh 375×812 viewport shows the start CTA without scrolling.
- Existing learning goals, five topic labels, safety copy, non-goals, and button name remain discoverable.
- No student data or invented human-review claim is added.

### Task 3 — Compact recommendation feed and card actions

**Files**

- `src/features/feed/RecommendationFeed.tsx`
- `src/features/feed/RecommendationCard.tsx`
- `src/features/feed/FeedTransition.tsx`
- `src/features/feed/RecommendationFeed.test.tsx`
- `src/styles/components.css`
- `tests/e2e/mobile.spec.ts`
- `tests/e2e/learning-flow.spec.ts`

**Interfaces and selectors**

- Preserve `RecommendationFeedProps`, `RecommendationCardProps`, and `data-feed-layout="fixed-eight"`.
- Add `className="recommendation-feed"`, `className="recommendation-card__actions"`, and `data-feed-density="compact"`.
- Preserve button names `이 카드 선택`, `왜 이 카드가 나왔나요?`, `aria-pressed`, selected slot focus restoration, and dialog open/close behavior.

**TDD**

- [x] 실패 테스트: component test expects action group and compact density marker; 375px E2E expects two computed grid columns and no horizontal overflow after entering choice.
- [x] 최소 구현: add action grouping and responsive grid rules (`4 → 3 → 2` columns), reduce redundant card padding/summary height, and retain 44px controls.
- [x] 통과 테스트: feed unit tests, learning flow, mobile overflow and focus checks pass; `npm run typecheck` exits 0.

**Acceptance**

- Eight cards remain present and selectable; each card still exposes its reason dialog.
- Mobile choice document height is materially shorter than 4587px without hiding required evidence.
- The third selection still focuses and scrolls to `prediction-panel-title` once.

### Task 4 — Shared stage prompts and evidence surfaces

**Files**

- `src/components/layout/StagePrompt.tsx`
- `src/components/layout/StagePrompt.test.tsx`
- `src/App.tsx`
- `src/features/comparison/DistributionComparison.tsx`
- `src/features/exploration/ExplorationPanel.tsx`
- `src/features/balance/BalanceControlPanel.tsx`
- `src/features/audit/SupplyAuditPanel.tsx`
- `src/features/report/ModelReport.tsx`
- `src/styles/components.css`

**Interface**

```ts
export interface StagePromptProps {
  eyebrow?: string;
  title: string;
  description: string;
  completionHint?: string;
  children?: React.ReactNode;
}
```

`StagePrompt` renders a section with `data-prompt-kind="current-action"`, a heading, description, optional completion hint, and optional action slot. It does not own state or call browser APIs.

**TDD**

- [x] 실패 테스트: StagePrompt test expects title/description/completion hint order and accessible heading; stage tests expect one current-action prompt and existing role/name strings.
- [x] 최소 구현: wrap existing first paragraphs and primary actions with StagePrompt or equivalent stable classes, then add prompt/evidence surface CSS.
- [x] 통과 테스트: focused component tests, existing balance/audit/report tests, `npm run lint`, and `npm run typecheck` exit 0.

**Acceptance**

- Each mission presents one visually dominant action and a short completion condition in its first content block.
- Existing incorrect-answer alerts, fieldset legends, summary tables, details, and focus/scroll behavior remain unchanged.
- No stage gets an automatic transition or hidden action.

### Task 5 — Report order and single completion boundary

**Files**

- `src/features/report/ModelReport.tsx`
- `src/features/report/CompletionScreen.tsx`
- `src/features/report/reportFlow.test.tsx`
- `src/features/report/appReportFlow.test.tsx`
- `src/App.test.tsx`
- `src/styles/components.css`

**TDD**

- [x] 실패 테스트: report expects a `report-sequence` summary before fieldsets; complete expects exactly one `MODEL_WARNING`, one completion action, and the existing sentence/evidence.
- [x] 최소 구현: add a four-step visual sequence summary, style fieldsets/evidence articles as grouped surfaces, and suppress AppShell boundary only for `complete`.
- [x] 통과 테스트: report/completion/App tests and `npm run typecheck` exit 0.

**Acceptance**

- Report sequence is understandable before the long scenario evidence.
- Empty submit still focuses/scrolls the first missing target and exposes its alert.
- Completion keeps one model-boundary statement, four learning goals, truthful sentence, and `새 실험 시작`.

### Task 6 — Asset record and update history

**Files**

- `work/education-webapp-redesign-assets.md`
- `src/data/updateHistory.ts`
- `src/data/updateHistory.test.ts`
- `src/components/common/UpdateHistoryDialog.test.tsx`

**TDD and record**

- [x] 실패 테스트: update history test expects a valid chronological `2026-08-29` redesign entry; asset record test/search confirms favicon remains referenced and no generated asset is required.
- [x] 최소 구현: append one concise `개선` entry dated `2026-08-29`; write asset classification with original path, role, decision, alt/decoration decision, and rollback.
- [x] 통과 테스트: update-history tests, static asset tests, `npm run test:scripts`, and `npm run build` exit 0.

**Acceptance**

- Update dialog shows the new date and truthful summary.
- Favicon stays at `public/favicon.svg`; no imagegen output, source replacement, or new external asset is introduced.

### Task 7 — Full verification and final report

**Files**

- `work/education-webapp-redesign-report.md`
- `work/education-webapp-redesign-audit.md` (append final status only)
- `docs/qa-checklist.md` only if current evidence needs a factual date/command correction

**TDD/verification order**

- [x] `npm run lint` → exit 0, no warnings.
- [x] `npm run typecheck` → exit 0.
- [x] `npm run test:run` → 37 Vitest files and 164 tests pass.
- [x] `npm run test:scripts` → 7 Node script tests pass.
- [x] `npm run check:lines` → every `src`, `tests`, and `scripts` file is below 500 lines.
- [x] `npm run check:boundaries` → no persistence/network/API violations.
- [x] `npm run build` → Vite production bundle succeeds.
- [ ] `PLAYWRIGHT_PORT=4176 npm run test:e2e` → attempted on macOS but Chromium workers terminate with `MachPortRendezvousServer ... Permission denied (1100)`/`SIGTRAP`; equivalent MCP browser flow was run instead and is recorded in the final report.
- [x] Browser checks at 320, 375, 768, and 1280px: intro CTA visibility, two-column mobile feed, no horizontal overflow, all stage actions, completion, console errors 0, relative favicon asset 200.
- [x] Keyboard checks: Tab order, Enter/Space actions, dialog Escape/focus restore, third-card prediction focus, report error focus/scroll were covered by existing tests and MCP keyboard flow; `:focus-visible` is defined in `src/styles/global.css`.
- [x] Reduced motion and light mode checks: no animated pulse/feed transition under reduce, static cue visible, no dark theme.
- [x] Human review boundary: actual child observation, physical device/Safari/color/zoom remain pending; VoiceOver is excluded.

**Acceptance**

- Final report separates automated, browser, and human evidence and lists unavailable support Skills.
- No claim of VoiceOver approval, child testing, or public deployment is made.
- `git status --short` shows only intentional uncommitted implementation/docs changes; no commit/push/deploy is performed.

## Future commands and expected results

```sh
npm run lint
# Expected: exit 0, zero warnings.

npm run typecheck
# Expected: exit 0, no TypeScript errors.

npm run test:run
# Expected: all unit/integration tests pass.

npm run test:scripts
# Expected: all static scanner tests pass.

npm run check:lines
# Expected: all checked source/test/script files are below 500 lines.

npm run check:boundaries
# Expected: no forbidden persistence/network/runtime API matches.

npm run build
# Expected: Vite emits a production dist bundle.

PLAYWRIGHT_PORT=4176 npm run test:e2e
# Expected: Chromium learner-flow, mobile, accessibility, keyboard, and reduced-motion specs pass.
```

## Rollback

Before implementation, the repository is clean and the domain layer is explicitly out of scope. To roll back this redesign without touching logic, revert only the changed presentation/style/docs files listed in each task, restore the previous `src/data/updateHistory.ts` entry, and leave all `src/domain/*` and `src/data/{cards,topics,supplyProfiles}.ts` files unchanged. If a task fails three times with the same environment or product symptom, stop, preserve evidence in the report, and ask for direction rather than broadening the change.

## Definition of done

- [x] Initial and final audits are recorded with support Skill availability truthful.
- [x] 375px first action is visible; mobile feed is two columns with no horizontal overflow.
- [x] Stage progress, prompts, primary actions, evidence summaries, and reduced-motion states are visually consistent.
- [x] All existing learning goals, deterministic model rules, privacy boundaries, five missions, report semantics, and focus contracts remain intact.
- [x] All modified files are below 500 lines; lint/typecheck/tests/scripts/line/boundary/build evidence is recorded and the Playwright CLI limitation is documented.
- [x] Favicon is preserved, no imagegen asset is added, update history includes 2026-08-29.
- [x] VoiceOver and human child/device review are explicitly excluded or pending, never overstated.
- [x] No commit, push, release, deployment, or HVC registration occurs in this task.

## 2026-08-30 corrected-skill rerun addendum

이번 재실행은 2026-08-29 리디자인 결과를 기준선으로 삼습니다. 기존 변경을 되돌리거나 도메인 로직을 재작성하지 않고, 보완된 `$ui-ux-pro-max` 지침을 실제로 읽고 검색한 결과만 좁은 UI 보강에 반영합니다. 실행 시점의 프로젝트 규칙은 `AGENTS.md`·`EDUCATION_DESIGN.md`가 없는 상태이며, 기존 `design-system/MASTER.md`와 이 계획을 우선합니다.

### Required skill record

- `$education-webapp-redesign`: `/Users/kimhongnyeon/.codex/skills/education-webapp-redesign/SKILL.md` 및 `/Users/kimhongnyeon/.codex/skills/education-webapp-redesign/references/asset-safety.md`를 2026-08-30에 읽었습니다.
- `$impeccable`: available, `/Users/kimhongnyeon/.agents/skills/impeccable/SKILL.md`를 2026-08-30에 읽고 `context.mjs --target src/App.tsx`를 실행했습니다. 기존 시각 구현이 있으므로 컨텍스트 지시의 기존 프로젝트 경로를 따릅니다.
- `$ui-ux-pro-max`: available, `/Users/kimhongnyeon/.agents/skills/ui-ux-pro-max/SKILL.md`를 2026-08-30에 읽고 아래 로컬 검색을 실행했습니다.
- `$redesign-existing-projects`: available, `/Users/kimhongnyeon/.agents/skills/redesign-existing-projects/SKILL.md`를 2026-08-30에 읽었습니다.
- `$imagegen`: available, `/Users/kimhongnyeon/.codex/skills/imagegen/SKILL.md`를 2026-08-30에 읽었습니다. 자산 감사에서 일반 교육 일러스트가 필요하지 않아 실행하지 않습니다.

### Verified design intelligence

The following commands were run from the repository root on 2026-08-30 with Python 3.14.7:

```sh
python3 /Users/kimhongnyeon/.agents/skills/ui-ux-pro-max/scripts/search.py "elementary education algorithm literacy dashboard" --design-system -f markdown --persist -p "Recommendation Balance Lab" --output-dir "/Volumes/ External Drive 256G/Dev2/codex/recommendation-balance-lab" --variance 4 --motion 3 --density 5
python3 /Users/kimhongnyeon/.agents/skills/ui-ux-pro-max/scripts/search.py "child-friendly learning flow mobile primary action" --domain ux -n 8
python3 /Users/kimhongnyeon/.agents/skills/ui-ux-pro-max/scripts/search.py "React semantic stages focus preservation" --stack react -n 8
python3 /Users/kimhongnyeon/.agents/skills/ui-ux-pro-max/scripts/search.py "keyboard focus dialog reduced motion" --domain ux -n 8
python3 /Users/kimhongnyeon/.agents/skills/ui-ux-pro-max/scripts/search.py "elementary education readable sans" --domain typography -n 6
python3 /Users/kimhongnyeon/.agents/skills/ui-ux-pro-max/scripts/search.py "education learning light accessible" --domain color -n 6
```

The verified direction is balanced Minimalism/Swiss structure, subtle motion, mobile-first responsive layout, and teal/amber education accents. The generated recommendation suggested Fira Code/Fira Sans and remote Google Fonts; this project rejects that part because the app is Korean, static, privacy-local, and must not add external font/API requests. The existing system font stack, blue action token, teal evidence token, amber focus token, and light mode remain the explicit project-specific override.

### Task 8 — Persisted design intelligence and page override

**Files**

- `design-system/recommendation-balance-lab/MASTER.md` (generated by the verified search; do not force-overwrite)
- `design-system/recommendation-balance-lab/pages/learning-flow.md`
- `design-system/MASTER.md` only for a dated provenance note if needed

**Acceptance**

- The generated Master records the search result, while `pages/learning-flow.md` records the Korean/local-only/light-mode exceptions and existing learner-flow contracts.
- No remote font import, new dependency, or replacement of the project-specific Master occurs.

### Task 9 — Topic badge semantics

**Files**

- `src/components/common/TopicBadge.tsx`
- `src/components/common/TopicBadge.test.tsx`
- `src/features/comparison/DistributionTable.tsx`
- `src/features/exploration/ExplorationPanel.tsx`
- `src/features/exploration/ExplorationOutcome.tsx`
- `src/features/feed/RecommendationCard.tsx`
- `src/features/intro/IntroScreen.tsx`
- `src/components/common/TopicCountSummary.tsx`
- `src/App.test.tsx`

**TDD**

- [x] 실패 테스트: assert that the existing emoji topic glyph is marked `aria-hidden="true"` whenever the visible topic label is present, while `data-pattern` and label text remain available.
- [x] 최소 구현: make the topic glyph consistently decorative at the shared badge boundary; retain `TopicDefinition.icon` data and visible pattern/label semantics.
- [x] 통과 테스트: the new badge test, existing content-validation tests, full Vitest, and axe stage checks pass.

**Acceptance**

- No emoji is used as a standalone control or structural navigation icon. Topic glyphs remain decorative content beside a text label and do not duplicate screen-reader speech.
- Five topic labels, pattern hooks, card names, and existing data contracts remain unchanged.

### Task 10 — Tokenized interaction and data readability

**Files**

- `src/styles/tokens.css`
- `src/styles/global.css`
- `src/styles/components.css`
- `src/styles/motion.css`
- `src/components/layout/AppShell.test.tsx`
- `src/features/comparison/DistributionTable.test.tsx`
- `src/features/report/reportFlow.test.tsx`

**TDD**

- [x] 실패 테스트: assert that the AppShell exposes the project transition token hook and report data tables retain a tabular-numeral class/attribute without changing copy or roles.
- [x] 최소 구현: add semantic motion-duration tokens, `touch-action: manipulation` to actionable controls, stable pressed feedback that does not reflow neighbors, balanced heading wrapping, and tabular figures for evidence tables; keep reduced-motion overrides.
- [x] 통과 테스트: focused layout/report tests, `npm run lint`, `npm run typecheck`, and the existing reduced-motion tests pass.

**Acceptance**

- Every primary touch control remains at least 44px high with an 8px visual gap; pressed feedback is visible without changing surrounding layout.
- Tables remain readable at 320–375px, long Korean headings wrap instead of truncate, and all motion disappears or becomes static under `prefers-reduced-motion`.

### Task 10a — Update history record

**Files**

- `src/data/updateHistory.ts`
- `src/data/updateHistory.test.ts`
- `src/components/common/UpdateHistoryDialog.test.tsx`

**TDD**

- [x] 실패 테스트: require the 2026-08-30 improvement entry and its ISO date in the update-history dialog.
- [x] 최소 구현: append one chronological Korean summary covering badge semantics, tabular data, and motion tokens.
- [x] 통과 테스트: focused update-history tests pass and the chronological date invariant remains true.

**Acceptance**

- The footer `업데이트 내역` button exposes the 2026-08-30 entry without changing dialog roles or focus behavior.

### Task 11 — Final detector and evidence refresh

**Files**

- `work/education-webapp-redesign-audit.md` (append corrected-skill findings and resolution)
- `work/education-webapp-redesign-report.md` (append commands, detector output, and pending boundaries)

**TDD/verification**

- [x] `node /Users/kimhongnyeon/.agents/skills/impeccable/scripts/detect.mjs --json src/App.tsx src/components src/features src/styles tests/e2e` runs once after UI edits; each finding is verified in context and mechanical issues are fixed in the same bounded pass. Result: `[]`.
- [x] `npm run lint` (exit 0, zero warnings)
- [x] `npm run typecheck` (exit 0)
- [x] `npm run test:run` (37 files, 164 tests pass)
- [x] `npm run test:scripts` (7 tests pass)
- [x] `npm run check:lines` (all checked files below 500 lines)
- [x] `npm run check:boundaries` (no persistence/network violations)
- [x] `npm run build` (Vite production bundle succeeds)
- [x] Browser evidence at 320, 375, 768, and 1280px includes no horizontal overflow, visible CTA, focus/keyboard contracts, reduced motion, and zero console errors; VoiceOver remains excluded.

**Acceptance**

- The report records the corrected skill paths, generated design-system path, detector result, exact command results, and unresolved human/device review without claiming approval.
- No commit, push, release, deployment, HVC registration, or external service connection is run.
