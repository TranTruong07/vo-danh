import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loader } from './support/load-typescript.mjs';

test('settings reject malformed/out-of-range prices and require admin before reads, writes and payment checks', async () => {
  const { parseProductPrice } = loader()('@/server/domain/settings');
  assert.equal(parseProductPrice('599000'), 599000);
  for (const value of ['', null, '599.000', '1e6', '-1', '999', '100000001', '1.1']) assert.throws(() => parseProductPrice(value));
  let writes = 0, reads = 0, probes = 0, authorized = false;
  const settings = loader({
    './admin-auth': { requireAdmin: async () => { if (!authorized) throw new Error('Unauthorized'); } },
    '@/server/repositories/settings': { readShopSettings: async () => { reads++; return null; }, writeProductPrice: async price => { writes++; return { productPrice: price }; }, paymentProbeOrderCode: async () => { reads++; return 123; } },
    '@/server/infrastructure/payos': { paymentConfiguration: () => ({}), probePayosConnection: async () => { probes++; } },
  })('@/server/services/settings');
  const form = new FormData(); form.set('productPrice', '599000');
  await assert.rejects(settings.adminSettings(), /Unauthorized/);
  await assert.rejects(settings.saveShopSettings(form), /Unauthorized/);
  await assert.rejects(settings.checkPaymentConnection(), /Unauthorized/);
  assert.equal(writes + reads + probes, 0);
  authorized = true;
  assert.equal((await settings.saveShopSettings(form)).productPrice, 599000);
  form.set('productPrice', '599.000'); await assert.rejects(settings.saveShopSettings(form));
  assert.equal(writes, 1);
});

test('new orders use the current database price while existing order snapshots stay unchanged', async () => {
  let price = 599000, saved = null;
  const catalog = loader({ '@/server/repositories/settings': { readShopSettings: async () => ({ productPrice: price }) } })('@/server/services/catalog');
  const orders = loader({
    './account-session': { currentAccount: async () => ({ userId: 'customer', email: 'customer@example.com' }) },
    './catalog': catalog,
    '@/server/repositories/orders': { findOrderByRequest: async () => saved, insertOrder: async data => { saved = data; return data; }, orderView: data => data },
  })('@/server/services/orders');
  const form = new FormData();
  for (const [key, value] of Object.entries({ name: 'Khách hàng', phone: '0912345678', address: '12 Nguyễn Huệ, Hà Nội', quantity: '2', paymentMethod: 'cod', requestKey: crypto.randomUUID(), unitPrice: '1' })) form.set(key, value);
  form.set('quotedPrice', '599000');
  const original = await orders.placeOrder(form); assert.equal(original.total, 1198000);
  price = 699000;
  assert.equal((await orders.placeOrder(form)).total, 1198000);
  saved = null; form.set('requestKey', crypto.randomUUID());
  await assert.rejects(orders.placeOrder(form), /Giá bán vừa được cập nhật/);
  assert.equal(saved, null);
  form.set('quotedPrice', '699000');
  assert.equal((await orders.placeOrder(form)).total, 1398000);
  price = null; assert.equal((await catalog.shopProduct()).ready, false);
});

test('payment diagnostics are read-only and distinguish missing config, API reachability, signed responses and errors', async () => {
  const keys = ['PAYOS_CLIENT_ID', 'PAYOS_API_KEY', 'PAYOS_CHECKSUM_KEY'];
  const previous = keys.map(key => process.env[key]);
  let behavior = 'not-found', calls = 0;
  class FakePayOS {
    paymentRequests = { get: async () => { calls++; if (behavior === 'not-found') throw { code: '101' }; if (behavior === 'error') throw new Error('invalid signature'); return { id: 'verified' }; } };
  }
  try {
    keys.forEach(key => { delete process.env[key]; });
    const payos = loader({ '@payos/node': { PayOS: FakePayOS } })('@/server/infrastructure/payos');
    assert.equal((await payos.probePayosConnection()).state, 'missing'); assert.equal(calls, 0);
    keys.forEach(key => { process.env[key] = 'secret-test-value'; });
    assert.equal((await payos.probePayosConnection()).state, 'reachable');
    behavior = 'verified'; assert.equal((await payos.probePayosConnection(123)).state, 'verified');
    behavior = 'error'; assert.equal((await payos.probePayosConnection()).state, 'error');
    assert.equal(JSON.stringify(payos.paymentConfiguration()).includes('secret-test-value'), false);
  } finally { keys.forEach((key, i) => { if (previous[i] === undefined) delete process.env[key]; else process.env[key] = previous[i]; }); }
});
