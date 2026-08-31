# Elementary Web App Learner Language Audit

감사일: 2026-08-31
대상 학년: 초등 5~6학년, 초등 3~4학년 가드레일
소스: `src/features/{prediction,balance,transparency}/`, 실제 공개 DOM, `work/elementary-webapp-ux-language-candidates.md`

## 수집 한계

자동 수집 결과는 generated Playwright report와 테스트 문구까지 포함한 triage 후보입니다. 따라서 report·fixture·개발자용 식별자를 학습자 문구로 판정하지 않고, 실제 렌더링되는 학생 화면만 수동 대조했습니다. 정적 후보 보고서는 자동 재작성에 사용하지 않았습니다.

## 변환 장부

| ID | Screen/state | Surface | Static/dynamic | Before | After | Difficulty signals | Learning intent preserved | Curriculum accuracy | Probe |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LANG-001 | choice / rule transparency | hint | static | `카드 8장을 고정하고, 토큰이 큰 주제부터 결정적 규칙으로 배정합니다.` | `토큰은 주제마다 붙는 점수예요. 관심을 보인 주제와 다른 주제를 보여 주는 점수가 카드 8장 배분에 쓰여요.` | abstract-or-formal, technical-or-internal | yes | confirmed against existing deterministic recommendation engine | 핵심 용어 설명: 토큰을 점수로 말하기 |
| LANG-002 | choice / prediction | hint | static | `포커스 주제 카드 수 예측`만 제공 | `포커스 주제는 방금 같은 자리에 세 번 고른 주제예요.`를 legend 앞 안내로 추가 | missing-term-explanation | yes | confirmed against selection gate requiring one repeated topic | 지시 재진술: 어느 주제의 카드 수를 고르는가 |
| LANG-003 | balance / slider | hint + aria description | static | `다양성 토큰 설정` | `다양성 토큰은 다른 주제를 보여 주는 점수예요. 0은 보태지 않고, 2는 가장 많이 보태요.` | abstract-or-formal, missing-term-explanation | yes | confirmed against diversity levels 0–2 | 결과 예측: 0과 2의 차이 |
| LANG-004 | balance / save and compare | status | dynamic | `서로 다른 설정 3/3개 저장됨` | unchanged; numeric progress is concrete and useful | none after review | yes | confirmed against three-snapshot gate | 회복 행동: 몇 개를 더 저장해야 하는가 |
| LANG-005 | comparison / wrong answer | feedback | dynamic | `두 목록의 주제 수를 다시 관찰해 보세요.` | unchanged; followed by linked before/after counts | missing-recovery risk reviewed, no rewrite | yes | confirmed against factual delta | 회복 행동: 표 링크를 다시 읽기 |
| LANG-006 | report / empty submit | error | dynamic | eight short missing-field messages | unchanged; first missing field receives focus and scroll | multiple-actions reviewed, focus contract passes | yes | confirmed against report validation requirements | 회복 행동: 첫 안내부터 채우기 |

## 적용 순서

1. LANG-001을 규칙 투명창의 기본 요약으로 표시하고 6열 계산표는 details로 접습니다.
2. LANG-002를 예측 패널에 추가하되 radio accessible name과 도메인 answer 값은 변경하지 않습니다.
3. LANG-003을 balance slider 도움말과 `aria-describedby`로 연결합니다.
4. 기존 오류·완료 문구는 실제 회복 증거가 통과했으므로 문장 취향만으로 바꾸지 않습니다.

## 판정

이번 언어 작업은 교과 용어를 삭제하지 않고 첫 등장에 구체적인 뜻을 붙이는 P2 완화입니다. 실제 학생 집단의 읽기 수준을 인증하지 않으며, 교사·보호자 문체 검토는 별도 human review로 남깁니다.
