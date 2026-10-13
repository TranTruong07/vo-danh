import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const nativeRequire = createRequire(import.meta.url);
function loader(mocks = {}, env = {}) {
  const cache = new Map();
  function load(name) {
    if (name in mocks) return mocks[name];
    if (name === 'server-only') return {};
    if (name.startsWith('./')) return load('@/server/services/' + name.slice(2));
    if (!name.startsWith('@/')) return nativeRequire(name);
    if (cache.has(name)) return cache.get(name).exports;
    const file = path.resolve(name.slice(2) + '.ts');
    const loadedModule = { exports: {} };
    cache.set(name, loadedModule);
    const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    vm.runInThisContext('(function(require,module,exports,process){' + js + '\n})', { filename: file })(load, loadedModule, loadedModule.exports, { env });
    return loadedModule.exports;
  }
  return load;
}

test('email/password validation enforces normalization, bounds and confirmation', () => {
  const { validateAuthInput, normalizeEmail } = loader()('@/server/domain/auth');
  const input = { email: 'Person@example.com', password: '123456', confirmPassword: '123456', token: '' };
  assert.equal(normalizeEmail(' Person@Example.com '), 'person@example.com');
  assert.equal(validateAuthInput('register', input), undefined);
  for (const length of [5, 33]) assert.ok(validateAuthInput('login', { ...input, password: 'a'.repeat(length) }).password);
  for (const length of [6, 32]) assert.equal(validateAuthInput('login', { ...input, password: 'a'.repeat(length) }), undefined);
  for (const email of ['not-an-email', 'a@', 'a@localhost', 'a b@example.com', 'a..b@example.com']) assert.ok(validateAuthInput('register', { ...input, email }).email);
  assert.ok(validateAuthInput('register', { ...input, confirmPassword: 'abcdef' }).confirmPassword);
});

test('password hashes are salted and reject incorrect passwords/malformed hashes', async () => {
  const { hashPassword, verifyPassword } = loader()('@/server/infrastructure/password');
  const first = await hashPassword('123456');
  const second = await hashPassword('123456');
  assert.notEqual(first, second);
  assert.ok(!first.includes('123456'));
  assert.equal(await verifyPassword('123456', first), true);
  assert.equal(await verifyPassword('654321', first), false);
  assert.equal(await verifyPassword('123456', 'bad-format'), false);
});

function fixture() {
  const env = { ADMIN_EMAIL: 'admin@example.com', ADMIN_PASSWORD: '123456' };
  const rows = new Map();
  const opened = [];
  const sent = [];
  let reset;
  let attempts = 0;
  const repository = {
    recordAuthAttempt: async () => ({ count: ++attempts }),
    findUserByEmail: async email => rows.get(email) ?? null,
    createUser: async (email, passwordHash) => {
      if (rows.has(email)) throw Object.assign(new Error(), { code: 11000 });
      const user = { _id: { toHexString: () => 'test-id' }, email, passwordHash, role: 'user', authVersion: 0 };
      rows.set(email, user); return user;
    },
    provisionAdmin: async (email, passwordHash) => {
      const user = { _id: { toHexString: () => 'admin-id' }, email, passwordHash, role: 'admin', authVersion: 0 };
      rows.set(email, user); return user;
    },
    setResetToken: async (id, tokenHash, expiresAt) => { reset = { id, tokenHash, expiresAt }; },
    clearResetToken: async () => { reset = undefined; },
    consumeResetToken: async (hash, passwordHash) => {
      if (!reset || reset.tokenHash !== hash || reset.expiresAt <= new Date()) return null;
      const user = [...rows.values()].find(u => u._id === reset.id);
      reset = undefined;
      user.passwordHash = passwordHash; user.authVersion++;
      return user;
    },
  };
  const load = loader({
    '@/server/repositories/users': repository,
    '@/server/services/account-session': {
      configuredAdmin: () => ({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }),
      openAccountSession: async user => opened.push(user),
      publicUser: user => ({ userId: user._id.toHexString(), email: user.email, role: user.role }),
    },
    '@/server/infrastructure/reset-email': {
      resetMailConfiguration: () => ({}),
      sendPasswordResetEmail: async (email, token) => sent.push({ email, token }),
    },
  }, env);
  return { act: load('@/server/services/accounts').handleAccountAction, rows, opened, sent, repository, expireReset: () => { reset.expiresAt = new Date(0); } };
}
const input = { email: 'person@example.com', password: '123456', confirmPassword: '123456', token: '' };

test('registration reserves admin email, normalizes duplicates and never assigns admin to public signup', async () => {
  const f = fixture();
  await assert.rejects(f.act('register', { ...input, email: 'ADMIN@example.com' }), /không thể đăng ký/);
  const result = await f.act('register', { ...input, email: 'Person@Example.com' });
  assert.equal(result.user.role, 'user');
  assert.equal(result.user.email, input.email);
  assert.equal(f.rows.get(input.email).passwordHash.startsWith('scrypt$'), true);
  await assert.rejects(f.act('register', input), /đã được đăng ký/);
});

test('normal login uses Mongo password hash; admin login uses env and redirects to dashboard', async () => {
  const f = fixture();
  await f.act('register', input);
  await assert.rejects(f.act('login', { ...input, password: 'wrong-password' }), /không đúng/);
  assert.equal((await f.act('login', input)).redirectTo, undefined);
  const admin = await f.act('login', { ...input, email: 'admin@example.com' });
  assert.equal(admin.user.role, 'admin');
  assert.equal(admin.redirectTo, '/admin');
  await assert.rejects(f.act('login', { ...input, email: 'admin@example.com', password: 'wrong-password' }), /không đúng/);
});

test('forgot password gives the same response, consumes token once, changes hash and invalidates old sessions', async () => {
  const f = fixture();
  await f.act('register', input);
  const known = await f.act('forgot', input);
  const absent = await f.act('forgot', { ...input, email: 'absent@example.com' });
  assert.deepEqual(known, absent);
  assert.equal(f.sent.length, 1);
  const token = f.sent[0].token;
  await f.act('reset', { ...input, token, password: 'new-password', confirmPassword: 'new-password' });
  assert.equal(f.rows.get(input.email).authVersion, 1);
  await assert.rejects(f.act('reset', { ...input, token }), /hết hạn/);
  await assert.rejects(f.act('login', input), /không đúng/);
  assert.equal((await f.act('login', { ...input, password: 'new-password' })).ok, true);
});

test('expired reset token is rejected', async () => {
  const f = fixture();
  await f.act('register', input);
  await f.act('forgot', input);
  f.expireReset();
  await assert.rejects(f.act('reset', { ...input, token: f.sent[0].token }), /hết hạn/);
});

test('expired, revoked and old-password sessions do not authorize an account', async () => {
  let session = { userId: 'id', authVersion: 0 };
  const user = { _id: { toHexString: () => 'id' }, email: 'person@example.com', authVersion: 1, role: 'user' };
  const load = loader({
    react: { cache: fn => fn },
    'next/headers': { cookies: async () => ({ get: () => ({ value: 'a'.repeat(64) }) }) },
    '@/server/repositories/users': { findSession: async () => session, findUserById: async () => user },
  });
  const { currentAccount } = load('@/server/services/account-session');
  assert.equal(await currentAccount(), null);
  session.authVersion = 1;
  assert.equal((await currentAccount()).email, user.email);
  session = null;
  assert.equal(await currentAccount(), null);
});

test('admin sessions require the current configured identity and password fingerprint', async () => {
  const env = { ADMIN_EMAIL: 'admin@example.com', ADMIN_PASSWORD: '123456' };
  const user = { _id: { toHexString: () => 'id' }, email: env.ADMIN_EMAIL, authVersion: 0, role: 'admin' };
  const session = { userId: 'id', authVersion: 0, adminConfigHash: '' };
  const load = loader({
    react: { cache: fn => fn },
    'next/headers': { cookies: async () => ({ get: () => ({ value: 'a'.repeat(64) }) }) },
    '@/server/repositories/users': { findSession: async () => session, findUserById: async () => user },
  }, env);
  const { currentAccount, configuredAdmin } = load('@/server/services/account-session');
  assert.equal(await currentAccount(), null);
  session.adminConfigHash = configuredAdmin().fingerprint;
  assert.equal((await currentAccount()).role, 'admin');
  env.ADMIN_PASSWORD = 'changed-password';
  assert.equal(await currentAccount(), null);
  session.adminConfigHash = configuredAdmin().fingerprint;
  env.ADMIN_EMAIL = 'another@example.com';
  assert.equal(await currentAccount(), null);
});

test('rate limit rejects further authentication work when the attempt budget is exhausted', async () => {
  const f = fixture();
  f.repository.recordAuthAttempt = async () => ({ count: 16 });
  await assert.rejects(f.act('register', input), /quá nhiều lần/);
  assert.equal(f.rows.size, 0);
  f.repository.recordAuthAttempt = async () => ({ count: 4 });
  await assert.rejects(f.act('forgot', input), /quá nhiều lần/);
  assert.equal(f.sent.length, 0);
});
