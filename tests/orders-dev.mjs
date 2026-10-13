// Isolated local test server: test pricing and fake payOS credentials never modify .env.local.
import next from 'next';
import { createServer } from 'node:http';
import { MongoClient } from 'mongodb';
process.loadEnvFile('.env.local');
const fixtureDbName = (process.env.MONGODB_DB_NAME || 'vo_danh') + '_orders_test';
process.env.MONGODB_DB_NAME = fixtureDbName;
const fixtureClient = new MongoClient(process.env.MONGODB_URI);
try { await fixtureClient.db(fixtureDbName).collection('settings').updateOne({ _id: 'shop' }, { $set: { productPrice: 349000, updatedAt: new Date() } }, { upsert: true }); }
finally { await fixtureClient.close(); }
process.env.PAYOS_CLIENT_ID = 'orders-test-only';
process.env.PAYOS_API_KEY = 'orders-test-only';
process.env.PAYOS_CHECKSUM_KEY = 'orders-test-only';
// No real payment provider calls during browser testing.
process.env.PAYOS_BASE_URL = 'http://127.0.0.1:3099';
process.env.APP_URL = 'http://localhost:3012';
const app = next({ dev: true, hostname: 'localhost', port: 3012, conf: {
  distDir: '.next-orders-test',
  experimental: { serverActions: { bodySizeLimit: '7mb' } },
} });
await app.prepare();
createServer(app.getRequestHandler()).listen(3012, () => console.log('Orders test app ready on http://localhost:3012'));
