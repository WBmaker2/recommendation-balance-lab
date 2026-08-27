import { expect, type Locator, type Page } from '@playwright/test';

export interface CompleteExperimentOptions {
  useKeyboard?: boolean;
}

type FlowOptions = CompleteExperimentOptions;

export function watchPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error: ${message.text()}`);
  });
  return errors;
}

async function activate(locator: Locator, keyboard: boolean): Promise<void> {
  if (keyboard) {
    await locator.focus();
    await locator.press('Enter');
  } else {
    await locator.click();
  }
}

async function choose(locator: Locator, keyboard: boolean): Promise<void> {
  if (keyboard) {
    await locator.focus();
    await locator.press('Space');
  } else {
    await locator.click();
  }
}

async function inspectReasons(page: Page, keyboard: boolean): Promise<void> {
  const reasons = page.getByRole('button', { name: '왜 이 카드가 나왔나요?' });
  await expect(reasons).toHaveCount(8);
  for (let index = 0; index < 8; index += 1) {
    await activate(reasons.nth(index), keyboard);
    const dialog = page.getByRole('dialog', { name: '추천 이유' });
    await expect(dialog).toBeVisible();
    await activate(dialog.getByRole('button', { name: '닫기' }), keyboard);
    await expect(dialog).toBeHidden();
  }
}

async function chooseCard(page: Page, keyboard: boolean): Promise<void> {
  const firstCard = page.getByRole('article', { name: /추천 카드/ }).first();
  await activate(firstCard.getByRole('button', { name: '이 카드 선택' }), keyboard);
}

async function setDiversity(page: Page, value: number, keyboard: boolean): Promise<void> {
  const slider = page.getByRole('slider', { name: '다양성 토큰 설정' });
  if (!keyboard) {
    await slider.fill(String(value));
    return;
  }
  await slider.focus();
  await slider.press('Home');
  for (let index = 0; index < value; index += 1) await slider.press('ArrowRight');
}

export async function reachComparison(page: Page, options: FlowOptions = {}): Promise<void> {
  const keyboard = options.useKeyboard ?? false;
  await activate(page.getByRole('button', { name: '실험 시작' }), keyboard);
  for (let index = 0; index < 3; index += 1) {
    await inspectReasons(page, keyboard);
    await chooseCard(page, keyboard);
  }
  await choose(page.getByRole('radio', { name: '늘어난다' }).nth(0), keyboard);
  await choose(page.getByRole('radio', { name: '줄어든다' }).nth(1), keyboard);
  await activate(page.getByRole('button', { name: '다음 목록 예측' }), keyboard);
  await choose(page.getByRole('radio', { name: '늘었다' }).nth(0), keyboard);
  await choose(page.getByRole('radio', { name: '줄었다' }).nth(1), keyboard);
  await activate(page.getByRole('button', { name: '분포 문장 확인' }), keyboard);
}

export async function continueToBalance(page: Page, options: FlowOptions = {}): Promise<void> {
  const keyboard = options.useKeyboard ?? false;
  await activate(page.getByRole('button', { name: '낯선 주제 열기' }).first(), keyboard);
}

export async function reachBalance(page: Page, options: FlowOptions = {}): Promise<void> {
  await reachComparison(page, options);
  await continueToBalance(page, options);
}

export async function continueToAudit(page: Page, options: FlowOptions = {}): Promise<void> {
  const keyboard = options.useKeyboard ?? false;
  await activate(page.getByRole('button', { name: '현재 설정 저장' }), keyboard);
  await setDiversity(page, 2, keyboard);
  await activate(page.getByRole('button', { name: '현재 설정 저장' }), keyboard);
  await setDiversity(page, 1, keyboard);
  await choose(page.getByRole('radio', { name: '관심 기록 비우기' }), keyboard);
  await activate(page.getByRole('button', { name: '현재 설정 저장' }), keyboard);
  await activate(page.getByRole('button', { name: '균형 비교' }), keyboard);
}

export async function reachAudit(page: Page, options: FlowOptions = {}): Promise<void> {
  await reachBalance(page, options);
  await continueToAudit(page, options);
}

export async function continueToReport(page: Page, options: FlowOptions = {}): Promise<void> {
  const keyboard = options.useKeyboard ?? false;
  await choose(page.getByRole('radio', { name: '콘텐츠 공급' }), keyboard);
  await activate(page.getByRole('button', { name: '변화 원인 확인' }), keyboard);
}

export async function reachReport(page: Page, options: FlowOptions = {}): Promise<void> {
  await reachAudit(page, options);
  await continueToReport(page, options);
}

export async function finishReport(page: Page, options: FlowOptions = {}): Promise<void> {
  const keyboard = options.useKeyboard ?? false;
  await choose(page.getByRole('radio', { name: /포커스 주제 카드 수가 늘어납니다/ }), keyboard);
  await choose(page.getByRole('radio', { name: /나타난 주제 수가 줄어듭니다/ }), keyboard);
  for (const checkbox of await page.getByRole('checkbox').all()) await choose(checkbox, keyboard);
  await choose(page.getByRole('radio', { name: /새로운 주제를 찾기/ }), keyboard);
  await choose(page.getByRole('radio', { name: /scenario-a 설정의 실제 카드 수 사용/ }), keyboard);
  await choose(page.getByRole('radio', { name: /^포커스 주제 카드 수$/ }), keyboard);
  await choose(page.getByRole('radio', { name: /관찰한 포커스 주제 카드 수/ }), keyboard);
  await choose(page.getByRole('radio', { name: '가상의 단순 규칙' }), keyboard);
  await activate(page.getByRole('button', { name: '모델 보고서 제출' }), keyboard);
}

export async function completeExperiment(page: Page, options: CompleteExperimentOptions = {}): Promise<void> {
  await reachReport(page, options);
  await finishReport(page, options);
}
