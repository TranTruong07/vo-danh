// One-time migration. Runtime pricing is read only from MongoDB settings.
import { MongoClient } from 'mongodb';
import { readFile, writeFile } from 'node:fs/promises';
process.loadEnvFile('.env.local');
const file = await readFile('.env.local', 'utf8');
const raw = process.env.SHOP_PRODUCT_PRICE?.trim();
const normalized = raw && /^\d{1,3}(\.\d{3})+$/.test(raw) ? raw.replaceAll('.', '') : raw;
const price = Number(normalized);
const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
try {
  const settings = client.db(process.env.MONGODB_DB_NAME || undefined).collection('settings');
  const existing = await settings.findOne({ _id: 'shop' });
  if (!existing) {
    if (!Number.isSafeInteger(price) || price < 1000 || price > 100000000) throw new Error('No valid price to migrate. Set a price in admin before removing the old configuration.');
    await settings.updateOne({ _id: 'shop' }, { $setOnInsert: { productPrice: price, updatedAt: new Date() } }, { upsert: true });
  }
  const stored = await settings.findOne({ _id: 'shop' });
  if (!Number.isSafeInteger(stored?.productPrice) || stored.productPrice < 1000) throw new Error('Stored price verification failed. Environment file was not changed.');
  await writeFile('.env.local', file.replace(/^\s*(?:export\s+)?SHOP_PRODUCT_PRICE\s*=.*(?:\r?\n|$)/gm, ''), 'utf8');
  console.log(JSON.stringify({ migrated: true, productPrice: stored.productPrice, removedLegacyEnvironmentPrice: true }));
} finally { await client.close(); }
