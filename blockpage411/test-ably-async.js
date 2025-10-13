(async () => {
  try {
    const { Rest } = await import('ably');
    const rest = new Rest({ key: process.env.ABLY_API_KEY, throwErrorOnFailedAuth: true });
    // Try a promise-based approach
    const tokenReq = await new Promise((resolve, reject) => {
      rest.auth.createTokenRequest({ ttl: 60 * 1000 }, (err, token) => {
        if (err) return reject(err);
        resolve(token);
      });
    });
    console.log('TokenRequest OK:', tokenReq?.keyName ?? '<no keyName>');
    console.log(JSON.stringify(tokenReq));
    process.exit(0);
  } catch (err) {
    console.error('test-ably-async error:', err);
    if (err && err.code) console.error('code=', err.code, 'statusCode=', err.statusCode);
    process.exit(2);
  }
})();
