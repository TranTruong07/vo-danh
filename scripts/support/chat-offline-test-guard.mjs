// Preloaded in offline tests/build only. Production transport is unchanged.
globalThis.fetch = async () => { throw new Error('Network disabled for Phase 5C.3B offline verification'); };
