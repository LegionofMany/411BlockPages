const { spawn } = require('child_process');
const path = require('path');

// Resolve Next binary inside node_modules
const nextBin = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next.js');
console.log('Starting Next dev with WATCHPACK_POLLING via:', nextBin);

const env = Object.assign({}, process.env, {
  WATCHPACK_POLLING: 'true',
  WATCHPACK_POLLING_INTERVAL: '1000',
});

const child = spawn(process.execPath, [nextBin, 'dev'], { stdio: 'inherit', env });

child.on('exit', (code) => process.exit(code));
child.on('error', (err) => {
  console.error('Failed to start Next dev:', err);
  process.exit(1);
});
