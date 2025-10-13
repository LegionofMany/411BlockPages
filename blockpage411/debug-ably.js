(async () => {
  const key = process.env.ABLY_API_KEY;
  console.log('DOTENV_CONFIG_PATH=', process.env.DOTENV_CONFIG_PATH);
  if (key === undefined) { console.error('ABLY_API_KEY is undefined'); process.exit(1); }
  if (key === '') { console.error('ABLY_API_KEY is empty string'); process.exit(2); }
  console.log('ABLY_API_KEY length =', key.length);
  console.log('ABLY_API_KEY first 8 chars =', key.slice(0, 8));
  console.log('ABLY_API_KEY last 8 chars =', key.slice(-8));
  const crypto = await import('crypto');
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  console.log('ABLY_API_KEY sha256 =', hash);
  process.exit(0);
})();
