#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const dataFile = process.argv[2] || path.join(__dirname, '..', 'data', 'provider_wallets.json');
const mongo = process.env.MONGODB_URI || process.env.MONGODB_TEST_URI;
if (!mongo) {
  console.error('Please set MONGODB_URI or MONGODB_TEST_URI in env before running');
  process.exit(2);
}

function run(cmd, args, env) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', env: Object.assign({}, process.env, env || {}) });
    p.on('exit', code => code === 0 ? resolve() : reject(new Error('Exit ' + code)));
    p.on('error', reject);
  });
}

(async function(){
  try{
    console.log('Seeding providers...');
    await run('node', ['-r', 'ts-node/register', path.join('scripts','seed_providers.ts')]);
    console.log('Seeding complete. Running importer...');
    await run('node', [path.join('scripts','import_provider_wallets.js'), dataFile, '--batchSize', '1000']);
    console.log('Seed + Import completed.');
  }catch(e){
    console.error('Run failed', e);
    process.exit(1);
  }
})();
