import { test, expect } from '@playwright/test';

test.describe('Wallet login / Profile E2E (scaffold)', () => {
  test('scaffold: homepage loads and login CTA visible', async ({ page }) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000';
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

    // Wait for a stable layout marker; title can be empty during hydration in some setups.
    await expect(page.locator('#content')).toBeVisible();

    // Look for a visible sign-in entry (desktop or mobile).
    const visibleLoginLink = page.locator('a[href="/login"]:visible');
    if (await visibleLoginLink.count()) {
      await expect(visibleLoginLink.first()).toBeVisible();
      return;
    }

    // If the login link exists but is hidden (responsive nav), open the mobile menu.
    const toggle = page.getByRole('button', { name: /toggle menu/i });
    if (await toggle.isVisible()) {
      await toggle.click();
      await expect(page.locator('a[href="/login"]:visible').first()).toBeVisible({ timeout: 15000 });
      return;
    }

    // Fallback: check for any visible "Sign in" text.
    await expect(page.getByText(/sign in/i).first()).toBeVisible({ timeout: 15000 });
  });

  // NOTE: full wallet flows require a browser extension, mobile wallet in-app browser,
  // or a mocked/instrumented provider. This suite is a scaffold.
});
