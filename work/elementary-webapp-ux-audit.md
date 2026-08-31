# Elementary Web App UX Audit

감사일: 2026-08-31 09:35 KST
대상: `https://wbmaker2.github.io/recommendation-balance-lab/`
모드: `full`
범위: 초등 5~6학년 학습자 관점의 문구·학습 흐름·조작·모바일·키보드·시각 위계 점검

## 증거 경계

- Stage 0 사전 점검은 `work/elementary-webapp-ux-bootstrap.md`에 기록했으며 필수 브라우저 실행 역할이 `ready`입니다.
- 기존 교육용 리디자인 계획·감사·완료 보고서는 이미 구현된 도메인·접근성 계약의 기준으로 재사용했습니다. 새 감사는 이전 문서의 완료 항목을 다시 결함으로 세지 않습니다.
- MCP Playwright로 공개 URL을 새로고침한 뒤 375×812에서 시작→카드 3회 선택→예측→분포 비교→탐색→균형 설정 3개→공급 감사→보고서→완료→새 실험 시작을 수행했습니다.
- 320×800, 375×812, 1280×900에서 `scrollWidth <= clientWidth`, CTA 위치, 주요 버튼 높이, page error와 console error를 확인했습니다. 공개 기준 결과는 세 너비 모두 가로 넘침 없음, `실험 시작`·`업데이트 내역` 버튼 높이 44px 이상, 오류 0건입니다.
- 실제 초등학생 표본·교사 인터뷰·Safari·물리 기기·색상 대비 측정은 수행하지 않았습니다. 이 문서의 학생 패널은 실제 연구 결과가 아닙니다.
- VoiceOver 구현·검증은 프로젝트 범위에서 제외합니다. 키보드·DOM 의미·axe 계약은 유지합니다.

## 학생 패널 기록

주 페르소나는 초등 5~6학년 서윤(10~12세), 가드레일은 초등 3~4학년 준호(8~10세)로 두었습니다.

| 단계 | 보이는 단서 | 행동 | 결과 | 판정 |
| --- | --- | --- | --- | --- |
| intro / 375×812 | 제목, 오늘의 질문, `실험 시작` | 첫 CTA를 바로 누름 | 미션 1로 이동 | 통과 |
| choice / 375×812 | `같은 자리에 세 번` 안내, 8장 피드 | 첫 카드의 선택을 3회 반복 | 포커스 주제 토큰 3개와 예측 패널 표시 | 통과 |
| prediction / 375×812 | 두 라디오 묶음, 비활성 제출 버튼 | 일부 선택 후 버튼 상태 확인 | 두 답을 모두 고르면 활성화, 틀린 예측도 비교 단계로 연결 | 통과; 예측이 연습임을 한 줄 더 알리면 정서 부담 감소 |
| comparison / 375×812 | 전후 카드 수 표, `분포 문장 확인` | 일부러 반대 방향 선택 후 확인 | 표 숫자를 포함한 alert가 남고 수정 후 이동 | 통과 |
| exploration / 375×812 | 후보 3장, `낯선 주제 열기` | 후보 첫 장을 엶 | 미션 4로 이동하고 결과·다음 미션 안내 확인 | 행동 버튼 강조 누락 발견 |
| balance / 375×812 | 슬라이더·라디오·저장/비교 버튼 | 설정 3개 저장 후 비교 | 3/3에서 비교 활성화, 미션 5 이동 | 통과; 다양성 토큰 뜻을 첫 사용에 설명할 필요 |
| audit / 375×812 | 두 공급 표, 원인 라디오 | 잘못된 원인 선택 후 확인, 콘텐츠 공급으로 수정 | status 힌트가 남고 보고서로 이동 | 행동 버튼 강조 누락 발견 |
| report / 375×812 | 1–4 순서, 필수 묶음 | 빈 제출 후 첫 오류 수정, 나머지 작성 | 8개 누락 안내와 첫 묶음 focus, 완료 문장 표시 | 통과 |
| complete / 375×812 | 증거 요약, `새 실험 시작` | 결과를 읽고 새 실험 선택 | intro로 결정적으로 reset | 통과 |

## 우선순위 이슈

### EDU-UX-001 — 모바일 토큰 계산표가 기본 화면을 압축함

- Severity: P2
- Path/state: `/` → `choice` → 추천 규칙 투명창
- Persona/viewport: 서윤 / 375×812
- Surface: evidence table
- Observed action/result: 학습자는 먼저 카드 3회 선택을 해야 하지만, 항상 펼쳐진 6열 계산표가 선택 피드 뒤에 이어집니다. 실브라우저에서 표 폭은 292px, 열 폭은 약 40.7–57.1px, 머리글 행 높이는 93.8px, 본문 표 높이는 486.9px였습니다. 가로 넘침은 없지만 `관심 토큰 × 2` 같은 머리글이 좁은 열에서 여러 줄로 쪼개져 근거 읽기가 어렵습니다.
- Evidence: MCP Playwright `choice` DOM 측정 2026-08-31, `.rule-transparency table` `width=292`, `scrollWidth=360`, `clientWidth=360`.
- Learner impact: 현재 행동과 기술 계산 근거의 위계가 약해지고, 준호는 표를 읽느라 카드 선택을 늦출 수 있습니다.
- Root-cause hypothesis: `RuleTransparencyPanel`이 학습자용 요약과 개발·교사용 6열 계산표를 같은 기본 노출 수준에 둡니다.
- Proposed change: 토큰 뜻을 한 문장으로 먼저 설명하고, 계산표를 닫힌 native `details` 안의 `토큰 계산표 자세히 보기`로 이동합니다. 표의 headers, caption, 실제 수치는 그대로 보존합니다.
- Verification: `RuleTransparencyPanel` 단위/앱 테스트에서 닫힌 상태의 table 부재와 details를 연 뒤 table·6개 열 머리글 존재를 확인하고, 375×812 실브라우저에서 표를 닫은 기본 화면의 버튼·가로 폭을 재확인합니다.
- Rollback: details 래퍼와 hint만 제거하면 기존 표 DOM으로 되돌릴 수 있으며 도메인 계산·상태에는 변경이 없습니다.
- Status: fixed on 2026-08-31

### EDU-UX-002 — 미션 3·5의 단일 핵심 행동이 `gi-pulse`로 안내되지 않음

- Severity: P2
- Path/state: `comparison` 완료 후 `exploration` 후보 선택, `audit` 원인 선택 완료
- Persona/viewport: 서윤 / 375×812, reduced-motion 일반 환경 모두
- Surface: button / action cue
- Observed action/result: 공개 DOM에서 `낯선 주제 열기` 세 버튼은 `data-gi-pulse`와 `gi-pulse`가 없고, `콘텐츠 공급`을 고른 뒤 활성화된 `변화 원인 확인`도 두 속성이 없습니다. 같은 앱의 미션 2·4·보고서 전환 버튼에는 pulse 또는 reduced-motion 정적 cue가 있습니다.
- Evidence: MCP Playwright 단계별 button attribute 수집 2026-08-31: exploration `{pulse:null,className:""}` 3개, audit `{pulse:null,className:null,disabled:false}`.
- Learner impact: 학습자가 후보를 고른 다음 어떤 버튼으로 실험을 확정하는지 시선이 멈추며, 프로젝트의 단계별 핵심 버튼 강조 규칙이 일관되지 않습니다.
- Root-cause hypothesis: `ExplorationPanel`과 `SupplyAuditPanel`이 `useReducedMotion`과 `gi-pulse` 계약을 아직 사용하지 않습니다.
- Proposed change: 탐색 후보 중 첫 번째 실행 버튼을 기본 행동으로 `gi-pulse` 처리하고 reduced-motion에서는 한 번만 정적 `지금 열어 볼 차례` cue를 보입니다. 감사의 선택 완료 버튼은 활성 상태에서 pulse, reduced-motion에서는 `지금 원인을 확인할 차례` cue를 보입니다. 대체 후보의 의미와 버튼 이름은 유지합니다.
- Verification: 두 feature 테스트에서 enabled 상태의 `data-gi-pulse=true`·class, reduced-motion 상태의 pulse 제거·정적 cue, disabled 상태의 pulse 부재를 확인하고 전체 흐름에서 한 번만 전이되는지 확인합니다.
- Rollback: 새 class/data/cue와 hook 호출을 제거하면 기존 버튼 동작으로 되돌릴 수 있습니다.
- Status: fixed on 2026-08-31

### EDU-UX-003 — 핵심 교과 용어가 첫 등장에 풀어 설명되지 않음

- Severity: P2
- Path/state: `choice` 예측 패널, `balance` 조절 패널, 추천 규칙 투명창
- Persona/viewport: 준호 가드레일 / 375×812
- Surface: instruction / legend / label
- Observed action/result: 화면에는 `포커스 주제`, `관심 토큰`, `다양성 토큰`, `결정적 규칙`이 반복됩니다. 추천 이유 dialog 안에서는 토큰 뜻을 설명하지만, dialog를 열지 않아도 진행할 수 있는 예측·균형 화면에서는 해당 단어가 먼저 풀리지 않습니다.
- Evidence: learner text inventory의 `technical-or-internal`, `abstract-or-formal` 신호와 실제 `PredictionPanel`, `BalanceControlPanel`, `RuleTransparencyPanel` DOM.
- Learner impact: 학생은 `토큰`을 점수로, `포커스 주제`를 세 번 고른 주제로 연결하지 못한 채 라디오와 슬라이더를 누를 수 있습니다. 계산 사실을 바꾸지는 않지만 반복적인 재질문을 만들 수 있습니다.
- Root-cause hypothesis: 기존 리디자인이 결과·단위·오류는 정리했지만 핵심 모델 어휘의 첫 등장 풀이를 공통 안내로 두지 않았습니다.
- Proposed change: 규칙 투명창에 `토큰은 주제마다 붙는 점수`라는 짧은 설명을 추가하고, 예측 패널에 `포커스 주제는 방금 같은 자리에 세 번 고른 주제`를 추가합니다. 균형 슬라이더에는 `다양성 토큰은 다른 주제를 보여 주는 점수`와 0/2 의미를 연결한 도움말을 `aria-describedby`로 제공합니다.
- Verification: feature tests에서 새 쉬운 풀이가 표시되고 기존 내부 ID·계산식·라디오 accessible name은 유지되는지 확인합니다. 동일한 서윤/준호 흐름에서 용어 설명 probe와 slider/result prediction probe를 재실행합니다.
- Rollback: 새 hint 문장과 `aria-describedby` 연결만 되돌리면 기존 UI로 복귀하며 계산식은 건드리지 않습니다.
- Status: fixed on 2026-08-31

## 통과한 항목과 범위 경계

- P0/P1: 관찰되지 않음. 핵심 학습 경로, reset, 보고서 오류 focus, 개인정보·네트워크 경계는 작동했습니다.
- 모바일: 320×800·375×812·1280×900 기준 가로 넘침 없음. 모든 주요 native control은 44px 이상 터치 높이를 유지했습니다.
- 키보드: 업데이트 dialog와 카드 이유 dialog의 Enter/Escape, Tab containment, 트리거 복귀가 기존 E2E 계약에 있습니다. 이번 수정은 이 계약을 변경하지 않습니다.
- reduced-motion: 기존 pulse·feed transition 대체 계약을 유지하고 새 pulse 대상도 같은 정적 cue 규칙을 사용합니다.
- 시뮬레이션: 새 Canvas/WebGL/게임형 시뮬레이션은 필요하지 않습니다. 결정표·DOM control·결정적 reset으로 학습 루프가 이미 충족되어 `not-needed`로 판정합니다.
- 이미지: 새 학습 사실·지도·도식 이미지가 필요하다는 근거가 없어 imagegen을 호출하지 않습니다. 기존 favicon은 정체성 자산으로 보존합니다.

## 구현 후 확인

- EDU-UX-001: `RuleTransparencyPanel`에 토큰 쉬운 풀이를 먼저 표시하고 `토큰 계산표 자세히 보기` native details 안에 기존 6열 표를 보존했습니다. 기본 닫힘·열림 상태와 수치/headers를 Vitest와 375×812 MCP Playwright에서 확인했습니다.
- EDU-UX-002: `ExplorationPanel` 첫 후보와 `SupplyAuditPanel` 선택 완료 원인 확인 버튼에 일반 모션 `gi-pulse`를 추가하고, reduced-motion에서는 pulse 대신 정적 안내를 표시했습니다. Vitest와 reduced-motion MCP Playwright에서 확인했습니다.
- EDU-UX-003: 예측의 포커스 주제, 균형의 다양성 토큰, 규칙 투명창의 토큰을 첫 등장에 쉬운 말로 풀고 range 입력에 `aria-describedby`를 연결했습니다. 용어·접근성 회귀 테스트를 통과했습니다.
- 품질 게이트: `npm run quality` 통과(40개 Vitest 파일/169개 테스트, script 7개, typecheck, lint, line/boundary 검사, production build).
- 브라우저 게이트: 375×812 전체 학습 흐름·오답 회복·빈 보고서 회복·reset, 가로 넘침 없음, console/page error와 실패 요청 0건을 확인했습니다. 업데이트 내역과 추천 이유 dialog의 Enter/Escape·Tab·포커스 복귀도 확인했습니다.
