export type UpdateCategory = '설계' | '개발' | '개선';

export interface UpdateEntry {
  date: `${number}-${number}-${number}`;
  category: UpdateCategory;
  summary: string;
}

export const UPDATE_HISTORY: readonly UpdateEntry[] = [
  { date: '2026-08-26', category: '설계', summary: '최초 설계 문서 작성' },
  { date: '2026-08-27', category: '개발', summary: 'MVP 구현과 디지털 시민성·접근성 검수' },
  { date: '2026-08-27', category: '개선', summary: '네이티브 Escape 닫기 경로와 닫힘 후 포커스 복원을 단일화' },
  { date: '2026-08-27', category: '개선', summary: '교실용 시각 체계와 모션 감소 대체 개선' },
  { date: '2026-08-27', category: '개선', summary: '추천 전환·터치 영역·모션 감소 대체 검증 보강' },
  { date: '2026-08-27', category: '개선', summary: '실제 추천 흐름 전환과 모션 환경 검증 보강' },
  { date: '2026-08-27', category: '개선', summary: '모바일·키보드·스크린 리더 학습 흐름 개선' },
  { date: '2026-08-28', category: '개선', summary: '학습자용 문장과 모바일 흐름 개선' },
  { date: '2026-08-29', category: '개선', summary: '첫 행동 위계·모바일 카드 밀도·미션 안내를 재설계' },
  { date: '2026-08-30', category: '개선', summary: '주제 배지 의미·표 숫자 가독성·모션 토큰을 보강' },
  { date: '2026-08-31', category: '개선', summary: '토큰 설명·근거 표 접기·탐색과 감사 행동 강조를 보강' },
] as const;
