const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const url = process.argv[2] || 'http://localhost:3000/charities';
  const out = path.resolve(process.cwd(), 'playwright-report', 'axe-charities.json');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    if (!resp || !resp.ok()) {
      console.error('Navigation failed or non-OK response', resp && resp.status());
    }

    // Inject axe-core from CDN
    await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js' });

    // Run axe
    const result = await page.evaluate(async () => {
      // eslint-disable-next-line no-undef
      return await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } });
    });

    fs.writeFileSync(out, JSON.stringify(result, null, 2));
    console.log('axe results saved to', out);
  } catch (err) {
    console.error('Error running axe scan:', err && err.message ? err.message : err);
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
})();
