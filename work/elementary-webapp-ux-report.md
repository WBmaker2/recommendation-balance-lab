# Elementary Web App UX Improvement Report

## 판정 요약

- 모드: `full`
- 대상: `/Volumes/ External Drive 256G/Dev2/codex/recommendation-balance-lab`
- 기존 공개 기준 URL: `https://wbmaker2.github.io/recommendation-balance-lab/`
- 점검일: 2026-08-31 (Asia/Seoul)
- Stage 0: `ready` — [elementary-webapp-ux-bootstrap.md](./elementary-webapp-ux-bootstrap.md)
- 주 페르소나: 초등 5~6학년 서윤(10~12세), 가드레일 초등 3~4학년 준호(8~10세)
- 브라우저 뷰포트: 320×800, 375×812, 1280×900; 최종 전체 흐름은 375×812에서 재실행
- 최종 상태: `DONE_WITH_CONCERNS`
- 수용 게이트: `conditional` — P0/P1 없음, 구현·브라우저 게이트 통과, 실제 학생·교사·Safari/실기기·정량 대비 검토는 미실행
- 100점 보조 점수: `not run` — 관찰 자료는 충분하지만 실제 학생 표본과 정량 색상 대비 측정을 수행하지 않아 점수를 추정하지 않음

## 점검 범위와 학습자 흐름

기존 학습 목표와 결정적 추천 모델을 유지한 채 다음 흐름을 같은 시작 상태에서 확인했습니다.

`intro → choice(같은 자리 카드 3회) → prediction → comparison → exploration → balance(설정 3개) → audit → report → complete → 새 실험 시작`

MCP Playwright로 공개 기준 화면을 먼저 관찰하고, 변경 후에는 격리된 로컬 Vite 서버(`http://127.0.0.1:4179/`)에서 동일 흐름을 재실행했습니다. 375×812 모든 단계에서 `scrollWidth === clientWidth`였고, 비교 오답·감사 오답·빈 보고서 제출 후 회복·완료 후 reset을 실행했습니다. 실제 초등학생 사용성 연구 결과가 아닌 시뮬레이션 학습자 패널임을 명시합니다.

## P0–P3 이슈 장부

| ID | 심각도 | 이슈 | 상태 | 해결 및 증거 |
| --- | --- | --- | --- | --- |
| EDU-UX-001 | P2 | 모바일에서 6열 토큰 계산표가 항상 펼쳐져 핵심 행동보다 읽기 부담이 큼 | fixed | `RuleTransparencyPanel`에 쉬운 토큰 설명을 먼저 두고 표를 `토큰 계산표 자세히 보기` native details로 이동. 닫힘/열림·기존 headers/수치를 Vitest와 375×812 MCP에서 확인 |
| EDU-UX-002 | P2 | 미션 3 탐색과 미션 5 감사의 핵심 행동에 `gi-pulse`가 없음 | fixed | 탐색 첫 후보와 선택 완료 감사 버튼에 일반 모션 pulse를 추가하고 reduced-motion에서는 정적 cue로 대체. feature 테스트와 MCP reduced-motion에서 확인 |
| EDU-UX-003 | P2 | `포커스 주제`, `토큰`, `다양성 토큰`의 첫 사용 풀이 부족 | fixed | 예측·균형·규칙 투명창에 초등 학습자용 풀이를 추가하고 range에 `aria-describedby`를 연결. 언어 장부·feature 테스트·DOM 확인 통과 |
| — | P0/P1 | 즉각적인 안전·개인정보 위험 또는 핵심 경로 차단 | 0건 관찰 | 전체 흐름, reset, 빈 제출 focus, 개인정보/네트워크 경계 검사 통과 |

### 언어 감사 장부

- 상세 변환 장부: [elementary-webapp-ux-language-audit.md](./elementary-webapp-ux-language-audit.md)
- `LANG-001`: 토큰을 “주제마다 붙는 점수”로 풀이하고 카드 8장 배분과 연결했습니다.
- `LANG-002`: 포커스 주제를 “방금 같은 자리에 세 번 고른 주제”로 풀이했습니다.
- `LANG-003`: 다양성 토큰을 “다른 주제를 보여 주는 점수”로 설명하고 0/2의 차이를 적었습니다.
- 기존 오답·빈 제출·완료 문구는 이미 사실 기반 회복을 제공하므로 문장 취향만으로 바꾸지 않았습니다.
- 교과 사실·정답 조건·계산식·accessible name은 유지했습니다. 실제 학생의 문장 재진술은 표본 없이 검증하지 않았습니다.

### 이해 probe 결과

| Probe | 관찰 | 판정 |
| --- | --- | --- |
| 용어 설명 | 변경 후 DOM에 토큰·포커스 주제·다양성 토큰 풀이가 첫 관련 화면에 표시됨 | 정적 probe 통과; 실제 학생 재진술은 미실행 |
| 결과 예측 | 예측 답을 선택한 뒤 분포 비교로 이동하며, 틀린 비교 답도 표 숫자 alert와 함께 수정 가능 | 통과 |
| 회복 행동 | 감사 오답에서 status 안내 후 다른 원인을 선택할 수 있고, 빈 보고서 제출은 첫 누락 묶음으로 focus/scroll | 통과 |
| 다음 행동 | 완료 화면의 `새 실험 시작`이 intro로 결정적으로 reset | 통과 |

## 시뮬레이션 결정·모델 경계

- 판정: `not-needed` — [elementary-webapp-ux-simulation-decision.md](./elementary-webapp-ux-simulation-decision.md)
- 기존 DOM 실험이 예측→조작→관찰→설명→재시도/reset 루프를 이미 제공합니다. Canvas/WebGL, 시간 진행, 랜덤 seed, pause/step을 추가할 학습 근거가 없습니다.
- 모델 경계: 5개 주제·40개 카드·8장 피드, 고정된 토큰 계산과 공급 프로필 비교를 보여 주는 교육용 결정 모델입니다. 실제 플랫폼 추천 품질·공정성·개인 취향을 측정하거나 보장하지 않습니다.
- 개인정보 경계: 실제 취향·검색 기록·계정·쿠키·사용 시간·중독 여부를 수집·저장·전송하지 않습니다. `check:boundaries`에서 production persistence/network 위반 0건입니다.

## 구현 변경

### 학습자 UI

- `src/features/transparency/RuleTransparencyPanel.tsx`: 토큰 쉬운 풀이와 접힌 계산표 disclosure.
- `src/features/prediction/PredictionPanel.tsx`: 포커스 주제 첫 설명.
- `src/features/balance/BalanceControlPanel.tsx`: 다양성 토큰 설명과 `aria-describedby`.
- `src/features/exploration/ExplorationPanel.tsx`: 첫 탐색 행동 pulse와 reduced-motion 정적 안내.
- `src/features/audit/SupplyAuditPanel.tsx`: 활성 감사 행동 pulse와 reduced-motion 정적 안내.
- `src/styles/components.css`: 용어 힌트의 기존 색상 토큰과 정적 안내 스타일 연결.
- `src/data/updateHistory.ts`: 2026-08-31 개선 내역 기록.

### 회귀 증거

- `src/features/transparency/ruleTransparencyFlow.test.tsx`
- `src/features/prediction/predictionFlow.test.tsx`
- `src/features/exploration/explorationFlow.test.tsx`
- `src/features/audit/auditFlow.test.tsx`
- `src/features/balance/balanceFlow.test.tsx`
- `src/App.test.tsx`
- `src/data/updateHistory.test.ts`
- `src/components/common/UpdateHistoryDialog.test.tsx`

기존 도메인 계산, reducer action, 카드·주제 데이터, report validation, 개인정보 계약은 변경하지 않았습니다. 변경·신규 source 파일은 모두 500줄 미만입니다.

## 품질·브라우저 증거

### 자동 게이트

```text
npm run quality
→ exit 0
→ lint 0 warnings/errors
→ typecheck exit 0
→ script tests 7 passed
→ line check: all checked source files under 500 lines
→ boundary check: no persistence or network boundary violations
→ Vitest: 40 files / 169 tests passed
→ production build: 73 modules transformed, dist generated
```

추가로 `git diff --check`도 통과했고, 계획에서 금지한 자리표시자 패턴 검사는 실제 감사·계획·보고 문서에서 0건이었습니다(검사 문구 자체는 결과에서 제외). 자동 생성 Playwright 후보 문서는 report 본문에 포함하지 않고 triage 자료로만 보존했습니다.

### MCP Playwright 최종 확인

- 로컬 375×812에서 전체 학습 흐름을 동일 순서로 완료했습니다.
- `RuleTransparencyPanel` 계산표는 기본 닫힘이며 summary를 열었을 때만 6개 columnheader와 기존 수치를 읽을 수 있습니다.
- 탐색 첫 `낯선 주제 열기`는 `class="gi-pulse"`, `data-gi-pulse="true"`; 두 번째·세 번째 후보에는 pulse가 없습니다.
- 감사에서 `콘텐츠 공급`을 선택하면 `변화 원인 확인`이 `gi-pulse`가 되고, 선택 전에는 disabled이며 pulse가 없습니다.
- reduced-motion에서 탐색·감사 pulse가 제거되고 각각 `지금 열어 볼 차례`, `지금 원인을 확인할 차례` 정적 안내가 표시됩니다. `.feed-transition`은 0개입니다.
- 320×800·375×812·1280×900 기준 가로 넘침 없음, 주요 CTA 높이 44px 이상, page error·console error·실패 요청 0건입니다.
- 업데이트 내역 dialog에 `2026-08-31`과 이번 요약이 보이며 Escape 후 트리거로 복귀합니다.
- 추천 이유 dialog는 Enter로 열릴 때 dialog에 초점을 두고, Tab이 닫기 버튼과 dialog 안에서 순환하며, Escape 후 원래 이유 버튼으로 복귀합니다.
- 완료 경계는 1회이며 `새 실험 시작` 후 intro로 reset됩니다.

### 실행하지 않았거나 범위 밖인 확인

- VoiceOver 구현·검증은 사용자·프로젝트 범위에서 제외했습니다. 키보드, DOM 의미, 기존 axe 계약은 유지·회귀 확인했습니다.
- 실제 초등학생/교사 표본, Safari, 물리 모바일 기기, 정량 색상 대비·확대 검사는 실행하지 않았습니다.
- `npm run test:e2e`는 이 macOS 환경의 기존 Chromium worker `MachPortRendezvousServer ... Permission denied (1100)`/`SIGTRAP` 제약이 있어 같은 실패를 반복하지 않고 MCP 브라우저 증거로 대체했습니다. CI/Linux 실행은 별도 게이트입니다.
- 이번 요청에서는 새 패키지·외부 서비스·이미지·Git commit·push·Pages 배포·HVC 등록을 실행하지 않았습니다. 따라서 공개 Pages URL에는 이번 로컬 변경이 아직 반영되지 않았습니다.

## 전문 라우팅과 자산 결정

- Stage 0에서 Playwright, design-review, design-system, redesign-existing-projects, imagegen, education-webapp-redesign capability를 확인했습니다. 필수 browser evidence는 runtime `ready`였습니다.
- 실제 증거는 MCP Playwright와 기존 프로젝트의 design-system/motion 토큰을 사용했습니다. `impeccable`·`ui-ux-pro-max`는 Stage 0 runtime snapshot에서 missing으로 표시되어 실행했다고 주장하지 않습니다.
- 새 이미지가 학습 사실·지도·도식·기능을 돕는 상황이 아니므로 imagegen을 호출하지 않았습니다. 기존 favicon과 무관한 `redesign-audit-intro-desktop.png`는 변경·스테이징하지 않았습니다.

## 학습자 takeaway와 다음 권장 단계

학습자는 같은 입력이 같은 목록을 만들 수 있다는 점, 반복 선택이 포커스 주제의 점수를 바꾼다는 점, 다양성 설정과 공급 조건이 결과에 어떤 차이를 만드는지 표와 보고서로 설명하도록 안내받습니다. 이번 변경은 그 핵심 사실을 바꾸지 않고 첫 용어 풀이와 다음 행동의 시각적 위계를 보강했습니다.

다음 단계는 실제 초등 5~6학년 2~3명과 교사 1명의 짧은 사용성 검토를 375px 모바일·키보드 기준으로 진행하고, Safari/실기기 및 정량 대비를 확인하는 것입니다. 그 결과가 수용되면 별도의 release gate 승인 후 변경 파일만 커밋하고, CI/Pages·공개 학습자 경로를 다시 검증하십시오.
