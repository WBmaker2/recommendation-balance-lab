# Recommendation Balance Lab Redesign Audit

감사일: 2026-08-29
대상: `https://wbmaker2.github.io/recommendation-balance-lab/`
모드: `full` 사전 감사
지원 Skill 상태: `impeccable` unavailable/not run, `ui-ux-pro-max` unavailable/not run, `redesign-existing-projects` unavailable/not run. 이 문서는 현재 앱과 저장소 증거를 직접 확인한 감사입니다.

## 조사 범위와 근거

- 저장소 상태: `main` 브랜치 clean, React 19 + TypeScript + Vite 정적 SPA, 기존 npm 스크립트와 Vitest/Playwright/axe 검증을 유지하는 구조입니다.
- 프로젝트 규칙 문서: 저장소 루트에 `AGENTS.md`, `EDUCATION_DESIGN.md`, `design-system/MASTER.md`가 없습니다. 대신 `2026-08-26-recommendation-balance-lab-design.md`, `2026-08-28-recommendation-balance-lab-improvement-plan.md`, `docs/qa-checklist.md`를 기준 문서로 사용합니다.
- 최근 공개 화면: 제목, 초등 5~6학년·30~40분 대상, 선택→추천 분포 피드백 고리, 5개 중립 주제, 개인정보·모형 한계 안내를 확인했습니다.
- 자동 브라우저 관찰: Playwright MCP로 1440×900과 375×812 화면을 열고 시작부터 보고서 단계까지 실제 클릭 흐름을 수행했습니다. 콘솔 error는 0건이었습니다.
- 자산 검색: `public/favicon.svg`만 정적 이미지 자산으로 확인되며 JSX/CSS의 추가 이미지 import, `srcset`, 배경 이미지, preload는 없습니다.

## 현재 강점

1. **학습 목표와 모델 경계가 분명합니다.** 추천을 실제 서비스 성능으로 포장하지 않고, 선택 기록·다양성 설정·콘텐츠 공급 조건을 함께 비교합니다.
2. **도메인 계약이 안정적입니다.** 5개 주제, 40개 카드, 8장 피드, 결정적 결과, 보고서 검증과 개인정보 경계가 별도 파일과 테스트로 분리되어 있습니다.
3. **접근성 기본기가 있습니다.** native button/radio/checkbox/slider, 건너뛰기 링크, `:focus-visible`, dialog Escape/포커스 복귀, reduced-motion 대체, axe 단계 검증이 이미 존재합니다.
4. **변경 설명과 안전 문구가 있습니다.** 업데이트 내역 버튼, 가상 모델 경고, 실제 기록·쿠키·계정 미수집 안내가 제공됩니다.

## 우선순위별 발견 사항

### P1 — 모바일 첫 행동이 너무 늦게 나타남

- 근거: 375×812에서 intro 문서 높이 2016px, `실험 시작` 버튼의 세로 위치가 1803px입니다. header만 476px이며 첫 viewport에는 학습 목표 일부만 보입니다.
- 학습 영향: 학생이 무엇을 눌러야 하는지 한 번에 찾기 어렵고, 안전·비목표 설명을 모두 지나야 활동을 시작할 수 있습니다.
- 개선: 첫 hero에 한 문장 목표, 오늘의 질문, 예상 시간, `실험 시작` CTA를 묶습니다. 상세 안전·비목표 내용은 읽을 수 있는 `details`로 유지하고 CTA를 중복하지 않습니다.
- 수용 기준: 375×812에서 새로고침 직후 CTA가 viewport 안에 있고, 개인정보·모형 경계는 DOM과 펼침 상태에서 계속 확인할 수 있습니다.

### P1 — 추천 피드가 1열 고정되어 학습 흐름이 과도하게 길어짐

- 근거: 375×812에서 choice 단계 문서 높이가 4587px이고, 8개 카드가 각각 약 351px 높이로 세로 배치됩니다. 3회 선택 뒤 예측 패널까지 여러 화면을 이동해야 합니다.
- 학습 영향: 카드 선택이라는 한 가지 행동보다 스크롤 부담이 커지고, 다음 목록 예측의 원인과 결과 연결이 약해집니다.
- 개선: 모바일 피드를 2열 카드 그리드로 바꾸고 카드 내부를 `TopicBadge → 제목/요약 → 선택·이유 액션` 순서의 compact layout으로 정리합니다. 버튼은 44px 이상을 유지하며 현재 선택 슬롯의 포커스 복귀는 보존합니다.
- 수용 기준: 375px에서 피드가 2열이고 가로 넘침이 없으며, 선택·이유 버튼이 각 카드 안에서 이름과 상태를 유지합니다. 세 번째 선택 뒤 예측 heading focus/scroll 계약은 그대로 통과합니다.

### P1 — 단계 진행판과 모델 경계가 행동보다 먼저 화면을 점유함

- 근거: 모바일 header 안에 5개 진행 항목과 장문 모델 안내가 세로로 쌓여 main 시작점이 542px입니다. 모든 단계가 같은 시각적 무게로 보여 현재 행동이 즉시 드러나지 않습니다.
- 학습 영향: 진행 위치를 알려 주는 요소가 오히려 활동 진입을 늦추고, 초등 학습자가 현재 미션과 해야 할 일을 구분하기 어렵습니다.
- 개선: 진행판을 데스크톱 5열, 모바일 2열 compact rail로 재배치하고 현재 단계에만 accent surface/상태 배지를 적용합니다. 모델 경계는 짧은 한 줄 요약과 펼침 가능한 설명으로 나눕니다.
- 수용 기준: 모바일 header가 현재 구현보다 짧아지고, `aria-current="step"`, 완료·진행 중·예정 텍스트/아이콘은 유지됩니다.

### P2 — 전체 화면이 동일한 흰 카드와 기본 버튼으로 보여 우선순위가 약함

- 근거: `src/styles/components.css`는 대부분 `background: white`, 단일 border, 기본 버튼 규칙만 사용하며 AppShell/단계별 hero·prompt·action 그룹 클래스가 없습니다.
- 학습 영향: 설명, 관찰 근거, 필수 행동이 같은 무게로 보여 정보가 많은 단계에서 시선이 분산됩니다.
- 개선: 라이트 모드 토큰을 유지한 채 `app-shell`, `stage-hero`, `action-panel`, `evidence-card`, `secondary-action` 역할을 추가하고 색·간격·반경·타이포그래피를 토큰화합니다.
- 수용 기준: 각 화면에서 primary CTA 하나가 시각·DOM 순서상 가장 먼저 인식되고, 보조 설명과 근거 details가 분리됩니다.

### P2 — 미션별 “지금 할 일”이 제목과 일반 문장 사이에 묻힘

- 근거: choice/comparison/exploration/audit 단계의 안내가 단순 `<p>`로 시작하며, 현재 행동·완료 조건·다음 행동을 묶는 공통 prompt 패턴이 없습니다.
- 학습 영향: 초등 학습자가 라디오/카드/저장 버튼 중 무엇을 먼저 해야 하는지 화면마다 다시 해석해야 합니다.
- 개선: `StagePrompt` 역할을 하는 공통 스타일/구조를 도입해 `현재 할 일`, 짧은 이유, 성공 시 다음 단계가 보이도록 합니다. 상태 문구는 `role="status"`/`role="alert"` 의미를 보존합니다.
- 수용 기준: 각 미션 첫 viewport에 한 가지 primary action과 완료 조건이 보이고, 오답·검증 오류는 기존 focus/scroll과 함께 읽힙니다.

### P2 — 완료 단계에서 모델 경계가 중복 노출될 가능성

- 근거: `AppShell`이 `complete` 단계에도 `ModelBoundaryNotice`를 렌더링하고 `CompletionScreen`도 `MODEL_WARNING`을 렌더링합니다.
- 학습 영향: 같은 경고가 연속으로 읽혀 결과 문장과 확인한 증거의 집중도가 낮아집니다.
- 개선: 완료 단계 header에서는 공통 경계를 숨기고 완료 카드의 짧은 경계 문장 하나만 남깁니다. intro와 진행 중 단계의 경계는 유지합니다.
- 수용 기준: complete DOM에서 동일한 `MODEL_WARNING`이 한 번만 나오고, intro/진행 단계에서는 기존 경계 안내가 남습니다.

### P2 — 보고서 단계의 세로 밀도와 선택 순서가 무거움

- 근거: 375×812에서 report 단계 문서 높이가 4147px입니다. 많은 fieldset과 세 개의 scenario article이 동일한 흐름으로 이어집니다.
- 학습 영향: 보고서 작성의 핵심인 변화 방향·영향 조건·목적·근거 선택이 긴 정보 목록에 묻힐 수 있습니다.
- 개선: 보고서 상단에 `보고서 작성 순서` 1–4 요약과 선택된 snapshot/metric의 짧은 summary를 배치하고, 각 scenario의 상세 표는 닫힌 details로 유지합니다. fieldset 간 간격과 legend 강조를 통일합니다.
- 수용 기준: 필수 선택 순서가 상단에서 읽히며, 빈 제출 오류가 첫 누락 필드로 이동하는 기존 계약을 유지합니다.

### P3 — 이미지 자산은 자동 생성·교체 대상이 아님

- 근거: `public/favicon.svg`는 정체성을 나타내는 작은 브랜드/앱 아이콘이고, 학습 사실을 전달하는 사진·도식·차트 자산은 없습니다.
- 판정: favicon은 자동 생성·교체 금지에 가까운 정체성 자산으로 유지합니다. 새 장식 이미지는 학습 목표를 가리지 않는 현재 구조에서 필요성이 낮아 생성하지 않습니다.
- 개선: 없음. `work/education-webapp-redesign-assets.md`에 유지 판정과 `imagegen not run`을 기록합니다.
- 수용 기준: 기존 favicon 경로와 HTTP 200을 유지하고, 이미지가 없다는 이유로 장식용 의존성을 추가하지 않습니다.

## 학습 목표·안전·범위 대조

| 설계 기준 | 현재 확인 | 리디자인에서 지킬 계약 |
|---|---|---|
| 6실05-04/6실05-05와 디지털 시민성 | intro와 README에 명시 | 문구를 짧게 다듬어도 선택·데이터·AI 영향과 책임 있는 관점을 유지 |
| 선택 → 추천 분포 피드백 | 3회 선택, 예측, 전후 표 | 도메인 계산·상태 전이·8장 피드 변경 없음 |
| 선택·설정·공급 조건 구분 | balance/audit/report에 존재 | 각 단계의 evidence card와 prompt로 구분을 더 선명하게 함 |
| 단일 정답 금지 | 목적별 설정 비교와 보고서 | 목적별 선택을 계속 유효한 학습 증거로 인정 |
| 개인정보·안전 | 기록·쿠키·계정 미수집, 실제 서비스 비재현 | 새 UI에도 동일 문구와 local-only 경계 유지 |
| 접근성 | native controls, keyboard, axe, reduced motion | 의미·포커스·탭 순서·44px 터치 영역을 변경하지 않음 |
| VoiceOver | 이전 요청으로 범위 제외 | 구현·검증하지 않고 별도 사람 검수 상태로 보고 |
| MVP 범위 | 5주제·40카드·5미션 구현 | 새 외부 서비스·이미지·의존성·서버 추가 없음 |

## 다음 구현 방향

1. 누락된 규칙 문서를 추측해 채우지 않고, 이 감사와 기존 설계를 입력으로 `work/education-webapp-redesign-plan.md`와 `design-system/MASTER.md`를 먼저 작성합니다.
2. 계획 승인 상태를 문서에 남긴 뒤 AppShell/StageProgress/IntroScreen을 먼저 정리해 첫 행동과 진행판을 개선합니다.
3. RecommendationFeed/RecommendationCard의 compact responsive layout을 적용하고 375px 회귀를 추가합니다.
4. 비교·균형·감사·보고서 화면의 prompt/action/evidence 스타일만 조정하며 도메인 파일은 수정하지 않습니다.
5. 자산은 favicon 유지로 기록하고 imagegen은 호출하지 않습니다.

## 리디자인 완료 상태

2026-08-29 구현 결과:

- `AppShell`, `StageProgress`, `StagePrompt`로 헤더·미션 진행·현재 행동 위계를 정리하고 완료 화면의 `MODEL_WARNING` 중복을 제거했습니다.
- intro hero의 `실험 시작` CTA를 첫 화면에 배치하고 안전·비목표 설명을 닫힌 `details`로 보존했습니다.
- 추천 피드를 데스크톱 4열·태블릿 3열·375px 모바일 2열로 바꾸고 카드 행동을 한 그룹으로 묶었습니다.
- 비교·탐색·균형·감사·보고서 화면에 현재 행동 prompt와 근거 표면을 추가하고 보고서 작성 1–4 순서를 먼저 보여 줍니다.
- 다이얼로그 트리거를 명시적으로 전달해 실브라우저 Escape/닫기 뒤 포커스 복귀를 보강했습니다.
- `2026-08-29` 업데이트 내역을 추가했고 `public/favicon.svg`는 원본 그대로 유지했습니다. `imagegen`은 실행하지 않았습니다.

자동 검증은 lint, typecheck, Vitest 35개 파일·162개 테스트, 스크립트 테스트 7개, 줄 수·경계 검사, production build가 통과했습니다. Playwright CLI는 이 macOS 환경의 Chromium `MachPortRendezvousServer` 권한 오류로 실행되지 않았지만, MCP 브라우저에서 320·375·768·1280px, 전체 학습 흐름, 키보드 포커스, reduced-motion, 콘솔 오류 0건, favicon 200 응답을 확인했습니다. 실제 아동 관찰, 물리 기기·Safari·색상·확대 검토와 VoiceOver는 여전히 별도 보류/제외 상태입니다.

## 2026-08-30 보완 스킬 재실행 판정

정확한 `$ui-ux-pro-max` Skill이 제공된 뒤 `/Users/kimhongnyeon/.agents/skills/ui-ux-pro-max/SKILL.md`를 전체 읽고 로컬 검색을 실행했습니다. 검색 결과는 교육용 Minimalism/Swiss 구조, teal·amber 보조 색, 모바일 우선 흐름, subtle motion, 명확한 focus 계약이었으며, 원격 Fira/Google Fonts 제안은 한국어·정적·local-only 안전 경계 때문에 채택하지 않았습니다. 결과는 `design-system/recommendation-balance-lab/MASTER.md`와 `pages/learning-flow.md`에 보존했습니다.

보완 범위는 다음 세 계약으로 한정했습니다.

- `TopicBadgeProps`: visible topic label과 중복되는 아이콘을 `aria-hidden="true"` 장식으로 고정하고 `data-pattern`·라벨·카드 데이터는 유지했습니다.
- `AppShellProps`: `data-motion-profile="subtle"`를 노출하고 motion duration/easing 토큰, `touch-action: manipulation`, 눌림 피드백, heading wrap을 연결했습니다.
- `DistributionTableProps`: `data-table`와 `data-number-format="tabular"`를 추가해 증거 숫자 열의 가독성을 안정화했습니다.

실패 테스트를 먼저 추가한 뒤 최소 구현과 통과 검증을 진행했습니다. `TopicBadge.test.tsx`와 `DistributionTable.test.tsx`, `AppShell.test.tsx`를 포함해 최종 `npm run test:run`은 37개 파일·164개 테스트를 통과했습니다. `$impeccable` detector는 UI 수정 후 한 번 실행했고 결과는 `[]`입니다.

MCP 브라우저에서 320·375·768·1280px의 CTA·가로 넘침·2열 모바일 피드, 전체 5개 미션, dialog 포커스/Tab/Escape, reduced-motion 정적 cue와 콘솔 오류 0건을 확인했습니다. Playwright CLI는 macOS Chromium `MachPortRendezvousServer ... Permission denied (1100)`/`SIGTRAP` 환경 제약으로 대체했으며, VoiceOver·실제 아동·실기기/Safari·색상 대비·확대 검토는 이 감사의 승인 범위가 아닙니다. 이번 보완 실행에서는 커밋·푸시·배포·HVC 등록을 하지 않았습니다.
