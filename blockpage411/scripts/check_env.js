const fs = require('fs');
const path = require('path');

function human(n){
  if (!n && n !== 0) return 'missing';
  if (n < 1024) return n + ' B';
  if (n < 1024*1024) return (n/1024).toFixed(1) + ' KB';
  return (n/(1024*1024)).toFixed(2) + ' MB';
}

console.log('Node version:', process.version);
console.log('Node arch   :', process.arch);

const swcPath = path.join(__dirname, '..', 'node_modules', '@next', 'swc-win32-x64-msvc', 'next-swc.win32-x64-msvc.node');
console.log('\nChecking expected SWC native binary at:');
console.log('  ', swcPath);

try{
  const stat = fs.statSync(swcPath);
  console.log('Found file size:', human(stat.size));
  // read first bytes as binary and inspect for HTML start
  const fd = fs.openSync(swcPath, 'r');
  const buf = Buffer.alloc(200);
  fs.readSync(fd, buf, 0, 200, 0);
  fs.closeSync(fd);
  const sample = buf.toString('utf8').slice(0,200);
  if (/^\s*</.test(sample)) {
    console.log('Warning: file looks like HTML/text (corrupted download or proxy).');
  } else {
    console.log('Binary file appears non-text (expected).');
  }
}catch(err){
  console.log('SWC native binary not present or inaccessible:', String(err.message || err));
}

console.log('\nQuick recommendations:');
console.log('- If `process.arch` is not `x64`, install 64-bit Node (LTS x64) from https://nodejs.org and retry.');
console.log('- If SWC file is missing or tiny/HTML: run `npm cache clean --force` then remove `node_modules` and `package-lock.json`, and run `npm install` again.');
console.log('- You can run the dev server with polling (Windows): `npm run dev:poll` (uses cross-env).');

process.exit(0);
