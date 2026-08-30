import { expect, test } from '@playwright/test';
import { continueToAudit, continueToBalance, continueToExploration, continueToReport, enterComparison, finishReport, reachChoice, watchPageErrors } from './helpers/completeExperiment';

test.use({ viewport: { width: 375, height: 812 } });

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page): Promise<void> {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow, '375px viewport must not overflow horizontally').toBe(false);
}

test('keeps every learner stage usable at 375 by 812 without horizontal overflow', async ({ page }) => {
  const errors = watchPageErrors(page);
  await page.goto('/');
  await expectNoHorizontalOverflow(page);
  const introCta = page.getByRole('button', { name: '실험 시작' });
  await expect(introCta).toBeInViewport();
  await reachChoice(page);
  await expectNoHorizontalOverflow(page);
  const feedColumns = await page.locator('[data-feed-layout="fixed-eight"]').evaluate((element) => (
    getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length
  ));
  expect(feedColumns, '375px feed must use two compact columns').toBe(2);
  await enterComparison(page);
  await expectNoHorizontalOverflow(page);
  await continueToExploration(page);
  await expectNoHorizontalOverflow(page);
  await continueToBalance(page);
  await expectNoHorizontalOverflow(page);
  await continueToAudit(page);
  await expectNoHorizontalOverflow(page);
  await continueToReport(page);
  await expectNoHorizontalOverflow(page);
  await finishReport(page);
  await expect(page.getByRole('heading', { name: '실험 완료' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});
