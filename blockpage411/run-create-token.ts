import { createAblyTokenRequest } from './lib/ably';

(async () => {
  try {
    const token = await createAblyTokenRequest(60);
    console.log(JSON.stringify(token, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('ERROR', e);
    process.exit(1);
  }
})();
