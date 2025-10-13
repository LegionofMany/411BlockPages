(async () => {
  try {
    const { createAblyTokenRequest } = await import('./lib/ably.js');
    const tokenReq = await createAblyTokenRequest(60);
    console.log('library tokenRequest ok', tokenReq?.keyName ?? '<no keyName>');
    console.log(JSON.stringify(tokenReq));
    process.exit(0);
  } catch (e) {
    console.error('library error', e);
    process.exit(2);
  }
})();
