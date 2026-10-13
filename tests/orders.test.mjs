import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { randomUUID, createHmac } from 'node:crypto';
import { ObjectId } from 'mongodb';
import ts from 'typescript';
import ExcelJS from 'exceljs';
const nativeRequire = createRequire(import.meta.url);
function loader(mocks = {}) {
  const cache = new Map();
  function load(name, parent = process.cwd()) {
    if (name in mocks) return mocks[name];
    if (name === 'server-only') return {};
    if (!name.startsWith('@/') && !name.startsWith('.')) return nativeRequire(name);
    const file = (name.startsWith('@/') ? path.resolve(name.slice(2)) : path.resolve(parent, name)) + '.ts';
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
    vm.runInThisContext('(function(require,module,exports){' + code + '\n})', { filename: file })(n => load(n, path.dirname(file)), module, module.exports);
    return module.exports;
  }
  return load;
}
const form = () => {
  const data = new FormData();
  for (const [key, value] of Object.entries({ name: 'Khách kiểm thử', phone: '0912345678', address: '12 Nguyễn Huệ, Thành phố Hồ Chí Minh', quantity: '2', paymentMethod: 'cod', requestKey: randomUUID(), email: 'forged@example.com', total: '1', unitPrice: '1', userId: 'forged' })) data.set(key, value);
  data.set('quotedPrice', '349000');
  return data;
};
test('catalog reads MongoDB settings and exported amounts remain numeric in the 15-column workbook', async () => {
  const { shopProduct } = loader({ '@/server/repositories/settings': { readShopSettings: async () => ({ productPrice: 349000 }) } })('@/server/services/catalog');
  assert.deepEqual(await shopProduct(), { name: 'Board game Dấu Chân Sử Ký', price: 349000, ready: true });
  const row = { orderCode: 123, createdAt: new Date(), name: 'Khách', email: 'test@example.com', phone: '0912345678', address: 'Hà Nội', productName: 'Board game', quantity: 2, unitPrice: 349000, total: 698000, paymentMethod: 'cod', status: 'unpaid', note: '=1+1' };
  let closed = false;
  const service = loader({
    './admin-auth': { requireAdmin: async () => {} },
    '@/server/repositories/orders': { exportOrderRows: async () => ({ async *[Symbol.asyncIterator]() { yield row; }, close: async () => { closed = true; } }) },
  })('@/server/services/order-export');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await service.exportOrders(undefined, ''));
  const sheet = workbook.worksheets[0];
  assert.equal(sheet.columnCount, 15);
  assert.equal(sheet.getCell('J1').value, 'Tổng tiền (VND)');
  assert.equal(sheet.getCell('J2').value, 698000);
  assert.equal(sheet.getCell('O2').value, '=1+1');
  assert.equal(sheet.getCell('O2').type, ExcelJS.ValueType.String);
  assert.equal(closed, true);
});
test('checkout rejects invalid quantity/contact/payment and admin has only the allowed completion transitions', () => {
  const { validateCheckout, canComplete } = loader()('@/server/domain/order');
  assert.equal(validateCheckout(form()).quantity, 2);
  for (const [key, value] of [['quantity', '0'], ['quantity', '11'], ['quantity', '1.5'], ['quantity', 'NaN'], ['name', 'x'], ['phone', 'x'], ['address', 'x'], ['paymentMethod', 'cash'], ['requestKey', 'x']]) {
    const data = form(); data.set(key, value); assert.throws(() => validateCheckout(data));
  }
  for (const status of ['pending', 'unpaid', 'paid', 'completed']) for (const paymentMethod of ['cod', 'payos']) {
    assert.equal(canComplete({ status, paymentMethod }), status === 'paid' || (status === 'unpaid' && paymentMethod === 'cod'));
  }
});
test('placing orders trusts session email and server prices; retries return the same order and guests cannot buy', async () => {
  let user = null, saved = null, writes = 0;
  const service = loader({
    './account-session': { currentAccount: async () => user },
    './catalog': { shopProduct: () => ({ name: 'Board game', ready: true, price: 349000 }) },
    '@/server/infrastructure/payos': { payosReady: () => true },
    '@/server/repositories/orders': { findOrderByRequest: async () => saved, insertOrder: async row => { writes++; saved = row; return row; }, orderView: row => row },
  })('@/server/services/orders');
  const data = form();
  await assert.rejects(service.placeOrder(data), /đăng nhập/);
  user = { userId: 'customer', email: 'real@example.com', role: 'user' };
  const order = await service.placeOrder(data);
  assert.equal(order.email, user.email); assert.equal(order.userId, user.userId); assert.equal(order.total, 698000); assert.equal(order.status, 'unpaid');
  assert.equal((await service.placeOrder(data)).orderCode, order.orderCode); assert.equal(writes, 1);
});
test('owner isolation and admin authorization apply before order access or mutation', async () => {
  let filterUser, writes = 0;
  const service = loader({
    './account-session': { currentAccount: async () => ({ userId: 'customer' }) },
    './admin-auth': { requireAdmin: async () => { throw new Error('Unauthorized'); } },
    '@/server/repositories/orders': { findOrder: async (_, owner) => { filterUser = owner; return null; }, completeOrder: async () => { writes++; } },
  })('@/server/services/orders');
  assert.equal(await service.customerOrder('other-order'), null); assert.equal(filterUser, 'customer');
  await assert.rejects(service.finishOrder('other-order'), /Unauthorized/); assert.equal(writes, 0);
});
test('webhooks require verified data and matching provider amount; partial payments never mark paid; duplicate and completed events are harmless', async () => {
  const order = { _id: new ObjectId(), orderCode: 1234, total: 349000, paymentMethod: 'payos', status: 'pending', paymentLinkId: 'link' };
  let payment = { id: 'link', orderCode: 1234, amount: 349000, amountPaid: 100000, amountRemaining: 249000, status: 'UNDERPAID' };
  let writes = 0, verified = true;
  const service = loader({
    '@/server/infrastructure/payos': { verifyPayosWebhook: async () => { if (!verified) throw new Error('signature'); return { code: '00', currency: 'VND', orderCode: 1234, paymentLinkId: 'link' }; }, getPayosPayment: async () => payment },
    '@/server/repositories/orders': { findOrderByCode: async () => order, recordProviderStatus: async (_, status, paid) => { writes++; if (paid) order.status = 'paid'; } },
  })('@/server/services/orders');
  verified = false; await assert.rejects(service.receivePaymentWebhook({}), /signature/); assert.equal(writes, 0);
  verified = true; await service.receivePaymentWebhook({}); assert.equal(order.status, 'pending');
  payment.amount = 1; await assert.rejects(service.receivePaymentWebhook({}), /khớp/); assert.equal(writes, 1);
  payment = { ...payment, amount: 349000, amountPaid: 349000, amountRemaining: 0, status: 'PAID' };
  await service.receivePaymentWebhook({}); assert.equal(order.status, 'paid'); assert.equal(writes, 2);
  await service.receivePaymentWebhook({}); order.status = 'completed'; await service.receivePaymentWebhook({}); assert.equal(writes, 2);
});
test('real payOS SDK rejects tampered signatures without any payment network request', async () => {
  const keys = ['PAYOS_CLIENT_ID', 'PAYOS_API_KEY', 'PAYOS_CHECKSUM_KEY'];
  const prior = keys.map(key => process.env[key]);
  keys.forEach(key => { process.env[key] = 'orders-test-only'; });
  try {
    const service = loader()('@/server/infrastructure/payos');
    const data = { orderCode: 123, amount: 1000, code: '00', currency: 'VND', paymentLinkId: 'abc', description: 'Test' };
    const signature = createHmac('sha256', process.env.PAYOS_CHECKSUM_KEY).update(Object.keys(data).sort().map(key => `${key}=${data[key]}`).join('&')).digest('hex');
    assert.deepEqual(await service.verifyPayosWebhook({ data, signature }), data);
    await assert.rejects(service.verifyPayosWebhook({ data: { ...data, amount: 1 }, signature }), /Chữ ký/);
  } finally { keys.forEach((key, i) => { if (prior[i] === undefined) delete process.env[key]; else process.env[key] = prior[i]; }); }
});
