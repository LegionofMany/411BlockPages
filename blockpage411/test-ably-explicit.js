(async () => {
  const { Rest } = await import('ably');
  const key = process.env.ABLY_API_KEY;
  if (!key) { console.error('ABLY_API_KEY not set'); process.exit(1); }
  const rest = new Rest({ key });
  try {
    const tokenReq = await new Promise((resolve, reject) => {
      rest.auth.createTokenRequest({ ttl: 60 * 1000 }, { key }, (err, tokenReq2) => {
        if (err) return reject(err);
        resolve(tokenReq2);
      });
    });
    console.log('explicit tokenRequest OK:', tokenReq?.keyName ?? '<no keyName>');
    console.log('tokenRequest raw:', JSON.stringify(tokenReq));
    process.exit(0);
  } catch (e) {
    console.error('explicit error:', e);
    if (e && e.code) console.error('code=', e.code, 'statusCode=', e.statusCode);
    process.exit(3);
  }
})();
