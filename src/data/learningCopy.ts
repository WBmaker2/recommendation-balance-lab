import type { CurriculumLink, LearningPurpose } from '../domain/types';

export const CURRICULUM_LINKS: readonly CurriculumLink[] = [
  {
    code: '6실05-05',
    description: '인공지능이 만들어지는 과정을 체험하고 사회에 미치는 영향을 탐색합니다.',
  },
  {
    code: '6실05-04',
    description: '데이터의 유형과 형태, 인공지능 활용 데이터를 탐색합니다.',
  },
  {
    code: 'digital-citizenship',
    description: '책임 있는 선택과 다양한 관점 존중을 실천하는 디지털 시민성을 기릅니다.',
  },
];

export const LEARNING_GOALS = [
  '추천이 미리 정한 규칙과 관찰된 선택 자료를 이용할 수 있음을 설명합니다.',
  '반복 선택 뒤 주제 비율 변화를 읽습니다.',
  '관련성 증가와 다양성 감소가 동시에 나타나는 경우를 비교합니다.',
  '목적에 맞는 균형 조정안을 만들고 모형의 한계를 밝힙니다.',
] as const;

export const FEEDBACK_LOOP_COPY =
  '선택과 추천 분포 사이의 피드백 고리를 살펴봅니다. 선택 기록뿐 아니라 다양성 설정과 콘텐츠 공급 조건도 결과에 영향을 줍니다.';

export const PRIVACY_NOTICE =
  '실제 취향, 검색 기록, 계정 정보와 같은 개인정보를 수집하거나 전송하지 않습니다. 선택 기록은 이 탭 안에서만 유지됩니다.';

export const MODEL_WARNING = '가상의 단순 규칙이며 실제 서비스 추천을 판정하지 않습니다';

export const RANDOMNESS_NOTICE =
  '이 모형은 무작위성을 쓰지 않지만 실제 시스템에는 더 많은 자료와 무작위 조건이 함께 작용할 수 있습니다';

export const UNCOMFORTABLE_CONTENT_GUIDANCE =
  '불편한 실제 콘텐츠를 만났을 때는 보호자·교사와 플랫폼의 공식 도움 기능을 이용하세요.';

export const NON_GOALS = [
  '실제 추천 플랫폼의 동작이나 성능을 재현하지 않습니다.',
  '사용 습관이나 중독 여부를 진단하지 않습니다.',
  '실제 사용자 기록·쿠키·계정 정보를 수집하거나 온라인으로 공유하지 않습니다.',
] as const;

export const PURPOSE_LABELS: Record<LearningPurpose, string> = {
  discover: '새로운 주제를 찾기',
  deepen: '이미 아는 주제를 깊게 보기',
};
