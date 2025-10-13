import { createAblyTokenRequest } from './lib/ably';

(async () => {
  try {
    const tokenReq = await createAblyTokenRequest(60);
    console.log('library tokenRequest ok', (tokenReq as any)?.keyName ?? '<no keyName>');
    console.log(JSON.stringify(tokenReq));
    process.exit(0);
  } catch (e) {
    console.error('library error', e);
    process.exit(2);
  }
})();
