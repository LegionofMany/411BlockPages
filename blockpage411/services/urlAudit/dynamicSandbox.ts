export interface DynamicSandboxResult {
  enabled: boolean;
  skippedReason?: string;
  walletRequests: Array<{ method: string; params?: any }>;
  consoleMessages: Array<{ type: string; text: string }>;
  network: Array<{ url: string; method: string; status?: number }>; // sampled
  clicked: string[];
}

export async function runDynamicSandbox(url: string): Promise<DynamicSandboxResult> {
  if (process.env.ENABLE_URL_AUDIT_DYNAMIC !== 'true') {
    return { enabled: false, skippedReason: 'dynamic_disabled', walletRequests: [], consoleMessages: [], network: [], clicked: [] };
  }

  // Vercel serverless is not a safe/consistent place to run browsers.
  if (process.env.VERCEL) {
    return { enabled: false, skippedReason: 'vercel_runtime', walletRequests: [], consoleMessages: [], network: [], clicked: [] };
  }

  let playwright: any;
  try {
    playwright = await import('playwright');
  } catch {
    return { enabled: false, skippedReason: 'playwright_not_available', walletRequests: [], consoleMessages: [], network: [], clicked: [] };
  }

  const { chromium } = playwright;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const walletRequests: DynamicSandboxResult['walletRequests'] = [];
  const consoleMessages: DynamicSandboxResult['consoleMessages'] = [];
  const network: DynamicSandboxResult['network'] = [];
  const clicked: string[] = [];

  try {
    // Inject a stub ethereum provider to log attempted calls.
    await context.addInitScript(() => {
      (window as any).__bp411_walletRequests = [];
      (window as any).ethereum = {
        isMetaMask: false,
        request: async (args: any) => {
          try { (window as any).__bp411_walletRequests.push(args); } catch {}
          throw new Error('Blocked: no wallet in sandbox');
        },
      };
    });

    const page = await context.newPage();

    page.on('console', (msg: any) => {
      try {
        const text = String(msg.text() || '').slice(0, 500);
        consoleMessages.push({ type: String(msg.type()), text });
      } catch {}
    });

    page.on('request', (req: any) => {
      try {
        if (network.length >= 80) return;
        network.push({ url: String(req.url()).slice(0, 500), method: String(req.method()) });
      } catch {}
    });

    page.on('response', async (resp: any) => {
      try {
        if (network.length >= 120) return;
        network.push({ url: String(resp.url()).slice(0, 500), method: 'RESP', status: Number(resp.status()) });
      } catch {}
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12_000 });

    // Click a few CTA-like elements.
    const selectors = [
      'text=/connect\s+wallet/i',
      'text=/claim/i',
      'text=/airdrop/i',
      'text=/reward/i',
      'button:has-text("Connect")',
      'button:has-text("Claim")',
    ];

    for (const sel of selectors) {
      if (clicked.length >= 4) break;
      try {
        const loc = page.locator(sel).first();
        const count = await loc.count();
        if (!count) continue;
        await loc.click({ timeout: 1500 });
        clicked.push(sel);
        await page.waitForTimeout(1500);
      } catch {
        // ignore
      }
    }

    await page.waitForTimeout(2500);

    try {
      const logged = await page.evaluate(() => (window as any).__bp411_walletRequests || []);
      if (Array.isArray(logged)) {
        for (const r of logged.slice(0, 25)) {
          if (r && typeof r.method === 'string') walletRequests.push({ method: r.method, params: r.params });
        }
      }
    } catch {
      // ignore
    }

    return { enabled: true, walletRequests, consoleMessages, network, clicked };
  } finally {
    try { await context.close(); } catch {}
    try { await browser.close(); } catch {}
  }
}
