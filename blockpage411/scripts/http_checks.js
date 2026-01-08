const urls = [
  { label: '/', url: 'http://localhost:3000/' },
  { label: '/login', url: 'http://localhost:3000/login' },
  { label: '/profile', url: 'http://localhost:3000/profile' },
  { label: '/realtime-transactions', url: 'http://localhost:3000/realtime-transactions' },
  { label: '/api/me', url: 'http://localhost:3000/api/me' },
  { label: '/api/auth/status', url: 'http://localhost:3000/api/auth/status' },
  { label: '/api/wallet/risk', url: 'http://localhost:3000/api/wallet/risk?chain=ethereum&address=0x000000000000000000000000000000000000dead' },
];

async function run() {
  for (const u of urls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(u.url, { signal: controller.signal, credentials: 'include' });
      clearTimeout(timeout);
      const ct = res.headers.get('content-type') || '';
      let bodyPreview = '';
      try {
        if (ct.includes('application/json')) {
          const j = await res.json();
          bodyPreview = JSON.stringify(j).slice(0, 800);
        } else {
          const t = await res.text();
          bodyPreview = t.slice(0, 800).replace(/\s+/g, ' ').trim();
        }
      } catch (e) {
        bodyPreview = `<body parse error: ${String(e)}>`;
      }
      console.log(`${u.label} -> ${res.status} ${res.statusText} | content-type=${ct}`);
      console.log(bodyPreview || '<empty>');
    } catch (e) {
      console.log(`${u.label} -> ERROR: ${String(e)}`);
    }
    console.log('---');
  }
}

run().catch((e) => { console.error('Fatal', e); process.exit(1); });
