#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const EXTS = ['.js', '.ts', '.json', '.env', '.env.local', '.env.example', '.pem', '.yml', '.yaml', '.md'];

const patterns = [
  { name: 'Private Key PEM', re: /-----BEGIN (RSA |EC |)PRIVATE KEY-----/i },
  { name: 'Google API Key (AIza)', re: /AIza[0-9A-Za-z\-_]{35}/g },
  { name: 'AWS Access Key ID', re: /AKIA[0-9A-Z]{16}/g },
  { name: 'AWS Secret', re: /(?<![A-Z0-9])[A-Za-z0-9\/+=]{40}(?![A-Z0-9])/g },
  { name: 'Stripe secret', re: /sk_live_[0-9a-zA-Z]{24,}/g },
  { name: 'Sentry DSN', re: /https?:\/\/[^\s@]+@[A-Za-z0-9\.-]+\/\d+/g },
  { name: 'Hex 64', re: /\b0x[a-fA-F0-9]{64}\b/g },
  { name: 'Mnemonic', re: /\b([a-z]+\s){11,}[a-z]+\b/gi },
  { name: 'Private key hex', re: /\b[0-9a-fA-F]{64}\b/g },
];

function walk(dir){
  const res = [];
  for (const name of fs.readdirSync(dir)){
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()){
      if (name === 'node_modules' || name === '.git' || name === '.next') continue;
      res.push(...walk(full));
    } else {
      const ext = path.extname(name);
      if (EXTS.includes(ext) || EXTS.includes(name)) res.push(full);
    }
  }
  return res;
}

function scan(){
  const files = walk(ROOT);
  const findings = [];
  for (const f of files){
    try{
      const content = fs.readFileSync(f, 'utf8');
      for (const p of patterns){
        const m = content.match(p.re);
        if (m) findings.push({ file: path.relative(ROOT, f), pattern: p.name, matches: Array.from(new Set(m)).slice(0,5) });
      }
    }catch(e){/* ignore */}
  }
  if (findings.length){
    console.error('Potential secrets found:');
    for (const f of findings){
      console.error(`- ${f.file}  => ${f.pattern}  matches: ${f.matches.join(', ')}`);
    }
    console.error('\nIf these are real secrets, rotate them immediately and remove them from git history. See DEPLOY.md for guidance.');
    process.exit(2);
  }
  console.log('No obvious secrets found. This is a heuristic scan — review manually for false positives/negatives.');
}

if (require.main === module) scan();
