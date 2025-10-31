const axios = require('axios');
(async()=>{
  try{
    const res = await axios.get('http://localhost:3000/api/wallet/ethereum/0x0000000000000000000000000000000000000001');
    console.log('status', res.status);
    console.log(JSON.stringify(res.data, null, 2));
  }catch(e){
    console.error('request failed', e.message);
    if (e.response) console.error('status', e.response.status, e.response.data);
    process.exit(1);
  }
})();
