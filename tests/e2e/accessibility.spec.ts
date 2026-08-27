import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { completeExperiment, continueToAudit, continueToBalance, continueToReport, reachComparison, watchPageErrors } from './helpers/completeExperiment';

async function expectA11y(page: Page): Promise<void> {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(result.violations).toEqual([]);
}

test('passes axe at intro, comparison, balance, audit, and report stages', async ({ page }) => {
  await page.goto('/');
  await expectA11y(page);
  await reachComparison(page);
  await expectA11y(page);
  await continueToBalance(page);
  await expectA11y(page);
  await continueToAudit(page);
  await expectA11y(page);
  await continueToReport(page);
  await expectA11y(page);
});

test('keyboard-only flow reaches completion and both dialogs close with Escape', async ({ page }) => {
  const errors = watchPageErrors(page);
  await page.goto('/');
  const updateTrigger = page.getByRole('button', { name: '업데이트 내역' });
  await updateTrigger.focus();
  await updateTrigger.press('Enter');
  await expect(page.getByRole('dialog', { name: '업데이트 내역' })).toBeVisible();
  await page.getByRole('dialog', { name: '업데이트 내역' }).press('Escape');
  await expect(page.getByRole('dialog', { name: '업데이트 내역' })).toBeHidden();

  await page.getByRole('button', { name: '실험 시작' }).click();
  const reasonTrigger = page.getByRole('article', { name: /추천 카드/ }).first().getByRole('button', { name: '왜 이 카드가 나왔나요?' });
  await reasonTrigger.press('Enter');
  const reasonDialog = page.getByRole('dialog', { name: '추천 이유' });
  await expect(reasonDialog).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(reasonDialog.getByRole('button', { name: '닫기' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(reasonDialog).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(reasonDialog).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(reasonDialog).toBeHidden();
  await expect(reasonTrigger).toBeFocused();

  await page.reload();
  await completeExperiment(page, { useKeyboard: true });
  await expect(page.getByRole('heading', { name: '실험 완료' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('reduced motion keeps the static evidence branch without an animated transition', async ({ page }) => {
  const errors = watchPageErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: '실험 시작' }).click();
  await page.getByRole('article', { name: /추천 카드/ }).first().getByRole('button', { name: '이 카드 선택' }).click();
  await expect(page.getByText('지금 할 차례').first()).toBeVisible();
  await expect(page.locator('.feed-transition')).toHaveCount(0);
  await expect(page.getByRole('table', { name: '추천 주제 분포 전후 비교' }).first()).toBeVisible();
  expect(errors).toEqual([]);
});
