#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function run(url, out) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  // allow more time for the app to start and fall back to 'load' when networkidle times out
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
  } catch (e) {
    // fallback: wait for load with longer timeout
    await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  }
  await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.6.3/axe.min.js' });
  const result = await page.evaluate(async () => {
    // axe should be available globally after addScriptTag
    // run basic WCAG 2.1/2.0 checks
    // eslint-disable-next-line no-undef
    return await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
  });
  await browser.close();
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(result, null, 2));
  console.log('Axe results saved to', out);
}

const url = process.argv[2] || 'http://localhost:3000/charities';
const out = process.argv[3] || 'playwright-report/axe-charities.json';
run(url, out).catch((e) => {
  console.error(e);
  process.exit(1);
});
