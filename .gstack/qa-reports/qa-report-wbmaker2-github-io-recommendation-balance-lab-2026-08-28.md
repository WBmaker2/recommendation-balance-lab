# QA Report: Recommendation Balance Lab

| Field | Value |
|-------|-------|
| **Date** | 2026-08-28 |
| **URL** | https://wbmaker2.github.io/recommendation-balance-lab/ |
| **Branch** | main |
| **Commit** | 7e857637ec6cb992f512a0a20959d45dc2a64fa2 (2026-08-27 18:25 KST) |
| **PR** | — |
| **Tier** | Exhaustive learner-flow review |
| **Scope** | 초등 5~6학년 첫 방문자 관점의 전체 학습 흐름, 문장, 편의성, 모바일 UI, 접근성 상호작용, 콘솔, 코드 구조 |
| **Duration** | 약 45분 |
| **Pages visited** | SPA의 8개 단계: intro, choice, comparison, exploration, balance, audit, report, complete |
| **Screenshots** | 12 |
| **Framework** | React 19.2 + Vite 8.2 + TypeScript 6.0 + Vitest 4.1 + Playwright 1.62 |
| **Index** | 이 보고서 기준 |

## 테스트 방식과 범위

초등 5~6학년 학생이 처음 방문했다고 가정하고, 실제 추천 기록을 입력하지 않은 상태에서 375×812 모바일과 1200×800 데스크톱 화면으로 시작부터 완료까지 직접 조작했습니다. 같은 주제 카드 3장 선택, 예측, 분포 비교, 낯선 주제 탐색, 세 가지 균형 설정 저장·비교, 공급 조건 감사, 모델 보고서 제출까지 한 번씩 수행했습니다.

이 결과는 실제 아동·교사 인터뷰가 아닌 대리 사용성 테스트입니다. 사용자가 요청한 대로 VoiceOver 검수는 생략했습니다. Playwright CLI는 Chrome Crashpad 권한으로 SIGABRT가 발생해 실행하지 못했으며, 동일한 브라우저 상호작용은 MCP Playwright로 수행했습니다. 따라서 자동화 E2E 재실행 증거와 사람의 실제 보조공학 검수는 별도 확인이 필요합니다.

## Health Score: 80/100

| Category | Score |
|----------|-------|
| Console | 70 |
| Links | 100 |
| Visual | 78 |
| Functional | 90 |
| UX | 62 |
| Performance | 90 |
| Accessibility | 88 |

기능 흐름은 끝까지 완료되지만, 초등 학습자의 이해와 다음 행동 발견을 방해하는 고우선 개선점이 있어 80점으로 산정했습니다. 점수에는 현재 배포 페이지의 favicon 404 한 건과, 어린 학습자에게 개발자용 용어·긴 스크롤·보이지 않는 오류 안내가 주는 부담을 반영했습니다.

## Top 3 Things to Fix

1. **ISSUE-001: 추천 이유가 개발자용 계산식으로 노출됨** — round, topicIndex, topicCandidateCount와 토큰 계산이 첫 설명에 바로 보여 초등학생이 추천 이유를 이해하기 어렵습니다.
2. **ISSUE-002: 미션 1의 다음 행동이 긴 화면 아래에 묻힘** — 세 장을 고른 뒤 다음 목록 예측까지 수천 픽셀을 수동으로 내려가야 합니다.
3. **ISSUE-003: 빈 보고서 제출 오류가 모바일 화면 밖에 나타남** — 제출은 처리되지만 오류 안내가 현재 화면에 보이지 않아 버튼이 작동하지 않은 것처럼 느껴집니다.

## Console Health

| Error | Count | First seen |
|-------|-------|------------|
| Failed to load resource: the server responded with a status of 404 — /favicon.ico | 1 per page session | https://wbmaker2.github.io/recommendation-balance-lab/ |

JavaScript 예외나 warning은 확인하지 못했습니다. 위 404는 현재 페이지의 기능을 막지는 않지만, 콘솔을 깨끗하게 유지해야 하는 배포 품질 문제입니다.

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 4 |
| Medium | 6 |
| Low | 1 |
| **Total** | **11** |

## Issues

### ISSUE-001: 추천 이유가 개발자용 계산식으로 노출됨

| Field | Value |
|-------|-------|
| **Severity** | high |
| **Category** | content / ux |
| **URL** | https://wbmaker2.github.io/recommendation-balance-lab/ |
| **Evidence** | [reason-dialog-desktop.png](screenshots/reason-dialog-desktop.png) |

**Description:** 첫 카드에서 왜 이 카드가 나왔나요?를 누르면 기본 토큰, 관심 토큰 × 2, 다양성 토큰, 전체 토큰 표와 함께 후보 목록에서 (round × 2 + topicIndex) % topicCandidateCount 위치부터 순서대로 선택이 그대로 노출됩니다. 이 내용은 구현 규칙을 투명하게 보여 주지만, 초등학생에게는 round, topicIndex, topicCandidateCount가 무엇인지 설명되지 않아 “내가 고른 카드라서 나왔는지”를 판단하기 어렵습니다.

**Repro Steps:**

1. 배포 페이지에서 실험 시작을 누릅니다.
2. 미션 1에서 카드 하나를 누릅니다.
3. 해당 카드의 왜 이 카드가 나왔나요?를 누릅니다.
4. **Observe:** 수학식과 내부 변수명이 일반 설명보다 먼저 보입니다.

**Code evidence:** src/features/transparency/WhyThisCardDialog.tsx:69-81이 계산식과 토큰 표를 바로 렌더링하고, src/domain/recommendationEngine.ts:129,148,175가 내부 변수명 기반 설명을 공급합니다.

**Improvement direction:** 첫 화면에는 “관심을 보인 주제에 점수를 더해 이 카드가 먼저 보였어요”처럼 원인과 결과를 한 문장으로 보여 주고, 계산식은 자세한 계산 보기를 눌렀을 때만 펼치도록 분리합니다. 토큰에는 작은 예시(관심 토큰 2개 → 점수 4점)를 붙입니다.

**Acceptance criteria:** 기본 대화상자의 첫 화면에 round, topicIndex, topicCandidateCount가 나타나지 않습니다. 학습자는 한 문장 요약만 읽어도 카드가 선택된 이유와 “가상 규칙”이라는 한계를 말할 수 있습니다. 상세 계산을 연 경우에만 내부 규칙이 보이고, 기존 키보드 포커스 복귀가 유지됩니다.

### ISSUE-002: 미션 1의 다음 행동이 긴 화면 아래에 묻힘

| Field | Value |
|-------|-------|
| **Severity** | high |
| **Category** | ux / functional |
| **URL** | https://wbmaker2.github.io/recommendation-balance-lab/ |
| **Evidence** | [mobile-mission1.png](screenshots/mobile-mission1.png), [after-card-selection.png](screenshots/after-card-selection.png) |

**Description:** 375×812에서 카드 3장을 선택하면 선택 상태는 상단에 갱신되지만, 추천 카드·규칙 설명 뒤에 있는 다음 목록 예측까지 직접 긴 스크롤을 해야 합니다. 카드 선택 직후에는 “이제 예측해 보세요”가 화면에 나타나지 않습니다. 선택 3장 후 문서 높이는 약 5,793px까지 확인했습니다.

**Repro Steps:**

1. 모바일 너비 375px에서 실험 시작을 누릅니다.
2. 미션 1에서 같은 주제의 카드를 세 번 선택합니다.
3. **Observe:** 성공 상태는 보이지만 다음 행동 패널은 화면 아래에 있어 계속 스크롤해야 합니다.

**Code evidence:** src/App.tsx:57-80에서 카드 피드와 RuleTransparencyPanel이 PredictionPanel보다 먼저 렌더링되고, src/features/prediction/PredictionPanel.tsx:35-80에는 선택 완료 직후 위치를 알려 주는 이동 처리가 없습니다.

**Improvement direction:** 세 번째 선택 직후 예측 패널로 포커스를 이동하고 scrollIntoView를 사용하거나, 상단에 고정된 “다음: 두 가지를 예측해 보세요” 안내를 표시합니다. 긴 카드 근거는 접을 수 있게 하여 현재 행동과 근거를 분리합니다.

**Acceptance criteria:** 세 번째 선택 뒤 1회 상호작용 안에 예측 제목과 두 라디오 묶음이 화면에 보이거나 키보드 포커스를 받습니다. 모바일 학습자는 수동으로 화면 전체를 훑지 않고 다음 행동을 찾을 수 있습니다. 축소 모션 환경에서는 같은 위치 이동이 애니메이션 없이 동작합니다.

### ISSUE-003: 빈 보고서 제출 오류가 모바일 화면 밖에 나타남

| Field | Value |
|-------|-------|
| **Severity** | high |
| **Category** | functional / ux / accessibility |
| **URL** | https://wbmaker2.github.io/recommendation-balance-lab/ |
| **Evidence** | [mobile-report-empty-submit.png](screenshots/mobile-report-empty-submit.png) |

**Description:** 보고서 단계에서 아무 항목도 고르지 않고 모델 보고서 제출을 누르면 role="alert" 내용은 DOM에 생성됩니다. 그러나 모바일 화면은 제출 버튼 근처에 그대로 있고, 안내가 약 2,686px 위에 있어 현재 화면에서 보이지 않습니다. 포커스도 제출 버튼에 남아 초등학생은 버튼이 눌리지 않았다고 생각할 수 있습니다.

**Repro Steps:**

1. 전체 흐름을 완료 직전 보고서 단계까지 진행합니다.
2. 375×812에서 아무 라디오·체크박스도 선택하지 않은 채 모델 보고서 제출을 누릅니다.
3. **Observe:** 현재 화면에는 변화가 없고, 오류 문장은 페이지 위쪽에만 존재합니다.

**Code evidence:** src/features/report/ModelReport.tsx:103-118은 비어 있는 제출 버튼을 계속 활성화하고, src/App.tsx:123-127은 state.lastError를 보고서보다 앞에 렌더링합니다. 메시지 생성은 src/domain/reportAssessment.ts:174-186에 있습니다.

**Improvement direction:** 제출 전 비어 있는 묶음마다 짧은 인라인 안내를 표시하고 첫 번째 미완료 필드로 포커스와 스크롤을 이동합니다. 제출 버튼은 필수 묶음이 모두 채워질 때까지 비활성화하거나, 비활성화 이유를 바로 옆에 보여 줍니다.

**Acceptance criteria:** 빈 제출 뒤 첫 번째 누락 묶음의 안내가 즉시 viewport 안에 보이고 포커스가 해당 입력으로 이동합니다. 안내는 변화 읽기, 원인 구분, 절충 판단, 모형 한계처럼 한 항목당 한 문장으로 읽힙니다. 키보드 사용자도 같은 피드백을 받습니다.

### ISSUE-004: 완료 문장에 내부 ID와 잘못된 단위가 남음

| Field | Value |
|-------|-------|
| **Severity** | high |
| **Category** | content |
| **URL** | https://wbmaker2.github.io/recommendation-balance-lab/ |
| **Evidence** | [mobile-completion.png](screenshots/mobile-completion.png) |

**Description:** 완료 화면에 scenario-c 설정, 새로운 주제를 찾기 목적에서, 나타난 주제 수는 5장(개)가 표시됩니다. scenario-a/b/c는 개발자용 ID이고, 주제 수에는 개, 카드 수에는 장을 써야 합니다. 같은 화면에 모형 한계 문장이 별도 문단과 결과 문장 끝에 중복되어 길이가 늘어납니다.

**Repro Steps:**

1. 세 가지 설정을 저장하고 균형 비교를 완료합니다.
2. 보고서를 채워 제출합니다.
3. **Observe:** 완료 문장에서 내부 ID, 어색한 조사, 장(개) 단위, 중복 경고를 확인합니다.

**Code evidence:** src/domain/reportAssessment.ts:261-269가 문장을 조합하고, src/features/report/CompletionScreen.tsx:13-16이 MODEL_WARNING을 별도 출력합니다. 같은 ID는 src/features/balance/ScenarioComparison.tsx:24-40과 src/features/report/ModelReport.tsx:78-110에도 표시됩니다.

**Improvement direction:** 화면용 이름을 설정 1, 설정 2, 설정 3 또는 관심 중심, 균형 더하기, 다양성 더하기로 매핑하고 내부 ID는 DOM의 학습자용 텍스트에서 제거합니다. 새로운 주제를 찾는 목적에서, 나타난 주제 수는 5개입니다처럼 문장을 고칩니다. 경고는 한 번만 짧게 표시합니다.

**Acceptance criteria:** 학습자에게 보이는 텍스트와 accessible name에 scenario-a, scenario-b, scenario-c, 장(개)가 없습니다. 카드 수는 장, 주제 수는 개로 일관되고, 완료 문장은 한 번 읽어 자연스럽게 이해됩니다. 결과의 실제 숫자와 학습 목표는 유지됩니다.

### ISSUE-005: 모바일 단계가 지나치게 길고 표 중심임

| Field | Value |
|-------|-------|
| **Severity** | medium |
| **Category** | visual / ux |
| **URL** | https://wbmaker2.github.io/recommendation-balance-lab/ |
| **Evidence** | [mobile-intro.png](screenshots/mobile-intro.png), [mobile-mission1.png](screenshots/mobile-mission1.png), [mobile-balance.png](screenshots/mobile-balance.png), [mobile-report.png](screenshots/mobile-report.png) |

**Description:** 모바일 문서 높이가 intro 약 2,021px, 미션 1 선택 후 약 4,525px, 예측까지 포함하면 약 5,793px, 균형 단계는 세 설정 저장 후 약 6,287px, 보고서는 약 3,300px입니다. 균형·감사·보고서가 표와 긴 문장을 연속으로 보여 주어 어린 학습자가 핵심 변화보다 세부 근거를 먼저 읽게 됩니다. 가로 넘침은 없지만 세로 탐색 부담이 큽니다.

**Repro Steps:**

1. 375×812에서 각 단계를 순서대로 완료합니다.
2. 시나리오 비교, 공급 조건 모델 감사, 모델 보고서를 차례로 엽니다.
3. **Observe:** 다음 행동을 찾기 전에 여러 화면을 반복해서 스크롤해야 하고, 결과가 시각적 요약 없이 표로만 쌓입니다.

**Improvement direction:** 각 단계 첫 화면에 이번에 할 일과 핵심 숫자 1~2개를 고정하고, 표·토큰 목록은 자세히 보기로 접습니다. 주제별 카드 수는 작은 막대 그래프나 전후 숫자 카드로 먼저 보여 줍니다.

**Acceptance criteria:** 모든 단계에서 현재 행동과 다음 버튼이 첫 두 화면 안에 함께 보입니다. 세부 표를 접어도 학습 목표에 필요한 전후 카드 수·나타난 주제 수·원인 세 가지는 확인할 수 있습니다. 375×812에서 가로 스크롤이 발생하지 않고, 긴 표는 accessible name과 헤더를 유지합니다.

### ISSUE-006: 진행 표시가 현재·완료 상태를 시각적으로 구분하지 못함

| Field | Value |
|-------|-------|
| **Severity** | medium |
| **Category** | visual / ux |
| **URL** | https://wbmaker2.github.io/recommendation-balance-lab/ |
| **Evidence** | [initial-desktop.png](screenshots/initial-desktop.png) |

**Description:** 상단 미션 진행은 미션 제목을 일반 텍스트 목록으로 보여 줍니다. 현재 항목에는 aria-current="step"가 있지만, 화면상 색·배지·체크 표시가 없어 학생이 “지금 어디를 해야 하는지”와 “무엇을 끝냈는지”를 한눈에 알기 어렵습니다.

**Repro Steps:**

1. intro에서 시작하고 미션 1, 미션 2로 이동합니다.
2. 상단 진행 목록을 확인합니다.
3. **Observe:** 현재·완료·남은 단계가 거의 같은 시각적 무게로 보입니다.

**Code evidence:** src/components/layout/StageProgress.tsx:13-23은 aria-current만 설정하고, 스타일에는 [aria-current="step"] 또는 완료 상태 선택자가 없습니다.

**Improvement direction:** 현재 단계에는 색상과 지금 하는 중 배지를, 완료 단계에는 체크와 완료 문구를 추가합니다. 색상만으로 구분하지 않고 텍스트·아이콘을 함께 사용합니다.

**Acceptance criteria:** 현재 단계와 완료 단계가 색상·텍스트·아이콘 세 가지 중 두 가지 이상으로 구분됩니다. aria-current="step" 의미와 키보드 순서는 유지되고, 대비가 충분합니다.

### ISSUE-007: 핵심 현재 설정 저장 버튼의 강조 규칙이 일관되지 않음

| Field | Value |
|-------|-------|
| **Severity** | medium |
| **Category** | visual / ux |
| **URL** | https://wbmaker2.github.io/recommendation-balance-lab/ |
| **Evidence** | [mobile-balance.png](screenshots/mobile-balance.png) |

**Description:** 교육용 핵심 버튼인 균형 비교는 세 설정이 준비되면 gi-pulse와 지금 할 차례 대체 문구를 사용하지만, 세 설정을 만드는 핵심 버튼 현재 설정 저장에는 같은 강조가 없습니다. 학생은 슬라이더와 라디오를 바꾼 뒤 무엇을 눌러야 하는지 다시 찾아야 합니다.

**Repro Steps:**

1. 균형 단계에서 다양성 슬라이더나 관심 기록을 바꿉니다.
2. 현재 설정 저장과 균형 비교의 강조 상태를 비교합니다.
3. **Observe:** 저장 버튼에는 pulse 또는 축소 모션용 정적 안내가 없고, 비교 버튼만 조건부로 강조됩니다.

**Code evidence:** src/features/balance/BalanceControlPanel.tsx:81의 저장 버튼에는 data-gi-pulse가 없고, :83-92의 비교 버튼에만 pulse와 reduced-motion 대체 문구가 있습니다.

**Improvement direction:** 저장 가능한 새 설정이 있을 때 저장 버튼에도 pulse와 설정을 저장해 보세요를 제공하고, 이미 저장했거나 세 개가 찼을 때는 이유를 가까이 표시합니다.

**Acceptance criteria:** 저장이 가능한 상태에서 버튼이 gi-pulse 또는 reduced-motion 정적 라벨을 사용합니다. 저장 불가 상태에서는 pulse가 없고 이유가 버튼 가까이에 보입니다. prefers-reduced-motion: reduce에서 애니메이션은 실행되지 않습니다.

### ISSUE-008: intro의 개인정보 안내가 반복됨

| Field | Value |
|-------|-------|
| **Severity** | medium |
| **Category** | content |
| **URL** | https://wbmaker2.github.io/recommendation-balance-lab/ |
| **Evidence** | [initial-desktop.png](screenshots/initial-desktop.png), [mobile-intro.png](screenshots/mobile-intro.png) |

**Description:** 안전하고 정확하게 살펴보기에서 실제 취향·검색 기록·계정 정보를 입력하지 않습니다.가 먼저 나오고, 바로 다음 문단의 PRIVACY_NOTICE가 실제 취향·검색 기록·계정 정보를 다시 말합니다. 안전을 강조하려는 의도는 좋지만 첫 화면의 읽기량이 늘고 같은 문장이 중요한 학습 목표처럼 보입니다.

**Repro Steps:**

1. 배포 페이지를 새로 엽니다.
2. 안전하고 정확하게 살펴보기를 읽습니다.
3. **Observe:** 실제 개인정보를 입력하지 않는다는 내용이 연속으로 반복됩니다.

**Code evidence:** src/features/intro/IntroScreen.tsx:41-46에 고정 문장과 PRIVACY_NOTICE가 함께 출력됩니다.

**Improvement direction:** 한 문장으로 개인정보 경계를 먼저 말하고, 다음 문장에는 “이 실험은 가상 카드와 규칙만 사용한다”처럼 다른 정보를 보태 중복을 없앱니다.

**Acceptance criteria:** 같은 의미의 개인정보 문장이 한 번만 표시됩니다. 입력하지 않는 정보, 가상 모델의 한계, 불편한 콘텐츠 안내는 각각 한 문장씩 남습니다.

### ISSUE-009: 낯선 주제 탐색 뒤 완료 안내 없이 다음 미션으로 이동함

| Field | Value |
|-------|-------|
| **Severity** | medium |
| **Category** | ux / content |
| **URL** | https://wbmaker2.github.io/recommendation-balance-lab/ |
| **Evidence** | [mobile-mission3.png](screenshots/mobile-mission3.png) |

**Description:** 미션 3에서 낯선 주제 열기를 누르면 탐색 결과를 짧게 확인할 틈이나 미션 3 완료 안내 없이 바로 미션 4 균형 단계로 전환됩니다. 학생은 방금 무엇을 관찰했는지, 왜 다음 설정 단계로 넘어갔는지 놓칠 수 있습니다.

**Repro Steps:**

1. 미션 2의 분포 비교를 맞혀 미션 3으로 이동합니다.
2. 후보 중 하나에서 낯선 주제 열기를 누릅니다.
3. **Observe:** 결과 확인과 완료 피드백이 짧게라도 나타나지 않고 다음 미션 화면이 바로 나옵니다.

**Code evidence:** src/App.tsx:96-113은 탐색 결과를 balance 단계의 ExplorationOutcome과 설정 패널 앞에 바로 배치하며, 탐색 버튼 뒤 별도 완료 CTA가 없습니다.

**Improvement direction:** 탐색 결과에 “새 주제가 나타났어요”와 관찰 숫자를 먼저 보여 주고 다음 미션: 균형 설정 버튼으로 명시적으로 이동합니다. 자동 이동을 유지한다면 최소한 짧은 완료 배너와 다음 단계 제목을 함께 보여 줍니다.

**Acceptance criteria:** 탐색 직후 학습자가 무엇을 발견했는지 한 문장과 숫자로 확인할 수 있습니다. 다음 단계로 이동하는 이유가 버튼 또는 안내 문장에 적혀 있고, 키보드 포커스가 새 단계 제목으로 이동합니다.

### ISSUE-010: 배포 페이지에서 favicon 404가 발생함

| Field | Value |
|-------|-------|
| **Severity** | low |
| **Category** | console |
| **URL** | https://wbmaker2.github.io/recommendation-balance-lab/ |
| **Evidence** | MCP Playwright console: /favicon.ico 404 |

**Description:** 페이지 기능과 화면은 정상적으로 로드되지만 브라우저 콘솔에 /favicon.ico 요청 404가 한 건 기록됩니다. index.html에는 favicon link가 없고, 학생에게는 보이지 않아도 배포 상태·브라우저 탭 품질을 떨어뜨립니다.

**Repro Steps:**

1. 배포 URL을 새 탭에서 엽니다.
2. 콘솔의 error 메시지를 확인합니다.
3. **Observe:** /favicon.ico에 대한 404가 기록됩니다.

**Code evidence:** index.html:1-10에 favicon link 또는 public/favicon.ico가 없습니다.

**Improvement direction:** 작은 SVG/PNG favicon을 public/favicon.svg로 제공하고 index.html에 명시적인 link를 추가하거나, 제품 아이콘을 제공하지 않을 경우 브라우저가 요청하지 않도록 배포 구성을 확인합니다.

**Acceptance criteria:** 배포 URL을 새로 열었을 때 favicon 요청이 200이거나 요청 자체가 없고, JavaScript error와 warning이 0건입니다.

### ISSUE-011: 보고서의 관찰 지표 단위가 선택한 값과 맞지 않음

| Field | Value |
|-------|-------|
| **Severity** | medium |
| **Category** | content |
| **URL** | https://wbmaker2.github.io/recommendation-balance-lab/ |
| **Evidence** | [mobile-report.png](screenshots/mobile-report.png), [mobile-completion.png](screenshots/mobile-completion.png) |

**Description:** 보고서에서 나타난 주제 수를 선택하면 라벨이 관찰한 나타난 주제 수: 5장(개)가 됩니다. 카드 수와 주제 수의 단위를 한 라벨에 섞어 숫자의 의미를 다시 해석해야 합니다. 완료 문장에도 같은 문제가 반복됩니다.

**Repro Steps:**

1. 보고서 단계에서 나타난 주제 수 지표를 선택합니다.
2. 선택한 관찰값 라벨과 완료 문장을 읽습니다.
3. **Observe:** 주제 수인데 장(개)가 표시됩니다.

**Code evidence:** src/features/report/ModelReport.tsx:103-110이 모든 지표에 장(개)를 붙이고, src/domain/reportAssessment.ts:266-269가 결과 문장을 같은 방식으로 조합합니다.

**Improvement direction:** 지표에 단위를 함께 타입화하여 포커스 주제 카드 수는 장, 나타난 주제 수는 개를 사용합니다. 숫자 앞에 “주제 5개”, “과학 카드 3장”처럼 명사를 먼저 둡니다.

**Acceptance criteria:** focus-card-count 결과에는 장만, topic-variety 결과에는 개만 표시됩니다. 학습자가 단위를 보지 않고도 숫자가 카드인지 주제인지 문장으로 구분할 수 있습니다.

## 양호하게 동작한 부분

- 실제 학습자 순서로 intro에서 complete까지 한 번의 흐름이 완료되었습니다.
- 375×812에서 innerWidth=375, documentWidth=360, bodyWidth=360, hasHorizontalOverflow=false로 가로 넘침이 없었습니다. 미션 2~5의 표도 화면 폭을 넘지 않았습니다.
- 카드·라디오·체크박스·버튼의 터치 영역은 확인한 범위에서 약 44px 이상이었습니다.
- 추천 이유 대화상자는 열릴 때 대화상자에 포커스를 주고, Tab을 닫기 버튼과 대화상자 안에 가두며, Escape와 닫기 후 원래 트리거로 포커스를 돌려줍니다.
- 업데이트 내역과 기록 지우기 대화상자는 열기·Escape·취소 후 포커스 복귀가 동작했습니다. 업데이트 내역에는 2026-08-26 설계와 2026-08-27 개선 기록이 날짜순으로 표시됩니다.
- 단계 제목으로 포커스를 이동하는 로직과 aria-current="step", fieldset/legend·표 헤더·skip link가 있습니다.
- prefers-reduced-motion: reduce에서는 gi-pulse, 전환 애니메이션, smooth scroll이 비활성화되고 정적 지금 할 차례 문구가 사용됩니다.
- 소스 경계 검사에서 네트워크·저장 API가 발견되지 않았고, 개인정보를 입력받지 않는 구조입니다.
- npm run quality가 exit 0으로 완료되었습니다: lint, typecheck, 스크립트 테스트 6개, 줄 수·경계 검사, Vitest 25개 파일/140개 테스트, production build.
- GitHub Pages의 제목과 HTML/JS/CSS 자산은 HTTP 200으로 확인되었습니다. 이는 기능·문장·실제 아동 수용성의 최종 승인과는 별도입니다.

## 개선 우선순위

1. ISSUE-001, ISSUE-004, ISSUE-011의 학습자용 문장·단위·내부 ID를 먼저 정리합니다.
2. ISSUE-002, ISSUE-003, ISSUE-009에서 다음 행동·오류·단계 전환을 현재 화면과 포커스로 연결합니다.
3. ISSUE-005, ISSUE-006, ISSUE-007에서 핵심 숫자 시각화, 진행 상태, gi-pulse 규칙을 일관되게 적용합니다.
4. ISSUE-008의 중복 문장을 줄이고 ISSUE-010의 favicon 404를 제거합니다.
5. 수정 후 모바일 전체 흐름, 키보드 흐름, reduced-motion, 실제 아동 1명 이상의 관찰 테스트를 별도 게이트로 진행합니다. VoiceOver 검수는 이번 요청 범위에서 생략한 상태입니다.

## Regression Tests

| Issue | Test File | Status | Description |
|-------|-----------|--------|-------------|
| ISSUE-001 | tests/e2e/accessibility.spec.ts 또는 신규 learner-copy E2E | deferred | 추천 이유 기본 화면에 내부 변수명이 없고 상세 보기에서만 계산식이 보이는지 확인 |
| ISSUE-002 | 신규 tests/e2e/student-flow.spec.ts | deferred | 세 번째 카드 선택 후 예측 패널 가시성·포커스·모바일 scroll 위치 확인 |
| ISSUE-003 | tests/e2e/student-flow.spec.ts | deferred | 빈 보고서 제출 후 첫 누락 필드의 inline alert와 포커스 확인 |
| ISSUE-004 | src/domain/reportAssessment.test.ts, 신규 E2E | deferred | 완료 문장에 내부 ID가 없고 단위·문법·경고 중복이 올바른지 확인 |
| ISSUE-005 | 신규 mobile learner-flow E2E | deferred | 375×812 각 단계에서 핵심 행동이 두 화면 안에 보이고 가로 넘침이 없는지 확인 |
| ISSUE-006 | src/components/layout/StageProgress.test.tsx, accessibility E2E | deferred | 현재·완료 단계의 텍스트와 시각 상태가 구분되는지 확인 |
| ISSUE-007 | src/features/balance/BalanceControlPanel.test.tsx | deferred | 저장 가능·저장 불가·reduced-motion별 pulse와 정적 안내 확인 |
| ISSUE-008 | src/features/intro/IntroScreen.test.tsx | deferred | 개인정보 안내의 중복이 없고 안전·한계 문장이 모두 남는지 확인 |
| ISSUE-009 | 신규 tests/e2e/student-flow.spec.ts | deferred | 탐색 완료 안내와 다음 단계 CTA, 제목 포커스 확인 |
| ISSUE-010 | tests/e2e/console-health.spec.ts | deferred | favicon 요청과 콘솔 error 0건 확인 |
| ISSUE-011 | src/features/report/ModelReport.test.tsx, src/domain/reportAssessment.test.ts | deferred | 카드 수는 장, 주제 수는 개로 렌더링·문장 조합되는지 확인 |

## Ship Readiness

| Metric | Value |
|--------|-------|
| Health score | 80/100 |
| Issues found | 11 |
| Fixes applied | 0 |
| Deferred | 11 |

**판정:** 기능 시연과 배포 확인은 가능하지만, 초등학생 대상 수업에 바로 투입하기 전에는 High 4건을 먼저 수정하고 모바일·키보드 회귀 검사를 다시 통과해야 합니다. 이번 검수에서는 코드를 수정하지 않았습니다.

## Post-implementation verification — 2026-08-28

위의 발견 사항을 기준으로 로컬 작업 트리에 개선안을 구현한 뒤 재검증했습니다. 이 절은 최초 검수 기록을 덮어쓰지 않고, 수정 후 증거만 추가합니다.

| Issue | 수정 결과 | 근거 |
|-------|-----------|------|
| ISSUE-001 | 추천 이유 기본 화면을 어린이용 문장으로 바꾸고 토큰·결정 규칙은 `자세한 계산 보기` 안으로 이동했습니다. | `src/features/transparency/WhyThisCardDialog.tsx`, `src/features/transparency/whyThisCardFlow.test.tsx` |
| ISSUE-002 | 세 번째 선택 뒤 예측 제목으로 무스크롤 포커스와 화면 이동을 한 번 수행합니다. | `src/features/experiment/useNextTaskReveal.ts`, `src/features/experiment/useNextTaskReveal.test.tsx` |
| ISSUE-003 | 빈 보고서 제출 시 첫 누락 묶음 안에 오류를 표시하고 해당 묶음으로 포커스·즉시 스크롤합니다. | `src/domain/reportValidation.ts`, `src/features/report/ModelReport.tsx`, `src/features/report/appReportFlow.test.tsx` |
| ISSUE-004 | 설정 1~3 표시명, 목적 문장, 완료 문장을 학습자용 표현으로 정리하고 모형 경고를 한 번만 표시합니다. | `src/data/learnerPresentation.ts`, `src/domain/reportAssessment.ts`, `src/features/report/reportFlow.test.tsx` |
| ISSUE-005 | 진행 상태·핵심 숫자 요약·닫힌 근거 details를 추가하고 375×812 전체 단계 가로 넘침 회귀를 통과했습니다. | `src/components/common/TopicCountSummary.tsx`, `src/components/layout/StageProgress.tsx`, `tests/e2e/mobile.spec.ts` |
| ISSUE-006 | 진행 항목에 완료·진행 중·예정 텍스트와 아이콘, `data-stage-state`를 추가했습니다. | `src/components/layout/StageProgress.tsx`, `src/components/layout/StageProgress.test.tsx` |
| ISSUE-007 | 저장 가능한 설정의 핵심 버튼에도 `gi-pulse`를 적용하고 reduced-motion에서는 정적 안내를 표시합니다. | `src/features/balance/BalanceControlPanel.tsx`, `src/features/balance/balanceFlow.test.tsx` |
| ISSUE-008 | 개인정보 안내 문장을 안전 섹션에서 한 번만 노출합니다. | `src/features/intro/IntroScreen.tsx`, `src/features/intro/IntroScreen.test.tsx` |
| ISSUE-009 | 탐색 결과에 미션 3 완료·관찰 결과·다음 미션 안내를 추가했습니다. | `src/features/exploration/ExplorationOutcome.tsx`, `src/features/experiment/completeLearnerFlow.test.tsx` |
| ISSUE-010 | 상대 경로 SVG favicon을 정적 자산으로 추가했습니다. | `index.html`, `public/favicon.svg`, `scripts/static-assets.test.mjs` |
| ISSUE-011 | 카드 수는 `장`, 나타난 주제 수는 `개`로 타입화해 표시합니다. | `src/data/learnerPresentation.ts`, `src/features/report/ModelReport.tsx`, `src/domain/reportAssessment.test.ts` |

### Automated and browser evidence

- `npm run quality`: exit 0 (`lint`, `typecheck`, scripts 7개, 줄 수·경계 검사, Vitest 33개 파일/157개 테스트, production build).
- `PLAYWRIGHT_PORT=4176 npm run test:e2e`: Chromium 5 passed (학습 흐름, 모바일, axe 6단계, 키보드, reduced-motion).
- MCP Playwright 로컬 검수: 375×812에서 `document.documentElement.scrollWidth=360`, `window.innerWidth=375`, 가로 넘침 `false`; 콘솔 error 0건; `http://127.0.0.1:5174/favicon.svg` link 확인.
- 작업 트리 변경은 아직 GitHub Pages에 배포하지 않았습니다. HVC 확인용 기존 주소는 [추천 알고리즘 균형 실험실](https://wbmaker2.github.io/recommendation-balance-lab/)이며, 새 변경의 공개 반영 여부를 나타내는 링크가 아닙니다.

실제 초등학생 1명 이상의 관찰 수용성 검수와 색·확대·물리 기기 확인은 별도 사람 검수로 남겨 둡니다. VoiceOver 구현·검증은 요청 범위에서 제외했습니다.
