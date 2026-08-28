# Recommendation Balance Lab QA checklist

검수일: 2026-08-28 · 실행 환경: Node v24.15.0, Chromium Playwright 1.62.1

Fix Round 1 보정: accepted card replacement 뒤 CSS 240ms + 20ms 여유(총 260ms) 전환 안정화 대기를 사용하며 force/trial click은 사용하지 않았습니다.

최종 보완 후 `PLAYWRIGHT_PORT=4176 npm run test:e2e`를 권한 확장 환경에서 실행했으며 Chromium 5개 시나리오가 모두 통과했습니다. VoiceOver는 사용자 요청에 따라 제외했습니다.

| 항목 | 결과 | 근거 또는 경계 |
|---|---|---|
| 콘텐츠 중립성 | 자동 단위 검증 통과 | 다섯 중립 주제와 실제 플랫폼 비목표 문구 확인 |
| 결정적 재실행 | 자동 단위 검증 통과 | 동일 입력 추천 엔진 단위 테스트 보존 |
| 375×812 모바일 | 통과 | 최종 보완 후 E2E에서 모든 단계 가로 넘침 없음 |
| 키보드 단독 조작 | 통과 | 최종 보완 후 E2E에서 전체 흐름·두 dialog Escape·포커스 복귀 확인 |
| 모션 감소 | 통과 | 최종 보완 후 E2E에서 정적 evidence branch와 전환 부재 확인 |
| Axe WCAG 2.2 A/AA | 통과 | intro/comparison/exploration/balance/audit/report 6단계 검사 통과 |
| VoiceOver(macOS) | 범위 제외(사용자 요청) | 실제 사람의 macOS VoiceOver 검수는 수행하지 않음 |
| 저장·네트워크 경계 | 자동 검색 통과 | production runtime privacy search 결과 0건 |
| 40장 카드·8장 피드 | 통과 | 최종 보완 후 learning-flow E2E 통과 |
| 모든 카드 이유 버튼 | 통과 | 최종 보완 후 카드 이유 role/name·닫힘 흐름 통과 |
| 보고서 중립성 | 통과 | 최종 보완 후 보고서 제출·완료 문장 E2E 통과 |
