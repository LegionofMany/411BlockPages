// Quick JS smoke test for Giving Block sandbox (uses node fetch and dotenv)
(async () => {
  try {
    const base = (process.env.GIVINGBLOCK_BASE_URL || 'https://public-api.sandbox.thegivingblock.com').replace(/\/$/, '');
    const orgsUrl = `${base}/v1/organizations`;
    const charitiesUrl = `${base}/v1/charities`;

    // Try organizations endpoint first, then charities if organizations is not allowed
    const tryUrls = [orgsUrl, charitiesUrl];
    const headers = { Accept: 'application/json' };
    if (process.env.GIVINGBLOCK_API_KEY) {
      headers.Authorization = `Bearer ${process.env.GIVINGBLOCK_API_KEY}`;
    } else if (process.env.GIVINGBLOCK_USERNAME && process.env.GIVINGBLOCK_PASSWORD) {
      const creds = `${process.env.GIVINGBLOCK_USERNAME}:${process.env.GIVINGBLOCK_PASSWORD}`;
      headers.Authorization = `Basic ${Buffer.from(creds).toString('base64')}`;
    }

    for (const url of tryUrls) {
      console.log('Calling Giving Block URL:', url);
      const res = await fetch(url, { headers });
      console.log('HTTP', res.status, res.statusText);
      const text = await res.text();
      if (res.ok) {
        try {
          const js = JSON.parse(text);
          const arr = Array.isArray(js) ? js : (js && js.data && Array.isArray(js.data) ? js.data : []);
          console.log('SAMPLE (up to 10):', JSON.stringify(arr.slice(0, 10), null, 2));
          console.log('TOTAL:', arr.length);
          process.exit(0);
        } catch (e) {
          console.log('Response body (non-JSON):', text.substring(0, 2000));
          process.exit(0);
        }
      } else {
        console.log('Non-OK response for', url, 'continuing to next URL if any');
      }
    }

    // If we get here, none of the endpoints returned OK; print last body
    console.log('No OK response received from tested endpoints.');
    process.exit(3);
    
    process.exit(0);
  } catch (err) {
    console.error('Error calling Giving Block:', err && err.message ? err.message : err);
    process.exit(2);
  }
})();
