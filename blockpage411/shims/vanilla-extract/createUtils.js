const path = require('path');

// Try to require the library's CJS build directly from node_modules to avoid alias loops
let mod;
try {
  const modPath = path.join(__dirname, '..', '..', 'node_modules', '@vanilla-extract', 'sprinkles', 'createUtils', 'dist', 'vanilla-extract-sprinkles-createUtils.cjs.js');
  mod = require(modPath);
} catch (e) {
  // Fallback: require by package name (may work if package exposes CJS entry)
  try {
    mod = require('@vanilla-extract/sprinkles/createUtils');
  } catch (err) {
    // last resort: empty placeholders to avoid build crash; real functionality may not be needed at build time
    mod = {};
  }
}

const createMapValueFn = mod.createMapValueFn || (mod.default && mod.default.createMapValueFn) || function () { throw new Error('createMapValueFn not available'); };
const createNormalizeValueFn = mod.createNormalizeValueFn || (mod.default && mod.default.createNormalizeValueFn) || function () { throw new Error('createNormalizeValueFn not available'); };

module.exports = {
  createMapValueFn,
  createNormalizeValueFn,
  // include rest of exports if present
  ...mod,
};
