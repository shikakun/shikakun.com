import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('アクセシビリティ', () => {
  test('トップページに違反がない', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('ページ（/hello）に違反がない', async ({ page }) => {
    await page.goto('/hello');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
