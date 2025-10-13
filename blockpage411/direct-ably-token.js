(async () => {
  const key = process.env.ABLY_API_KEY;
  if (!key) { console.error('ABLY_API_KEY not set'); process.exit(1); }
  try {
    const { Rest } = await import('ably');
    const rest = new Rest({ key });
    rest.auth.createTokenRequest({ ttl: 60 * 1000 }, { key }, (err, tokenReq) => {
      if (err) { console.error('Ably token err', err); process.exit(2); }
      console.log(JSON.stringify(tokenReq, null, 2));
      process.exit(0);
    });
  } catch (e) {
    console.error('direct error', e);
    process.exit(3);
  }
})();
