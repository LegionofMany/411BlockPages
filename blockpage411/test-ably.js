(async () => {
  const key = process.env.ABLY_API_KEY;
  if (!key) { console.error('ABLY_API_KEY not set'); process.exit(1); }
  try {
    const { Rest } = await import('ably');
    const rest = new Rest({ key });
    rest.auth.createTokenRequest({ ttl: 60 * 1000 }, (err, tokenReq) => {
      if (err) {
        console.error('Ably token request failed:', err);
        process.exit(2);
      }
      console.log('Ably tokenRequest OK:', tokenReq?.keyName ?? '<no keyName>');
      console.log('tokenRequest raw:', JSON.stringify(tokenReq));
      process.exit(0);
    });
  } catch (e) {
    console.error('Ably test error:', e);
    process.exit(3);
  }
})();
