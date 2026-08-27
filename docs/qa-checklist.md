# Recommendation Balance Lab QA checklist

검수일: 2026-08-27 · 실행 환경: Node v24.15.0, Chromium Playwright 1.62.1

Fix Round 1 보정: accepted card replacement 뒤 240ms 전환 안정화 대기를 사용하며 force/trial click은 사용하지 않았습니다.

| 항목 | 결과 | 근거 또는 경계 |
|---|---|---|
| 콘텐츠 중립성 | 자동 단위 검증 통과 | 다섯 중립 주제와 실제 플랫폼 비목표 문구 확인 |
| 결정적 재실행 | 자동 단위 검증 통과 | 동일 입력 추천 엔진 단위 테스트 보존 |
| 375×812 모바일 | E2E GREEN | `mobile.spec.ts` 가로 overflow 검사 통과 |
| 키보드 단독 조작 | E2E GREEN | Enter/Space keyboard flow 및 두 dialog Escape 통과 |
| 모션 감소 | E2E GREEN | reduced-motion 정적 표·문장·행동 안내 통과 |
| Axe WCAG 2.2 A/AA | E2E GREEN | intro/comparison/balance/audit/report 검사 통과 |
| VoiceOver(macOS) | 범위 제외(사용자 요청) | 실제 사람의 macOS VoiceOver 검수는 수행하지 않음 |
| 저장·네트워크 경계 | 자동 검색 통과 | production runtime privacy search 결과 0건 |
| 40장 카드·8장 피드 | E2E GREEN | learning-flow에서 8개 카드 검사 통과 |
| 모든 카드 이유 버튼 | E2E GREEN | 각 recommendation feed에서 8개 role/name 버튼 검사 통과 |
| 보고서 중립성 | E2E GREEN | 조건 세 가지와 가상 단순 규칙 한계 선택 통과 |
