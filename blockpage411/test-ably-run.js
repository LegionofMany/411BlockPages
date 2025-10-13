(async () => {
  const key = process.env.ABLY_API_KEY;
  if (!key) { console.error('no key'); process.exit(1); }
  try {
    const { Rest } = await import('ably');
    const rest = new Rest({ key });
    rest.auth.createTokenRequest({ ttl: 60 * 1000 }, { key }, (err, tr) => {
      if (err) { console.error('createTokenRequest err', err); process.exit(2); }
      console.log('createTokenRequest ok', tr?.keyName ?? '<no keyName>');
      console.log(JSON.stringify(tr));
      process.exit(0);
    });
  } catch (e) {
    console.error('run error', e);
    process.exit(3);
  }
})();
