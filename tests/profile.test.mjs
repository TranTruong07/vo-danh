import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import sharp from 'sharp';
import { loader } from './support/load-typescript.mjs';

const passwordTools = loader()('@/server/infrastructure/password');
function data(values) { const form = new FormData(); for (const [key, value] of Object.entries(values)) form.set(key, value); return form; }
async function fixture() {
  const user = { _id: new ObjectId(), email: 'profile@example.com', role: 'user', authVersion: 0, passwordHash: await passwordTools.hashPassword('old-password') };
  const state = { user, account: { userId: user._id.toHexString() }, updates: [], opened: [], uploads: [], rollbacks: [], limits: [], race: false };
  const load = loader({
    './account-session': { currentAccount: async () => state.account, publicUser: u => ({ userId: u._id.toHexString(), ...u }), openAccountSession: async u => state.opened.push(u) },
    './accounts': { limitAttempts: async (...args) => state.limits.push(args) },
    './account-avatar': { uploadAccountAvatar: async file => { if (file) state.uploads.push(file); return file ? { url: 'https://test.example/avatar.webp', key: 'new-key' } : undefined; }, rollbackAccountAvatar: async image => state.rollbacks.push(image) },
    '@/server/repositories/users': {
      findUserById: async id => { assert.equal(id.toHexString(), user._id.toHexString()); return user; },
      updateUserProfile: async (id, version, profile) => { assert.equal(id.toHexString(), user._id.toHexString()); assert.equal(version, 0); state.updates.push(profile); return { ...user, ...profile }; },
      changeUserPassword: async (oldUser, hash) => { assert.equal(oldUser, user); if (state.race) return null; user.passwordHash = hash; user.authVersion++; delete user.passwordReset; return user; },
    },
  });
  return { ...load('@/server/services/profile'), state };
}

test('legacy users receive the default avatar; public serialization never exposes password/reset secrets', () => {
  const load = loader({ 'next/headers': {}, react: { cache: fn => fn }, '@/server/repositories/users': {} });
  const result = load('@/server/services/account-session').publicUser({ _id: new ObjectId(), email: 'test@example.com', role: 'user', passwordHash: 'secret', passwordReset: { tokenHash: 'secret' } });
  assert.equal(result.avatarUrl, '/images/default-avatar.svg');
  assert.equal(result.fullName, '');
  assert.equal(result.passwordHash, undefined);
  assert.equal(result.passwordReset, undefined);
});

test('profile is authenticated and updates only the session owner and allowed fields', async () => {
  const f = await fixture();
  await f.saveProfile(data({ fullName: ' Nguyễn Văn An ', phone: '0912345678', address: ' Hà Nội ', email: 'other@example.com', role: 'admin', userId: new ObjectId().toHexString(), avatarUrl: 'https://untrusted.example/image' }));
  assert.deepEqual(f.state.updates[0], { fullName: 'Nguyễn Văn An', phone: '0912345678', address: 'Hà Nội', avatarUrl: '/images/default-avatar.svg' });
  f.state.account = null;
  await assert.rejects(f.saveProfile(data({})), /đăng nhập/);
  assert.equal(f.state.updates.length, 1);
});

test('profile validates input before upload and supports removing an existing avatar', async () => {
  const f = await fixture();
  const image = new File(['image'], 'avatar.png', { type: 'image/png' });
  for (const values of [{ fullName: 'a'.repeat(101) }, { phone: 'invalid phone' }, { address: 'a'.repeat(501) }]) await assert.rejects(f.saveProfile(data({ ...values, avatarFile: image })));
  assert.equal(f.state.uploads.length, 0);
  f.state.user.avatarUrl = 'https://test.example/old.webp';
  await f.saveProfile(data({}));
  assert.equal(f.state.updates[0].avatarUrl, f.state.user.avatarUrl);
  await f.saveProfile(data({ removeAvatar: 'true' }));
  assert.equal(f.state.updates[1].avatarUrl, '/images/default-avatar.svg');
  await f.saveProfile(data({ avatarFile: image }));
  assert.equal(f.state.updates[2].avatarUrl, 'https://test.example/avatar.webp');
});

test('password change requires correct current password, confirmation and limits; rotates session and reset token', async () => {
  const f = await fixture();
  const values = { currentPassword: 'old-password', password: 'new-password', confirmPassword: 'new-password' };
  for (const change of [{ currentPassword: 'wrong-password' }, { password: 'short' }, { password: 'a'.repeat(33) }, { confirmPassword: 'mismatch' }, { password: 'old-password', confirmPassword: 'old-password' }]) await assert.rejects(f.changePassword(data({ ...values, ...change })));
  assert.equal(f.state.opened.length, 0);
  f.state.user.passwordReset = { tokenHash: 'old-reset' };
  assert.equal((await f.changePassword(data(values))).ok, true);
  assert.equal(f.state.user.authVersion, 1);
  assert.equal(f.state.user.passwordReset, undefined);
  assert.equal(await passwordTools.verifyPassword('new-password', f.state.user.passwordHash), true);
  assert.equal(f.state.opened.length, 1);
  assert.ok(f.state.limits.every(([mode]) => mode === 'password'));
});

test('admin passwords and racing password changes cannot be overwritten', async () => {
  const f = await fixture(), form = data({ currentPassword: 'old-password', password: 'new-password', confirmPassword: 'new-password' });
  f.state.user.role = 'admin';
  await assert.rejects(f.changePassword(form), /ADMIN_PASSWORD/);
  f.state.user.role = 'user'; f.state.race = true;
  await assert.rejects(f.changePassword(form), /phiên khác/);
  assert.equal(f.state.opened.length, 0);
});

test('avatar upload decodes real images, rejects disguised/oversized files and rolls back only unreferenced objects', async () => {
  let uploaded = 0, deleted = 0, referenced = false, unavailable = false;
  const load = loader({
    '@/server/repositories/images': { uploadAvatarImage: async bytes => { assert.equal((await sharp(bytes).metadata()).format, 'webp'); uploaded++; return { key: 'key', url: 'url' }; }, discardUncommittedImage: async () => deleted++ },
    '@/server/repositories/users': { isUserAvatarReferenced: async () => { if (unavailable) throw new Error('DB down'); return referenced; } },
  });
  const service = load('@/server/services/account-avatar');
  assert.equal(await service.uploadAccountAvatar(), undefined);
  assert.equal(await service.uploadAccountAvatar(new File([], 'undefined')), undefined);
  await assert.rejects(service.uploadAccountAvatar(new File(['not an image'], 'fake.png')));
  await assert.rejects(service.uploadAccountAvatar(new File([new Uint8Array(3 * 1024 * 1024 + 1)], 'large.png')));
  assert.equal(uploaded, 0);
  const png = await sharp({ create: { width: 10, height: 10, channels: 3, background: '#981f25' } }).png().toBuffer();
  const image = await service.uploadAccountAvatar(new File([png], 'avatar.png'));
  assert.equal(uploaded, 1);
  referenced = true; await service.rollbackAccountAvatar(image); assert.equal(deleted, 0);
  unavailable = true; await service.rollbackAccountAvatar(image); assert.equal(deleted, 0);
  unavailable = false; referenced = false; await service.rollbackAccountAvatar(image); assert.equal(deleted, 1);
});

test('password repository uses atomic compare-and-set and invalidates old sessions/reset links', async () => {
  let query, update;
  const load = loader({ '@/lib/db/client': { getDatabase: async () => ({ collection: () => ({ createIndex: async () => {}, findOneAndUpdate: async (q, u) => { query = q; update = u; } }) }) } });
  const user = { _id: new ObjectId(), authVersion: 7, passwordHash: 'current-hash' };
  await load('@/server/repositories/users').changeUserPassword(user, 'new-hash', 'admin@example.com');
  assert.equal(query._id, user._id);
  assert.equal(query.authVersion, 7);
  assert.equal(query.passwordHash, 'current-hash');
  assert.equal(query.role, 'user');
  assert.equal(update.$inc.authVersion, 1);
  assert.ok('passwordReset' in update.$unset);
});
