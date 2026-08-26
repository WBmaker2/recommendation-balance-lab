import type { MissionDefinition } from '../domain/types';

export const MISSIONS: readonly MissionDefinition[] = [
  {
    id: 'selection-trace',
    order: 1,
    title: '선택의 흔적',
    activity: '같은 주제 카드를 세 번 고른 뒤 다음 목록 예측',
    coreQuestion: '반복 선택이 어떤 자료로 남았는가',
    completionRule: 'three-same-topic-selections',
  },
  {
    id: 'narrowed-window',
    order: 2,
    title: '좁아진 창',
    activity: '초기 목록과 변화한 목록의 주제 수 비교',
    coreQuestion: '관련성과 다양성이 어떻게 달라졌는가',
    completionRule: 'correct-distribution-reading',
  },
  {
    id: 'exploration',
    order: 3,
    title: '탐색 버튼',
    activity: '낯선 주제 카드 한 장을 의도적으로 열기',
    coreQuestion: '한 번의 탐색이 이후 구성에 미치는 영향',
    completionRule: 'one-non-focus-exploration',
  },
  {
    id: 'balance-adjustment',
    order: 4,
    title: '균형 조정',
    activity: '다양성·관심 기록 설정을 바꾸어 세 목록 비교',
    coreQuestion: '목적마다 어떤 절충이 적절한가',
    completionRule: 'three-distinct-snapshots',
  },
  {
    id: 'model-audit',
    order: 5,
    title: '모델 감사',
    activity: '같은 선택인데 공급 목록이 다를 때 결과 비교',
    coreQuestion: '사용자 선택 외 어떤 조건이 영향을 주는가',
    completionRule: 'supply-factor-identified',
  },
];
