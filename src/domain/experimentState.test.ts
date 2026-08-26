import { describe, expect, it } from 'vitest';
import { CARDS } from '../data/cards';
import { MISSIONS } from '../data/missions';
import { SUPPLY_PROFILES } from '../data/supplyProfiles';
import type { ContentCard, InterestRecord } from './types';
import { recommend, type RecommendationRequest, type RecommendationResult } from './recommendationEngine';
import {
  applyExploration,
  canRunPrediction,
  experimentReducer,
  findExplorationCandidates,
  initialExperimentState,
  missionForStage,
  nextPracticeCard,
  type ExperimentAction,
  type ExperimentState,
  type PredictionAnswer,
} from './experimentState';

const zeroInterest: InterestRecord = { science: 0, art: 0, sports: 0, nature: 0, history: 0 };
const scienceThreeInterest: InterestRecord = { science: 3, art: 0, sports: 0, nature: 0, history: 0 };
const zeroInterestRequest: RecommendationRequest = {
  interest: zeroInterest,
  diversityLevel: 0,
  memoryMode: 'keep',
  supplyProfileId: 'balanced',
  round: 0,
  feedSize: 8,
};
const scienceThreeRequest: RecommendationRequest = {
  interest: scienceThreeInterest,
  diversityLevel: 0,
  memoryMode: 'keep',
  supplyProfileId: 'balanced',
  round: 1,
  feedSize: 8,
};
const balanced = SUPPLY_PROFILES.find((item) => item.id === 'balanced')!;
const initialResult = recommend(zeroInterestRequest, CARDS, balanced);
const scienceHeavyResult = recommend(scienceThreeRequest, CARDS, balanced);
const explorationResult = recommend({
  ...scienceThreeRequest,
  interest: { ...scienceThreeInterest, art: 1 },
  round: 2,
}, CARDS, balanced);

const card = (id: string) => CARDS.find((item) => item.id === id)!;
const select = (state: ExperimentState, selectedId: string, replacementId: string): ExperimentState =>
  experimentReducer(state, { type: 'SELECT_CARD', card: card(selectedId), replacement: card(replacementId) });

const stateAfterTwoSelections = select(
  select(experimentReducer(initialExperimentState(), { type: 'START' }), 'science-1', 'science-3'),
  'science-2',
  'science-4',
);
const stateAfterThreeSameTopicSelections = select(
  stateAfterTwoSelections,
  'science-3',
  'science-5',
);
const selectingAnotherTopicAfterFocus = select(
  select(experimentReducer(initialExperimentState(), { type: 'START' }), 'science-1', 'science-3'),
  'art-2',
  'art-3',
);

describe('추천 실험 상태 머신', () => {
  it('균형 초기 결과로 새 상태를 만들고 START에서 선택 단계로 이동한다', () => {
    const state = initialExperimentState();
    expect(state.stage).toBe('intro');
    expect(state.initialResult).toEqual(initialResult);
    expect(state.choiceFeed).toEqual(initialResult.cards);
    expect(state.interest).toEqual(zeroInterest);
    expect(experimentReducer(state, { type: 'START' }).stage).toBe('choice');
  });

  it('같은 주제 선택만 관심 기록에 세 번 누적하고 슬롯을 결정적으로 교체한다', () => {
    expect(stateAfterTwoSelections.interest.science).toBe(2);
    expect(stateAfterTwoSelections.choiceFeed.map((item) => item.id)).toContain('science-3');
    expect(stateAfterThreeSameTopicSelections.interest.science).toBe(3);
    expect(new Set(stateAfterThreeSameTopicSelections.selectionHistory.map((item) => item.cardId)).size).toBe(3);
    expect(stateAfterThreeSameTopicSelections.selectionHistory.map((item) => item.ordinal)).toEqual([1, 2, 3]);
    expect(canRunPrediction(stateAfterTwoSelections)).toBe(false);
    expect(canRunPrediction(stateAfterThreeSameTopicSelections)).toBe(true);
  });

  it('포커스 주제 이외 선택은 기록을 보존하고 짧은 오류를 남긴다', () => {
    expect(selectingAnotherTopicAfterFocus.lastError).toBe('같은 주제 카드를 세 번 선택해 주세요.');
    expect(selectingAnotherTopicAfterFocus.selectionHistory).toHaveLength(1);
    expect(selectingAnotherTopicAfterFocus.interest).toEqual({ ...zeroInterest, science: 1 });
  });

  it('현재 피드가 아닌 카드, 중복 카드, 잘못된 교체를 모두 거부한다', () => {
    const active = experimentReducer(initialExperimentState(), { type: 'START' });
    const afterFirst = select(active, 'science-1', 'science-3');
    const before = afterFirst;
    const staleSelection = experimentReducer(afterFirst, {
      type: 'SELECT_CARD', card: card('science-1'), replacement: card('science-4'),
    });
    const duplicateReplacement = experimentReducer(afterFirst, {
      type: 'SELECT_CARD', card: card('science-2'), replacement: card('science-3'),
    });
    const wrongNext = experimentReducer(afterFirst, {
      type: 'SELECT_CARD', card: card('science-2'), replacement: card('science-5'),
    });
    expect(staleSelection.selectionHistory).toEqual(before.selectionHistory);
    expect(duplicateReplacement.selectionHistory).toEqual(before.selectionHistory);
    expect(wrongNext.selectionHistory).toEqual(before.selectionHistory);
    expect(staleSelection.lastError).toBeTruthy();
    expect(duplicateReplacement.lastError).toBeTruthy();
    expect(wrongNext.lastError).toBeTruthy();
  });

  it('예측은 세 선택 뒤에만 비교 결과를 기록한다', () => {
    const answer: PredictionAnswer = { focusDirection: 'increase', varietyDirection: 'decrease' };
    const blocked = experimentReducer(stateAfterTwoSelections, {
      type: 'SUBMIT_PREDICTION', answer, result: scienceHeavyResult,
    });
    const compared = experimentReducer(stateAfterThreeSameTopicSelections, {
      type: 'SUBMIT_PREDICTION', answer, result: scienceHeavyResult,
    });
    expect(blocked.stage).toBe('choice');
    expect(blocked.prediction).toBeNull();
    expect(compared.stage).toBe('comparison');
    expect(compared.prediction).toEqual(answer);
    expect(compared.changedResult).toEqual(scienceHeavyResult);
  });

  it('분포 사실 확인 오답은 증거를 보존하고 정답은 탐색으로 연다', () => {
    const answer: PredictionAnswer = { focusDirection: 'increase', varietyDirection: 'decrease' };
    const compared = experimentReducer(stateAfterThreeSameTopicSelections, {
      type: 'SUBMIT_PREDICTION', answer, result: scienceHeavyResult,
    });
    const wrong = experimentReducer(compared, {
      type: 'SUBMIT_DISTRIBUTION', answer: { focusDirection: 'same', varietyDirection: 'same' },
    });
    const right = experimentReducer(compared, { type: 'SUBMIT_DISTRIBUTION', answer });
    expect(wrong.stage).toBe('comparison');
    expect(wrong.prediction).toEqual(answer);
    expect(wrong.changedResult).toEqual(scienceHeavyResult);
    expect(wrong.distributionAnswer).toEqual({ focusDirection: 'same', varietyDirection: 'same' });
    expect(wrong.lastError).toBeTruthy();
    expect(right.stage).toBe('exploration');
    expect(right.distributionAnswer).toEqual(answer);
  });

  it('저장된 topicCounts가 틀려도 실제 카드 분포의 정답으로 탐색을 연다', () => {
    const answer: PredictionAnswer = { focusDirection: 'increase', varietyDirection: 'decrease' };
    const compared = experimentReducer(stateAfterThreeSameTopicSelections, {
      type: 'SUBMIT_PREDICTION', answer, result: scienceHeavyResult,
    });
    const inconsistent = {
      ...compared,
      initialResult: {
        ...compared.initialResult,
        topicCounts: { science: 8, art: 0, sports: 0, nature: 0, history: 0 },
      },
      changedResult: {
        ...compared.changedResult!,
        topicCounts: { science: 8, art: 0, sports: 0, nature: 0, history: 0 },
      },
    };
    const opened = experimentReducer(inconsistent, { type: 'SUBMIT_DISTRIBUTION', answer });
    expect(opened.stage).toBe('exploration');
    expect(opened.distributionAnswer).toEqual(answer);
  });

  it('포커스가 아닌 탐색 한 번 뒤 균형 단계로 이동하고 중복 탐색은 막는다', () => {
    const answer: PredictionAnswer = { focusDirection: 'increase', varietyDirection: 'decrease' };
    const compared = experimentReducer(stateAfterThreeSameTopicSelections, {
      type: 'SUBMIT_PREDICTION', answer, result: scienceHeavyResult,
    });
    const exploration = experimentReducer(compared, { type: 'SUBMIT_DISTRIBUTION', answer });
    const explored = experimentReducer(exploration, { type: 'RECORD_EXPLORATION', topicId: 'art', result: explorationResult });
    expect(explored.stage).toBe('balance');
    expect(explored.interest).toEqual({ ...scienceThreeInterest, art: 1 });
    expect(explored.explorationResult).toEqual(explorationResult);
    const duplicate = experimentReducer(explored, { type: 'RECORD_EXPLORATION', topicId: 'sports', result: explorationResult });
    expect(duplicate.stage).toBe('balance');
    expect(duplicate.lastError).toBe('탐색은 한 번만 기록할 수 있습니다.');
    expect(duplicate.changedResult).toBe(explored.changedResult);
    expect(duplicate.explorationResult).toBe(explored.explorationResult);
  });

  it('실제 카드 수가 저장된 수보다 우선하고 후보는 비어 있는 주제부터 고른다', () => {
    const tampered = {
      ...scienceHeavyResult,
      topicCounts: { science: 0, art: 8, sports: 0, nature: 0, history: 0 },
    };
    expect(findExplorationCandidates(tampered, CARDS, 'science').map((candidate) => candidate.topicId)).toEqual([
      'history', 'art', 'sports', 'nature',
    ]);
  });

  it('후보는 주제별로 입력 순서의 새 카드 하나만 남긴다', () => {
    const result = scienceHeavyResult;
    const cards = [card('history-2'), card('history-2'), card('art-2'), card('science-1'), card('sports-2'), card('nature-2')];
    const candidates = findExplorationCandidates(result, cards, 'science');
    expect(candidates).toHaveLength(4);
    expect(candidates.map((item) => item.id)).toEqual(['history-2', 'art-2', 'sports-2', 'nature-2']);
  });

  it('탐색은 포커스에 다시 토큰을 더하지 않고, 유효하지 않은 주제는 명시적으로 거부한다', () => {
    const original = { ...scienceThreeInterest };
    expect(applyExploration(original, 'science', 'science')).toBe(original);
    expect(applyExploration(original, 'art', 'science')).toEqual({ ...scienceThreeInterest, art: 1 });
    expect(() => applyExploration(original, 'unknown' as never, 'science')).toThrowError(
      expect.objectContaining({ name: 'InvalidExplorationError', message: '탐색 주제가 올바르지 않습니다.' }),
    );
  });

  it('탐색 결과는 요청을 보존한 round+1 결정적 결과만 받고 변조 결과를 거부한다', () => {
    const answer: PredictionAnswer = { focusDirection: 'increase', varietyDirection: 'decrease' };
    const compared = experimentReducer(stateAfterThreeSameTopicSelections, {
      type: 'SUBMIT_PREDICTION', answer, result: scienceHeavyResult,
    });
    const ready = experimentReducer(compared, { type: 'SUBMIT_DISTRIBUTION', answer });
    const tampered = { ...explorationResult, topicCounts: { ...explorationResult.topicCounts, art: 8, science: 0 } };
    const rejected = experimentReducer(ready, { type: 'RECORD_EXPLORATION', topicId: 'art', result: tampered });
    expect(rejected.stage).toBe('exploration');
    expect(rejected.explorationResult).toBeNull();
    expect(rejected.lastError).toBe('탐색 결과가 가상 규칙과 일치하지 않습니다.');

    const accepted = experimentReducer(ready, { type: 'RECORD_EXPLORATION', topicId: 'art', result: explorationResult });
    expect(accepted.stage).toBe('balance');
    expect(accepted.explorationResult?.request).toEqual({
      interest: { ...scienceThreeInterest, art: 1 },
      diversityLevel: 0,
      memoryMode: 'keep',
      supplyProfileId: 'balanced',
      round: 2,
      feedSize: 8,
    });
    expect(accepted.changedResult).toEqual(scienceHeavyResult);
  });

  it('탐색 결과의 관심 기록, 공급, 라운드 변조를 모두 거부한다', () => {
    const answer: PredictionAnswer = { focusDirection: 'increase', varietyDirection: 'decrease' };
    const compared = experimentReducer(stateAfterThreeSameTopicSelections, {
      type: 'SUBMIT_PREDICTION', answer, result: scienceHeavyResult,
    });
    const ready = experimentReducer(compared, { type: 'SUBMIT_DISTRIBUTION', answer });
    const tamperedResults = [
      {
        ...explorationResult,
        request: { ...explorationResult.request, interest: { ...explorationResult.request.interest, art: 7 } },
      },
      { ...explorationResult, request: { ...explorationResult.request, supplyProfileId: 'nature-rich' as const } },
      { ...explorationResult, request: { ...explorationResult.request, round: 9 } },
    ];
    for (const result of tamperedResults) {
      const rejected = experimentReducer(ready, { type: 'RECORD_EXPLORATION', topicId: 'art', result });
      expect(rejected.stage).toBe('exploration');
      expect(rejected.explorationResult).toBeNull();
      expect(rejected.lastError).toBe('탐색 결과가 가상 규칙과 일치하지 않습니다.');
    }
  });

  it('연습 카드는 원래 순서에서 사용하지 않은 첫 카드를 고르고 소진을 명시한다', () => {
    expect(nextPracticeCard('science', new Set(['science-1', 'science-2']), CARDS).id).toBe('science-3');
    expect(nextPracticeCard('art', ['art-1'], CARDS).id).toBe('art-2');
    expect(() => nextPracticeCard('science', CARDS.filter((item) => item.topicId === 'science').map((item) => item.id), CARDS)).toThrow('연습 카드가 소진되었습니다.');
  });

  it('미션 단계 매핑과 RESET, 새 인스턴스가 결정적으로 동작한다', () => {
    expect(missionForStage('choice')).toEqual(MISSIONS[0]);
    expect(missionForStage('comparison')).toEqual(MISSIONS[1]);
    expect(missionForStage('exploration')).toEqual(MISSIONS[2]);
    expect(missionForStage('balance')).toEqual(MISSIONS[3]);
    expect(missionForStage('audit')).toEqual(MISSIONS[4]);
    expect(missionForStage('intro')).toBeNull();
    expect(missionForStage('report')).toBeNull();
    expect(missionForStage('complete')).toBeNull();
    const reset = experimentReducer(stateAfterThreeSameTopicSelections, { type: 'RESET' });
    expect(reset).toEqual(initialExperimentState());
    expect(reset).not.toBe(initialExperimentState());
    const first = initialExperimentState();
    const second = initialExperimentState();
    first.interest.science = 99;
    expect(second.interest.science).toBe(0);
  });

  it('선택 결과는 외부 replacement 객체 변조와 독립이다', () => {
    const active = experimentReducer(initialExperimentState(), { type: 'START' });
    const externalReplacement = { ...card('science-3') };
    const selected = experimentReducer(active, {
      type: 'SELECT_CARD',
      card: card('science-1'),
      replacement: externalReplacement,
    });

    externalReplacement.title = '외부에서 변조한 제목';
    expect(selected.choiceFeed.find((item) => item.id === 'science-3')?.title).toBe('자석의 힘');
    expect(initialExperimentState().initialResult.cards.find((item) => item.id === 'science-1')?.title).toBe('달의 모양 기록');
  });

  it('예측 결과의 모든 중첩 구조를 외부 변조로부터 격리한다', () => {
    const answer: PredictionAnswer = { focusDirection: 'increase', varietyDirection: 'decrease' };
    const mutableResult = JSON.parse(JSON.stringify(scienceHeavyResult)) as RecommendationResult;
    const compared = experimentReducer(stateAfterThreeSameTopicSelections, {
      type: 'SUBMIT_PREDICTION', answer, result: mutableResult,
    });

    (mutableResult.cards as ContentCard[])[0].title = '변조된 카드 제목';
    mutableResult.request.interest.science = 99;
    mutableResult.topicCounts.science = 0;
    mutableResult.tokenBreakdown.science.totalTokens = 999;
    mutableResult.explanations[0].cardId = 'science-8';

    expect(compared.changedResult).toEqual(scienceHeavyResult);
  });

  it('탐색 결과도 외부 RecommendationResult 변조와 독립이다', () => {
    const answer: PredictionAnswer = { focusDirection: 'increase', varietyDirection: 'decrease' };
    const compared = experimentReducer(stateAfterThreeSameTopicSelections, {
      type: 'SUBMIT_PREDICTION', answer, result: scienceHeavyResult,
    });
    const ready = experimentReducer(compared, { type: 'SUBMIT_DISTRIBUTION', answer });
    const externalResult = JSON.parse(JSON.stringify(explorationResult)) as RecommendationResult;
    const explored = experimentReducer(ready, {
      type: 'RECORD_EXPLORATION', topicId: 'art', result: externalResult,
    });

    (externalResult.cards as ContentCard[])[0].title = '변조된 탐색 제목';
    externalResult.request.interest.art = 88;
    externalResult.topicCounts.art = 0;
    externalResult.tokenBreakdown.art.totalTokens = 888;
    externalResult.explanations[0].cardId = 'art-8';

    expect(explored.explorationResult).toEqual(explorationResult);
  });

  it('알 수 없는 런타임 action은 증거를 보존하고 안정적인 오류를 남긴다', () => {
    const unknown = experimentReducer(
      stateAfterThreeSameTopicSelections,
      { type: 'UNKNOWN' } as unknown as ExperimentAction,
    );
    expect({ ...unknown, lastError: null }).toEqual({
      ...stateAfterThreeSameTopicSelections,
      lastError: null,
    });
    expect(unknown.lastError).toBe('알 수 없는 실험 동작입니다.');
    expect(unknown).not.toBe(stateAfterThreeSameTopicSelections);
  });
});
