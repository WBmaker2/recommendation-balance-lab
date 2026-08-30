import { describe, expect, it } from 'vitest';
import { UPDATE_HISTORY } from './updateHistory';

describe('업데이트 내역 데이터', () => {
  it('records the learner-facing and mobile-flow improvement date', () => {
    expect(UPDATE_HISTORY).toContainEqual({
      date: '2026-08-28',
      category: '개선',
      summary: '학습자용 문장과 모바일 흐름 개선',
    });
    expect(UPDATE_HISTORY).toContainEqual({
      date: '2026-08-29',
      category: '개선',
      summary: '첫 행동 위계·모바일 카드 밀도·미션 안내를 재설계',
    });
    expect(UPDATE_HISTORY).toContainEqual({
      date: '2026-08-30',
      category: '개선',
      summary: '주제 배지 의미·표 숫자 가독성·모션 토큰을 보강',
    });
  });

  it('keeps entries in chronological ISO date order with useful summaries', () => {
    expect(UPDATE_HISTORY.every((entry) => /^\d{4}-\d{2}-\d{2}$/.test(entry.date))).toBe(true);
    expect(UPDATE_HISTORY.every((entry) => entry.summary.trim().length > 0)).toBe(true);
    expect([...UPDATE_HISTORY].sort((left, right) => left.date.localeCompare(right.date))).toEqual(UPDATE_HISTORY);
  });
});
