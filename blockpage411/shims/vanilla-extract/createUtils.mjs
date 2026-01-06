// Pure ESM shim for '@vanilla-extract/sprinkles/createUtils'.
// We don't need the real implementation for this app; we just need
// the named exports to exist so that Next.js can bundle dependencies
// that reference this helper.

export function createMapValueFn() {
  return (value) => value;
}

export function createNormalizeValueFn() {
  return (value) => value;
}

const defaultExport = {
  createMapValueFn,
  createNormalizeValueFn,
};

export default defaultExport;
