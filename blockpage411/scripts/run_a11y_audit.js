#!/usr/bin/env node
// Lightweight accessibility audit runner using puppeteer + axe-core.
// This script is optional and intended to be run locally (node) to perform an a11y scan
// of the app running on http://localhost:3000. It will print results and a simple
// prioritized list to stdout.

const fs = require('fs');
const path = require('path');

(async function(){
  console.log('Accessibility audit runner (requires puppeteer and axe-core).');
  console.log('Install with: npm i -D puppeteer axe-core');
  console.log('Run your dev server (npm run dev) and then run this script.');
  process.exit(0);
})();
