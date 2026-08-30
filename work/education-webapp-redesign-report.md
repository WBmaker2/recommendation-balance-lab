# Recommendation Balance Lab Education Web App Redesign Report

작성일: 2026-08-29
범위: 기존 React/Vite 교육용 앱의 안전한 프레젠테이션·반응형 리디자인
공개 URL: `https://wbmaker2.github.io/recommendation-balance-lab/` (2026-08-30 `6d3e406` 배포 완료)

## 결과 요약

학습자가 첫 화면에서 `실험 시작`을 바로 찾도록 intro hero를 만들고, 다섯 미션의 현재 행동을 공통 prompt로 묶었습니다. 추천 피드는 4→3→2열 반응형으로 정리했으며, 완료 화면의 모델 경계 문장은 한 번만 표시됩니다. 선택·설정·공급 조건 계산, 카드 데이터, 상태 전이, 개인정보 경계는 수정하지 않았습니다.

## 구현된 변경

| 영역 | 변경 내용 | 확인 경로 |
| --- | --- | --- |
| 앱 프레임 | `app-shell`, `app-header`, `app-main`, `app-footer` landmark와 compact 5미션 진행판 | `src/components/layout/AppShell.tsx`, `StageProgress.tsx` |
| 첫 행동 | child-readable 질문, 30~40분 안내, local-only 한 줄, CTA 선배치, 안전·비목표 `details` | `src/features/intro/IntroScreen.tsx` |
| 피드 | 카드 주제→제목→요약→행동 그룹→토큰 근거, 데스크톱 4·태블릿 3·모바일 2열 | `src/features/feed/RecommendationFeed.tsx`, `RecommendationCard.tsx` |
| 미션 안내 | 현재 행동·설명·완료 조건을 표현하는 상태 없는 `StagePrompt` | `src/components/layout/StagePrompt.tsx`, `src/App.tsx` |
| 근거 표면 | 비교·탐색·균형·감사·규칙 패널을 evidence/action surface로 구분 | `src/features/{comparison,exploration,balance,audit,transparency,prediction}` |
| 보고서 | 1–4 작성 순서 요약, 제출 준비 pulse/정적 안내 | `src/features/report/ModelReport.tsx` |
| 완료 경계 | header의 공통 경계를 숨기고 완료 카드에 `MODEL_WARNING` 1회만 표시 | `AppShell.tsx`, `CompletionScreen.tsx` |
| 포커스 | 카드 이유 다이얼로그가 실제 트리거를 기억해 Escape·닫기 뒤 포커스 복원 | `RecommendationFeed.tsx`, `RecommendationCard.tsx`, `WhyThisCardDialog.tsx` |
| 모션 | intro·비교·보고서·완료의 gi-pulse와 reduced-motion 정적 안내 | `src/styles/motion.css`, 각 feature |
| 기록·자산 | 2026-08-29·30 개선 기록, favicon 원본 유지, 이미지 생성 없음 | `src/data/updateHistory.ts`, `work/education-webapp-redesign-assets.md` |

## TDD 및 자동 검증

각 변경은 실패 테스트를 먼저 추가하고 최소 구현 후 통과를 확인했습니다. 최종 로컬 결과:

- `npm run lint` — exit 0, 경고 없음
- `npm run typecheck` — exit 0
- `npm run test:run` — 37개 파일, 164개 테스트 통과
- `npm run test:scripts` — 7개 스크립트 테스트 통과
- `npm run check:lines` — 검사 대상 파일 500줄 미만
- `npm run check:boundaries` — persistence/network 경계 위반 0건
- `npm run build` — Vite production bundle 생성 성공

추가된 계약 테스트는 `AppShell.test.tsx`, `StagePrompt.test.tsx`, `StageProgress.test.tsx`, `IntroScreen.test.tsx`, `RecommendationFeed.test.tsx`, 보고서·업데이트 내역 테스트 및 375px 모바일 E2E 선택자에 있습니다.

## 브라우저 검증

MCP Playwright 로컬 브라우저에서 직접 수행했습니다. 모든 흐름에서 console error 0건을 확인했습니다.

| 화면 | 결과 |
| --- | --- |
| 320×812 | CTA y=707–754로 첫 viewport 안, `scrollWidth=305 ≤ innerWidth=320`, 피드 127.5px 2열·8장 |
| 375×812 | CTA y=612–660으로 첫 viewport 안, `scrollWidth=360 ≤ 375`, 피드 155px 2열·8장 |
| 768×900 | CTA viewport 안, 피드 207.66px 3열, 가로 넘침 없음 |
| 1280×900 | CTA viewport 안, 피드 258.5px 4열, 가로 넘침 없음 |
| 전체 흐름 | 선택 3회→비교→탐색→설정 3개→감사→보고서→완료, 완료 경계 1회 |
| 키보드 | 업데이트 dialog Escape/트리거 복귀, 카드 이유 dialog 포커스·Tab 순환·Escape/트리거 복귀 |
| reduced-motion | intro pulse `false`와 정적 안내, 피드 animated transition 0개·정적 분포 표 표시 |
| 자산 | `http://127.0.0.1:4178/favicon.svg` HTTP 200, 외부 이미지/API 요청 없음 |

저장소의 `PLAYWRIGHT_PORT=4176 npm run test:e2e`도 시도했으나 이 macOS 환경에서 Chromium worker가 `MachPortRendezvousServer ... Permission denied (1100)` 및 `SIGTRAP`으로 종료되었습니다. 동일 명령을 반복하지 않고 MCP 브라우저 증거로 대체했으며, CI/Linux Chromium 실행은 별도 환경에서 다시 확인해야 합니다.

## 설계·안전 대조

- 학습 목표(6실05-04/6실05-05, 피드백 고리, 다양성·관련성, 모형 한계)를 기존 문장·도메인 계산으로 유지했습니다.
- 5개 중립 주제·40개 카드·8장 피드·5개 미션과 보고서 판정은 변경하지 않았습니다.
- 실제 취향·검색 기록·계정·쿠키를 묻거나 저장·전송하지 않으며 서버·analytics·ranking·TTS·오디오·공유 기능을 추가하지 않았습니다.
- 밝은 라이트 모드, 키보드·native controls·44px 터치 영역·`aria-current`·`aria-pressed`·오류 alert 계약을 유지했습니다.
- `gi-pulse`는 학습 행동을 안내하는 보조 신호이며 `prefers-reduced-motion`에서는 정적 cue로 대체됩니다.
- 2026-08-29 구현 세션 기준 지원 Skill `impeccable`, `ui-ux-pro-max`, `redesign-existing-projects`는 세션에 없어 `unavailable/not run`으로 기록했습니다. 2026-08-30 재요청의 현재 설치 상태는 아래 사전 점검에 별도로 기록했습니다.
- `imagegen`은 일반 교육용 이미지 자산이 없어 실행하지 않았고, 정체성 자산 `public/favicon.svg`는 그대로 보존했습니다.

## 남은 검토와 범위 경계

- 실제 아동 관찰 테스트, 교사·보호자 검토, 물리 모바일 기기, Safari, 색상 대비·실제 확대 검토는 pending입니다.
- VoiceOver 구현 및 검증은 사용자 지시에 따라 제외했습니다.
- Git 커밋·브랜치 푸시·GitHub Pages 배포는 아래 release evidence에서 완료했으며, HVC 등록/동기화는 실행하지 않았습니다.

## 관련 문서

- [리디자인 감사](./education-webapp-redesign-audit.md)
- [리디자인 계획](./education-webapp-redesign-plan.md)
- [디자인 시스템](../design-system/MASTER.md)
- [자산 기록](./education-webapp-redesign-assets.md)

## 2026-08-30 재요청 사전 점검 (초기 게이트 기록)

- 프로젝트 규칙 확인: `AGENTS.md`와 `EDUCATION_DESIGN.md`는 저장소에 없으며, `design-system/MASTER.md`는 기존 리디자인 기준으로 존재합니다.
- 기존 계획 확인: `work/education-webapp-redesign-plan.md`의 Task 0–7과 Definition of Done이 완료 상태이며, 현재 작업 트리는 해당 구현·문서 변경을 보존하고 있습니다.
- `$impeccable`: available — `/Users/kimhongnyeon/.agents/skills/impeccable/SKILL.md`를 2026-08-30에 읽었습니다. 이번 재요청에서는 이미 완료된 구현을 중복 수정하지 않아 별도 실행하지 않았습니다.
- `$ui-ux-pro-max`: 초기 게이트에서는 unavailable로 판정했으나, 사용자가 보완된 `/Users/kimhongnyeon/.agents/skills/ui-ux-pro-max/SKILL.md`를 제공한 뒤 현재 재실행에서 available로 확인했습니다. 현재 실행 기록은 아래 보완 스킬 섹션에 남깁니다.
- `$redesign-existing-projects`: available — `/Users/kimhongnyeon/.agents/skills/redesign-existing-projects/SKILL.md`를 2026-08-30에 읽었습니다. 누락된 디자인 시스템 역할을 대신해 구현하지 않았습니다.
- `$imagegen`: available — `/Users/kimhongnyeon/.codex/skills/imagegen/SKILL.md`를 2026-08-30에 읽었습니다. 자산 감사 결과 새 일반 이미지가 필요하지 않아 생성하지 않았습니다.

초기 게이트 시점에는 필수 하위 역할 누락으로 추가 수정을 보류했으며, 정확한 `$ui-ux-pro-max` Skill 제공 후 아래의 보완된 계획·구현·검증을 진행했습니다.

## 2026-08-30 보완 스킬 재실행 구현·검증

### 실행한 역할과 설계 근거

- `$education-webapp-redesign`: `/Users/kimhongnyeon/.codex/skills/education-webapp-redesign/SKILL.md`와 `references/asset-safety.md`를 전체 확인했습니다.
- `$ui-ux-pro-max`: `/Users/kimhongnyeon/.agents/skills/ui-ux-pro-max/SKILL.md`를 전체 확인하고 `search.py`로 교육용 알고리즘 리터러시 대시보드, 아동 친화 모바일 흐름, React 포커스 보존, 키보드·dialog·reduced-motion, 한국어 가독성, 라이트 접근성 검색을 실행했습니다. 디자인 시스템 결과는 [`design-system/recommendation-balance-lab/MASTER.md`](../design-system/recommendation-balance-lab/MASTER.md)에 저장하고, 프로젝트 예외는 [`pages/learning-flow.md`](../design-system/recommendation-balance-lab/pages/learning-flow.md)에 기록했습니다.
- `$impeccable`: `context.mjs --target src/App.tsx`로 기존 화면을 이어서 다듬는 범위와 로컬 시스템 폰트·기존 자산 권위를 확인했으며, UI 수정 뒤 `detect.mjs --json`을 한 번 실행한 결과는 `[]`입니다.
- `$redesign-existing-projects`: 기존 React/Vite 표면의 안전한 점진 리디자인과 의미·상태 보존 원칙을 적용했습니다.
- `$imagegen`: 자산 감사에서 `public/favicon.svg` 외 학습용 이미지가 필요하지 않아 호출하지 않았습니다. 새 이미지·외부 폰트·네트워크 의존성은 추가하지 않았습니다.

### 보완 구현

1. `TopicBadgeProps` 경계에서 `TopicDefinition.icon`은 보이는 주제 라벨을 보조하는 장식으로 고정하고 아이콘 span에 `aria-hidden="true"`를 부여했습니다. `data-pattern`, 라벨, 카드 제목과 데이터 계약은 유지했습니다. (`src/components/common/TopicBadge.tsx`, `TopicBadge.test.tsx`)
2. `AppShellProps` 루트에 `data-motion-profile="subtle"` 계약을 노출하고, `--motion-duration-fast`, `--motion-duration-standard`, `--motion-ease-out` 토큰을 버튼·피드 전환에 연결했습니다. `touch-action: manipulation`, 눌림 피드백, balanced heading wrapping, `tabular-nums`를 증거 표에 적용했으며 reduced-motion에서는 전환을 정적으로 바꿉니다. (`src/components/layout/AppShell.tsx`, `src/styles/{tokens,global,motion}.css`)
3. `DistributionTableProps` 표에 `class="data-table"`와 `data-number-format="tabular"`를 추가해 주제별 숫자 열이 일정한 폭으로 읽히도록 했습니다. (`src/features/comparison/DistributionTable.tsx`, `DistributionTable.test.tsx`)
4. 실제 보완 날짜와 내용을 `UPDATE_HISTORY`에 추가하고 update-history dialog의 ISO 날짜 렌더링 검증을 갱신했습니다. (`src/data/updateHistory.ts`, `src/data/updateHistory.test.ts`, `src/components/common/UpdateHistoryDialog.test.tsx`)

### 최종 자동 검증

- `npm run lint` — exit 0, 경고 0건
- `npm run typecheck` — exit 0
- `npm run test:run` — 37개 파일, 164개 테스트 통과
- `npm run test:scripts` — 7개 테스트 통과
- `npm run check:lines` — 검사 대상 파일 모두 500줄 미만
- `npm run check:boundaries` — persistence/network 경계 위반 0건
- `npm run build` — Vite production bundle 생성 성공
- `git diff --check` — 공백 오류 0건

### MCP 브라우저 증거

- 320×812: `scrollWidth=305`, intro CTA y=707–754, 가로 넘침 없음
- 375×812: `scrollWidth=360`, intro CTA y=612–660, 피드 2열·8장·최소 주요 액션 높이 47.19px
- 768×812: `scrollWidth=753`, 가로 넘침 없음
- 1280×812: `scrollWidth=1265`, 가로 넘침 없음
- 전체 학습 흐름: 카드 선택 3회 → 예측 → 비교 → 탐색 → 균형 설정 3개 → 감사 → 보고서 → 완료를 실제 브라우저에서 끝까지 수행했습니다. 완료 화면에 모델 경계 1회가 보이고 오류 배열은 비어 있습니다.
- 키보드: 업데이트 내역과 기록 지우기 dialog의 Enter/Escape·트리거 복귀, 카드 이유 dialog의 열림 포커스·Tab 내부 유지·Escape 후 트리거 복귀가 모두 `true`로 확인되었습니다.
- reduced-motion: `data-gi-pulse` 정적 안내가 유지되고 `.feed-transition` 0개, `data-motion-profile="subtle"` 1개, 증거 표 1개, 콘솔 오류 0건을 확인했습니다.
- `browser_console_messages(level=error)` 결과: 오류 0건, 경고 0건

`PLAYWRIGHT_PORT=4176 npm run test:e2e`는 기존과 같이 macOS Chromium의 `MachPortRendezvousServer ... Permission denied (1100)`/`SIGTRAP` 환경 오류로 실행하지 않았습니다. 동일 명령을 반복하지 않고 MCP 브라우저 증거를 사용했으며, CI/Linux Chromium 실행은 별도 게이트입니다.

### 범위 경계

실제 초등학생 관찰·교사/보호자 검토·물리 모바일 기기·Safari·색상 대비·실제 확대는 아직 수행하지 않았습니다. VoiceOver 구현과 검증은 사용자 지시에 따라 제외했습니다. HVC 등록·동기화와 외부 서비스 연결은 실행하지 않았습니다.

## 2026-08-30 커밋·푸시·Pages 배포 증거

- `codex/recommendation-balance-lab-redesign` 브랜치에 `6d3e40666ef2adf8157b98541e5322c597a4f254` (`feat: complete recommendation balance lab redesign`)을 커밋하고 원격 기능 브랜치에 푸시했습니다.
- 기능 브랜치를 `main`에 fast-forward 병합한 뒤 `main`을 원격에 푸시했습니다. 이 푸시가 [GitHub Actions Deploy to GitHub Pages 실행 33292214073](https://github.com/WBmaker2/recommendation-balance-lab/actions/runs/33292214073)을 시작했고 `build`·`deploy` job 모두 성공했습니다.
- Pages API에서 `build_type=workflow`, `source.branch=main`, `https_enforced=true`를 확인했습니다.
- [공개 학습자 화면](https://wbmaker2.github.io/recommendation-balance-lab/)은 HTTP 200이며 제목 `추천 알고리즘 균형 실험실`, 상대 JS/CSS asset, favicon HTTP 200을 확인했습니다. 공개 375×812 브라우저에서 첫 CTA가 보이고 가로 넘침 없이 피드 2열·증거 표가 렌더링되며 콘솔 오류·경고가 없었습니다.
- workflow annotation의 Node.js 20 deprecation은 실패가 아닌 경고로 남아 있습니다. HVC 등록/동기화는 별도 요청 없이는 실행하지 않았습니다.
