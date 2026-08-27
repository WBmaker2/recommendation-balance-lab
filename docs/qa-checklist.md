# Recommendation Balance Lab QA checklist

검수일: 2026-08-27 · 실행 환경: Node v24.15.0, Chromium Playwright 1.62.1

Fix Round 1 보정: accepted card replacement 뒤 240ms 전환 안정화 대기를 사용하며 force/trial click은 사용하지 않았습니다.

최종 보완 후 E2E는 실행 안전 제한으로 미검증 상태입니다. 아래 E2E 항목은 이전 보완 전 5/5 결과와 구분하여 보류합니다.

| 항목 | 결과 | 근거 또는 경계 |
|---|---|---|
| 콘텐츠 중립성 | 자동 단위 검증 통과 | 다섯 중립 주제와 실제 플랫폼 비목표 문구 확인 |
| 결정적 재실행 | 자동 단위 검증 통과 | 동일 입력 추천 엔진 단위 테스트 보존 |
| 375×812 모바일 | post-fix E2E 미검증 | 최종 보완 후 브라우저 미실행; 이전 보완 전 결과와 구분 |
| 키보드 단독 조작 | post-fix E2E 미검증 | 최종 보완 후 브라우저 미실행; 키보드 경로 코드는 보존 |
| 모션 감소 | post-fix E2E 미검증 | 최종 보완 후 브라우저 미실행; reduced-motion 검사는 보존 |
| Axe WCAG 2.2 A/AA | post-fix E2E 미검증 | 최종 보완 후 브라우저 미실행; audit 포함 검사는 보존 |
| VoiceOver(macOS) | 범위 제외(사용자 요청) | 실제 사람의 macOS VoiceOver 검수는 수행하지 않음 |
| 저장·네트워크 경계 | 자동 검색 통과 | production runtime privacy search 결과 0건 |
| 40장 카드·8장 피드 | post-fix E2E 미검증 | 최종 보완 후 브라우저 미실행; learning-flow 검사 코드는 보존 |
| 모든 카드 이유 버튼 | post-fix E2E 미검증 | 최종 보완 후 브라우저 미실행; role/name 검사 코드는 보존 |
| 보고서 중립성 | post-fix E2E 미검증 | 최종 보완 후 브라우저 미실행; 선택 검사는 보존 |
