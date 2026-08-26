export type UpdateCategory = '설계' | '개발' | '개선';

export interface UpdateEntry {
  date: `${number}-${number}-${number}`;
  category: UpdateCategory;
  summary: string;
}

export const UPDATE_HISTORY: readonly UpdateEntry[] = [
  { date: '2026-08-26', category: '설계', summary: '최초 설계 문서 작성' },
  { date: '2026-08-27', category: '개발', summary: 'MVP 구현과 디지털 시민성·접근성 검수' },
] as const;
