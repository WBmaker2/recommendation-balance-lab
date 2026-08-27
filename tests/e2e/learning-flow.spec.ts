import { expect, test } from '@playwright/test';
import { completeExperiment, watchPageErrors } from './helpers/completeExperiment';

test('completes the five-mission learner flow and reloads as a fresh experiment', async ({ page }) => {
  const errors = watchPageErrors(page);
  await page.goto('/');
  await completeExperiment(page);
  await expect(page.getByRole('heading', { name: '실험 완료' })).toBeVisible();
  await expect(page.getByRole('region', { name: '실험 완료' }).getByText('가상의 단순 규칙이며 실제 서비스 추천을 판정하지 않습니다', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);

  await page.reload();
  await expect(page.getByRole('button', { name: '실험 시작' })).toBeVisible();
  await expect(page.getByText(/관심 토큰 [1-9]/)).toHaveCount(0);
});
