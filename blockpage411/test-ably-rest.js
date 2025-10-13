(async () => {
  const key = process.env.ABLY_API_KEY;
  if (!key) {
    console.error('ABLY_API_KEY not set');
    process.exit(1);
  }
  try {
    const fetch = (await import('node-fetch')).default;
    const auth = Buffer.from(key).toString('base64');
    const res = await fetch('https://rest.ably.io/time', {
      headers: { Authorization: `Basic ${auth}` },
      method: 'GET'
    });
    console.log('status=', res.status);
    const t = await res.text();
    console.log('body=', t);
    process.exit(0);
  } catch (e) {
    console.error('rest fetch error:', e);
    process.exit(2);
  }
})();
