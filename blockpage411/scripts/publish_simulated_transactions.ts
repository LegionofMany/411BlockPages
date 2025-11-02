const INTERVAL_MS = 3000;
const PUBLISH_URL = process.env.PUBLISH_URL || 'http://localhost:3000/api/realtime/publish';

function randomHex(len: number) {
  return '0x' + [...Array(len)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

async function publish() {
  const tx = {
    hash: randomHex(64).slice(2),
    from: randomHex(40).slice(2),
    to: randomHex(40).slice(2),
    value: Number((Math.random() * 5).toFixed(6)),
    timestamp: new Date().toISOString(),
  };
  try {
    const resp = await globalThis.fetch(PUBLISH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: 'transactions', event: 'tx', data: tx }),
    });
    console.log('Published tx', tx.hash, 'status', resp.status);
  } catch (err) {
    console.error('Publish error', err);
  }
}

console.log('Starting tx simulator, publishing to', PUBLISH_URL);
if (require.main === module && process.env.NODE_ENV !== 'test'){
  setInterval(publish, INTERVAL_MS);
  publish();
}
