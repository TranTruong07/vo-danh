import { chromium, expect } from '@playwright/test';
import { MongoClient } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

process.loadEnvFile('.env.local');
const base = process.env.ACCOUNT_TEST_BASE_URL || 'http://localhost:3001';
const emails = [0, 1].map(() => `profile-probe-${randomUUID()}@example.com`);
const password = 'Profile-test-123', newPassword = 'Profile-new-456';
const client = new MongoClient(process.env.MONGODB_URI);
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1360, height: 1100 } });
const page = await context.newPage();
const errors = [], imageKeys = new Set();
page.on('pageerror', error => errors.push(error.message));
const png = await sharp({ create: { width: 120, height: 120, channels: 3, background: '#981f25' } }).png().toBuffer();
const image = { name: 'avatar.png', mimeType: 'image/png', buffer: png };
const headerAvatar = page.locator('.account-menu summary img');
async function rememberImage(db, email) {
  const user = await db.collection('users').findOne({ email });
  if (user?.avatarUrl?.startsWith(process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, '') + '/images/avatars/')) imageKeys.add(new URL(user.avatarUrl).pathname.match(/images\/avatars\/[a-f0-9-]{36}\.webp$/)?.[0]);
  return user;
}
async function register(email, withImage = false) {
  await page.goto(base + '/?auth=register');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  if (withImage) await dialog.locator('input[type=file]').setInputFiles(image);
  await dialog.getByLabel('Email', { exact: true }).fill(email);
  await dialog.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await dialog.getByLabel('Xác nhận mật khẩu', { exact: true }).fill(password);
  await dialog.getByRole('button', { name: /Tạo tài khoản/ }).click();
  await expect(dialog).not.toBeVisible({ timeout: 45000 });
}
async function login(email, pass) {
  await page.goto(base + '/?auth=login');
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Email', { exact: true }).fill(email);
  await dialog.getByLabel('Mật khẩu', { exact: true }).fill(pass);
  await dialog.locator('button[type=submit]').click();
  return dialog;
}
try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB_NAME?.trim() || undefined);
  await mkdir('test-results', { recursive: true });
  await page.goto(base + '/account');
  await expect(page).toHaveURL(/auth=login&next=\/account/);
  await register(emails[0]);
  await expect(headerAvatar).toHaveAttribute('src', '/images/default-avatar.svg');
  await page.getByLabel('Mở menu tài khoản').click();
  await page.getByRole('link', { name: 'Thông tin cá nhân', exact: true }).first().click();
  await expect(page).toHaveURL(base + '/account');
  await page.getByLabel('Họ và tên', { exact: true }).fill('Nguyễn Văn An');
  await page.getByLabel('Số điện thoại', { exact: true }).fill('0912345678');
  await page.getByLabel('Địa chỉ', { exact: true }).fill('Hà Nội, Việt Nam');
  await page.locator('.profile-form input[type=file]').setInputFiles(image);
  await page.getByRole('button', { name: /Lưu thay đổi/ }).click();
  await expect(page.getByRole('status')).toContainText('Đã lưu thông tin cá nhân', { timeout: 45000 });
  let user = await rememberImage(db, emails[0]);
  expect(user.fullName).toBe('Nguyễn Văn An');
  expect(user.avatarUrl).toMatch(/\/images\/avatars\/.*\.webp$/);
  await expect(headerAvatar).toHaveAttribute('src', user.avatarUrl);
  await expect.poll(() => headerAvatar.evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
  await page.reload();
  await expect(page.getByLabel('Họ và tên', { exact: true })).toHaveValue('Nguyễn Văn An');
  await expect(page.getByLabel('Email đăng nhập')).toHaveValue(emails[0]);
  await page.screenshot({ path: 'test-results/profile-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/profile-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel('Mở menu tài khoản').click();
  await expect(page.locator('.account-menu-panel')).toBeVisible();
  const box = await page.locator('.account-menu-panel').boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(390);
  await page.screenshot({ path: 'test-results/profile-menu-mobile.png' });
  await page.keyboard.press('Escape');
  await expect(page.locator('.account-menu-panel')).not.toBeVisible();
  await page.getByRole('button', { name: 'Dùng ảnh mặc định' }).click();
  await page.getByRole('button', { name: /Lưu thay đổi/ }).click();
  await expect(page.getByRole('status')).toContainText('Đã lưu');
  await expect(headerAvatar).toHaveAttribute('src', '/images/default-avatar.svg');
  const oldCookie = (await context.cookies()).find(c => c.name === 'vo_danh_session');
  await db.collection('users').updateOne({ _id: user._id }, { $set: { passwordReset: { tokenHash: 'profile-test-reset', expiresAt: new Date(Date.now() + 60000) } } });
  await page.goto(base + '/account/password');
  await page.getByLabel('Mật khẩu hiện tại', { exact: true }).fill('wrong-password');
  await page.getByLabel('Mật khẩu mới', { exact: true }).fill(newPassword);
  await page.getByLabel('Xác nhận mật khẩu mới', { exact: true }).fill(newPassword);
  await page.getByRole('button', { name: /Lưu mật khẩu mới/ }).click();
  await expect(page.locator('.profile-form').getByRole('alert')).toContainText('Mật khẩu hiện tại không đúng');
  await page.getByLabel('Mật khẩu hiện tại', { exact: true }).fill(password);
  await page.getByRole('button', { name: /Lưu mật khẩu mới/ }).click();
  await expect(page.getByRole('status')).toContainText('Đã đổi mật khẩu');
  user = await db.collection('users').findOne({ email: emails[0] });
  expect(user.authVersion).toBe(1); expect(user.passwordReset).toBeUndefined();
  await page.screenshot({ path: 'test-results/password-mobile.png', fullPage: true });
  const stale = await browser.newContext();
  await stale.addCookies([oldCookie]);
  const stalePage = await stale.newPage();
  await stalePage.goto(base + '/account');
  await expect(stalePage).toHaveURL(/auth=login/);
  await stale.close();
  await page.getByLabel('Mở menu tài khoản').click();
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page).toHaveURL(/auth=login/);
  await login(emails[0], password);
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('không đúng');
  const dialog = await login(emails[0], newPassword);
  await expect(dialog).not.toBeVisible();
  await context.clearCookies();
  await register(emails[1], true);
  user = await rememberImage(db, emails[1]);
  await expect(headerAvatar).toHaveAttribute('src', user.avatarUrl);
  expect(user.avatarUrl).toMatch(/\/images\/avatars\/.*\.webp$/);
  // Existing DB documents without the new fields still render the default avatar.
  await db.collection('users').updateOne({ _id: user._id }, { $unset: { avatarUrl: '', fullName: '', phone: '', address: '' } });
  await page.reload();
  await expect(headerAvatar).toHaveAttribute('src', '/images/default-avatar.svg');
  expect(errors).toEqual([]);
  console.log('PASS: optional signup avatar, real R2 upload, default/legacy avatar, profile persistence, mobile dropdown, password checks, revoked sessions, old/new password login.');
} finally {
  await browser.close();
  const db = client.db(process.env.MONGODB_DB_NAME?.trim() || undefined);
  for (const email of emails) {
    const user = await rememberImage(db, email);
    if (user) { await db.collection('auth_sessions').deleteMany({ userId: user._id }); await db.collection('users').deleteOne({ _id: user._id, email }); }
  }
  const r2 = new S3Client({ region: 'auto', endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } });
  for (const key of imageKeys) {
    if (!key || !/^images\/avatars\/[a-f0-9-]{36}\.webp$/.test(key)) continue;
    const url = `${process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;
    if (!await db.collection('users').findOne({ avatarUrl: url })) await r2.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }));
  }
  r2.destroy(); await client.close();
}
