// @ts-nocheck
// Quick script to validate Giving Block access using project utils
const m = require('../utils/givingblock');
const fetchGivingBlockCharities = m.fetchGivingBlockCharities || m.default?.fetchGivingBlockCharities;

(async () => {
  try {
    const list = await fetchGivingBlockCharities();
    const arr = Array.isArray(list) ? list : [];
    console.log('SAMPLE (up to 10):', JSON.stringify(arr.slice(0, 10), null, 2));
    console.log('TOTAL COUNT:', arr.length);
    process.exit(0);
  } catch (e) {
    console.error('ERROR fetching Giving Block orgs:', e && e.message ? e.message : e);
    process.exit(2);
  }
})();
