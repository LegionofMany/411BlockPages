import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: { timeout: 15000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    actionTimeout: 5000,
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000',
  },
  webServer: {
    command: 'npm run dev -- -H 127.0.0.1 -p 3000',
    url: 'http://127.0.0.1:3000',
    timeout: 240000,
    reuseExistingServer: true,
  },
});
