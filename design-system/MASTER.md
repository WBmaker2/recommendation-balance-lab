# Recommendation Balance Lab Design System

작성일: 2026-08-29
적용 범위: 기존 React/Vite 교육용 앱의 안전한 리디자인
근거: `2026-08-26-recommendation-balance-lab-design.md`, `work/education-webapp-redesign-audit.md`, 기존 `src/styles/*`

## 사용 원칙

- 학습자가 다음 행동을 먼저 찾도록 한 화면에 하나의 주된 행동만 강조합니다.
- 5개 미션의 순서와 모델 계산은 기존 도메인 계층을 그대로 사용합니다.
- 밝은 종이 배경과 잉크색 글자를 유지하고 `prefers-color-scheme: dark`에 따라 색을 바꾸지 않습니다.
- 색만으로 완료·진행·예정 상태를 전달하지 않습니다. 아이콘, 글자, 테두리, `aria-current`를 함께 사용합니다.
- 화면에 표시되는 핵심 버튼은 키보드로 접근할 수 있고 최소 44px 높이를 갖습니다.
- 장식이 아닌 교육 근거는 요약 카드와 닫힌 `details`로 나누어 처음 읽는 부담을 줄입니다.

## 토큰

### 색상

| 토큰 | 값 | 사용 |
| --- | --- | --- |
| `--color-paper` | `#fffaf0` | 앱 바깥 배경 |
| `--color-surface` | `#ffffff` | 헤더·본문·카드 표면 |
| `--color-navy` | `#102a43` | 제목·강한 잉크 |
| `--color-muted` | `#486581` | 설명·보조 상태 |
| `--color-line` | `#bcccdc` | 경계선 |
| `--color-action` | `#1d4ed8` | 기본 행동·증거 강조 |
| `--color-action-strong` | `#173ea5` | 버튼 테두리·강한 행동 |
| `--color-evidence` | `#0f766e` | 분포·근거 보조 강조 |
| `--color-focus` | `#f59e0b` | `:focus-visible` 외곽선 |
| `--color-error` | `#b91c1c` | 검증 오류만 사용 |

### 크기와 모서리

- `--radius-card: 16px`는 카드·패널의 공통 모서리입니다.
- `--space-1`부터 `--space-5`는 8px 단위 간격을 사용합니다.
- `--content-width: 1180px`를 기준으로 콘텐츠를 가운데 정렬합니다.
- 페이지 좌우 여백은 16~24px, 카드 간격은 12~24px 범위입니다.
- 본문 기본 줄 높이는 1.6 이상, 제목 줄 높이는 1.25 이상입니다.

## 레이아웃 패턴

### 앱 프레임

```text
app-shell
├─ skip-link
├─ app-header
│  ├─ app-header__brand
│  ├─ app-header__progress
│  └─ app-header__boundary
├─ app-main
└─ app-footer
```

헤더의 5개 미션은 데스크톱에서 5열, 760px 이하에서 2열로 배치하고 마지막 미션은 두 열을 차지합니다. 앱 헤더의 경계 안내는 완료 화면에서 숨겨 완료 카드 안의 문장 하나만 남깁니다.

### 미션 프롬프트

`StagePrompt`는 `data-prompt-kind="current-action"`를 가진 한 개의 패널입니다. 작은 eyebrow, 행동형 제목, 한 문단 설명, 선택적 완료 조건, 선택적 버튼 슬롯 순서로 렌더링합니다. 상태나 브라우저 API를 소유하지 않습니다.

### 카드와 근거

- 추천 카드 순서: 주제 배지 → 제목 → 요약 → 행동 그룹 → 선택 근거 토큰.
- 피드는 데스크톱 4열, 태블릿 3열, 375px 모바일 2열입니다.
- 카드 행동은 `.recommendation-card__actions`로 묶고 두 버튼 모두 기본 브라우저 버튼과 기존 접근성 이름을 유지합니다.
- 숫자·표·오류 알림은 먼저 보이는 요약에 두고, 긴 규칙 설명은 닫힌 `details` 안에 둡니다.

## 행동과 모션

- 단계에서 반드시 눌러야 하는 기본 버튼에는 `data-gi-pulse="true"`와 `.gi-pulse`를 함께 사용합니다.
- 펄스는 시선을 안내하는 보조 신호이며 색이나 모션만으로 의미를 전달하지 않습니다.
- `@media (prefers-reduced-motion: reduce)`에서는 keyframe과 전환을 제거하고 `.motion-static-label` 같은 정적 테두리·문구를 표시합니다.
- 다이얼로그 열기·닫기, 선택 후 포커스 이동, 오류 포커스는 기존 동작을 유지합니다.

## 반응형 기준

| 폭 | 핵심 규칙 |
| --- | --- |
| 320px | 가로 스크롤 없음, CTA가 첫 화면에 보임, 버튼 텍스트 줄바꿈 허용 |
| 375px | 헤더 2열 미션, 추천 피드 2열, 카드 행동 44px 이상 |
| 768px | 피드 3열, 패널 내부 여백 확대 |
| 1280px 이상 | 최대 1180px 콘텐츠, 피드 4열, 근거 패널 병렬 배치 |

## 접근성 계약

- `<main id="main-content" tabIndex={-1}>`와 건너뛰기 링크를 유지합니다.
- 헤딩 레벨과 `aria-labelledby`, `aria-current="step"`, `aria-pressed`, `role="alert"` 계약을 변경하지 않습니다.
- `:focus-visible`은 3px amber 외곽선과 2px offset을 사용합니다.
- 이 문서는 VoiceOver 실행 검수나 인간 아동 관찰을 승인하는 문서가 아닙니다. VoiceOver는 프로젝트 범위에서 제외되며, 키보드·스크린 리더 의미 구조·자동 접근성 검사는 별도 증거로 기록합니다.

## 자산 정책

현재 일반 교육용 이미지가 없으므로 `public/favicon.svg`만 브랜드 식별 자산으로 보존합니다. 이미지 생성은 실행하지 않았고, 자산 분류·대체 금지·롤백 정보는 `work/education-webapp-redesign-assets.md`에 기록합니다.

## 지원 역할 기록

세션에 `impeccable`, `ui-ux-pro-max`, `redesign-existing-projects` 지원 Skill이 없어 사용하지 않았습니다. 이 시스템은 기존 설계 문서와 직접 수행한 브라우저 감사에서 도출했습니다.
