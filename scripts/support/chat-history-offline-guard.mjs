import { MongoClient } from 'mongodb';
// Only preloaded by the Phase 5D verification harness, never by the application.
globalThis.fetch = async () => { throw new Error('Network disabled for Phase 5D offline verification'); };
MongoClient.prototype.connect = async function () { throw new Error('Mongo connection disabled for Phase 5D offline verification'); };
