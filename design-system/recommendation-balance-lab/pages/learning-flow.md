# Learning Flow Page Override

작성일: 2026-08-30
상위 기준: `design-system/recommendation-balance-lab/MASTER.md`
제품 기준: `design-system/MASTER.md`, `2026-08-26-recommendation-balance-lab-design.md`

## 적용 범위

이 앱은 초등 5~6학년이 교실에서 선택과 추천 분포의 관계를 관찰하는 React/Vite 정적 학습 흐름입니다. 로그인·검색·결제·사용자 프로필이 없는 단일 화면 앱이므로 Hero + Features + CTA 검색 결과를 그대로 랜딩 페이지로 확장하지 않고, 현재 미션·근거·다음 행동의 순서를 우선합니다.

## 시각·타이포그래피 예외

- 검색 결과의 Minimalism/Swiss 방향, 여백, 명확한 한 가지 주 행동, teal/amber 교육 강조를 사용합니다.
- 검색 결과가 제안한 Fira Code/Fira Sans와 Google Fonts 원격 import는 사용하지 않습니다. 한국어 가독성, 정적 배포, 개인정보·네트워크 경계를 위해 시스템 글꼴 스택을 유지합니다.
- 기존 프로젝트 토큰 `--color-action`(파랑)은 학생이 눌러야 하는 행동, `--color-evidence`(청록)는 관찰 근거, `--color-focus`(호박색)는 키보드 포커스로 사용합니다. 색만으로 상태를 전달하지 않습니다.
- 주제 배지의 기존 이모지 glyph는 보이는 텍스트 옆의 장식 요소로만 사용하며 `aria-hidden="true"`를 적용합니다. 새 구조 아이콘이나 이모지 기반 컨트롤은 추가하지 않습니다.

## 레이아웃·행동

- 첫 화면의 `실험 시작`은 320×812와 375×812에서 스크롤 없이 보여야 합니다.
- 추천 피드는 데스크톱 4열, 태블릿 3열, 모바일 2열이며 버튼은 44px 이상입니다.
- 각 미션은 `StagePrompt` 한 개, 현재 행동 한 개, 완료 조건 한 개를 먼저 보여 줍니다.
- 표와 카드 숫자는 요약을 먼저 보여 주고, 세부 규칙은 `details`로 점진 공개합니다.
- 다이얼로그는 열릴 때 포커스를 받고 Escape/닫기 뒤 원래 트리거로 돌아갑니다. Tab 이동은 다이얼로그 안에 머뭅니다.
- `prefers-reduced-motion: reduce`에서는 gi-pulse와 전환을 정적 경계·문구로 바꿉니다.

## 안전·보존 계약

- 추천 계산, 카드·주제·공급 데이터, reducer stage transition, 보고서 판정, 개인정보 문구는 변경하지 않습니다.
- fetch/XHR, analytics, 쿠키·localStorage/sessionStorage, 계정 입력, TTS·오디오·공유 기능을 추가하지 않습니다.
- `public/favicon.svg`는 브랜드 자산으로 보존하며 일반 교육 일러스트는 필요하지 않아 생성하지 않습니다.
- VoiceOver 실행 검수와 실제 아동·기기 승인은 이 작업의 증거로 사용하지 않습니다.
