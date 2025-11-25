const path = require('path');

const p = path.resolve(__dirname, '..', 'node_modules', '@next', 'swc-win32-x64-msvc', 'next-swc.win32-x64-msvc.node');
console.log('Attempting to load native SWC binary at:');
console.log('  ', p);

try {
  require(p);
  console.log('\nNative SWC binary loaded successfully (no error thrown).');
} catch (err) {
  console.error('\nFailed to load native SWC binary. Error:');
  console.error(err && err.stack ? err.stack : err);
  if (err && err.code) console.error('\nError code:', err.code);
  if (err && err.errno) console.error('Errno:', err.errno);
  if (err && err.message) console.error('Message:', err.message);
  process.exit(1);
}
