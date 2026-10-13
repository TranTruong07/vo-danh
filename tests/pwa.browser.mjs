import { rescanCharacter } from './support/rescan-character.mjs';
import { chromium, expect } from '@playwright/test';
import { MongoClient, ObjectId } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QRCodeSVG } from 'qrcode.react';
import sharp from 'sharp';

process.loadEnvFile('.env.local');
const base = process.env.PWA_TEST_BASE_URL || 'http://localhost:3014';
const marker = 'pwa-probe-' + randomUUID(), ids = [new ObjectId(), new ObjectId()];
const client = new MongoClient(process.env.MONGODB_URI);
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage(), errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error' && /hydration|hydrated/i.test(message.text())) errors.push(message.text()); });
const ready = () => expect(page.getByRole('radio')).toHaveCount(4, { timeout: 25000 });
const packReady = () => expect.poll(() => page.evaluate(async () => {
  if (!navigator.serviceWorker.controller) return false;
  const response = await fetch('/__offline/pack');
  return response.ok;
}), { timeout: 180000 }).toBe(true);
try {
  await client.connect(); const db = client.db(process.env.MONGODB_DB_NAME || undefined);
  await db.collection('characters').insertMany(ids.map((_id, i) => ({ _id, name: `Nhân vật PWA ${i + 1}`, openingLine: `Cùng khám phá lịch sử nhé. ${marker}`, image: '/images/history-landscape.webp', backgroundImage: '/images/history-landscape.webp', createdAt: new Date(), updatedAt: new Date() })));
  const rows = ids.flatMap(id => [1, 2, 3].map(number => ({ _id: new ObjectId(), characterId: id.toHexString(), question: `Câu hỏi thử offline số ${number} của ${id}`, answers: ['Đáp án đúng', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D'], correctIndex: 0, correctFeedback: 'Đúng rồi, chơi được khi mất mạng!', incorrectFeedback: 'Chưa đúng, hãy ghi nhớ đáp án A.', createdAt: new Date(), updatedAt: new Date() })));
  await db.collection('character_questions').insertMany(rows);
  await mkdir('test-results', { recursive: true });
  await page.goto(base);
  await packReady();
  await expect(page.locator('.pwa-status')).toHaveCount(0);
  const manifest = await (await page.request.get(base + '/manifest.webmanifest')).json();
  expect(manifest.display).toBe('standalone');
  expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await page.goto(`${base}/play/${ids[0]}`); await ready();
  const seen = [await page.locator('.question-speech h2').innerText()];
  await context.setOffline(true);
  await expect(page.locator('.pwa-status')).toHaveText('Chuẩn bị chơi offline');
  await expect(page.locator('.pwa-status button, .pwa-status details')).toHaveCount(0);
  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: 'Chốt đáp án →' }).click();
  await expect(page.locator('.answer-feedback')).toContainText('Đúng rồi, chơi được khi mất mạng!');
  for (let i = 0; i < 3; i++) {
    await rescanCharacter(page, base + '/play/' + ids[0]); await ready();
    seen.push(await page.locator('.question-speech h2').innerText());
    await page.getByRole('radio').nth(1).check();
    await page.getByRole('button', { name: 'Chốt đáp án →' }).click();
    await expect(page.locator('.answer-feedback')).toContainText('Chưa đúng');
  }
  expect(new Set(seen.slice(0, 3)).size).toBe(3); expect(seen[3]).not.toBe(seen[2]);
  await page.getByRole('link', { name: 'Trang chủ', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Theo dấu chân xưa/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Nhân vật đã lưu trên máy' })).toBeVisible();
  await expect(page.locator('.hero-art img')).toBeVisible();
  expect(await page.locator('.hero-art img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/pwa-home-offline.png', fullPage: true });
  await page.getByRole('link', { name: 'Mua ngay' }).click();
  await expect(page.locator('.pwa-notice')).toContainText('Tính năng này cần mạng');
  await page.getByRole('button', { name: 'Đóng thông báo' }).click();
  await page.getByRole('link', { name: 'Quét mã', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Quét thẻ nhân vật' })).toBeVisible();
  // Load the jsQR chunk for the first time while offline, and decode a real QR image.
  const qr = renderToStaticMarkup(createElement(QRCodeSVG, { value: `${base}/play/${ids[1]}`, size: 600, marginSize: 4 }));
  const png = await sharp(Buffer.from(qr)).png().toBuffer();
  await page.getByLabel('Chọn ảnh QR', { exact: true }).setInputFiles({ name: 'character.png', mimeType: 'image/png', buffer: png });
  await ready();
  await expect(page.getByRole('heading', { name: 'Nhân vật PWA 2', exact: true })).toBeVisible();
  await page.reload(); await ready();
  expect(await page.locator('.scene-background').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  expect(await page.locator('.actor-sprite img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.getByRole('button', { name: 'Mở trò chuyện với Nhân vật PWA 2' }).click();
  await expect(page.getByRole('dialog')).toContainText('Trò chuyện đang được chuẩn bị');
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Gửi tin nhắn' })).toBeDisabled();
  await page.getByRole('dialog').getByRole('button', { name: 'Đóng trò chuyện', exact: true }).click();
  await page.screenshot({ path: 'test-results/pwa-character-offline.png', fullPage: true });
  await page.getByRole('button', { name: 'Quét nhân vật tiếp' }).click();
  const cameraQr = renderToStaticMarkup(createElement(QRCodeSVG, { value: `${base}/play/${ids[0]}`, size: 600, marginSize: 4 }));
  const cameraImage = (await sharp(Buffer.from(cameraQr)).png().toBuffer()).toString('base64');
  await page.evaluate(async data => {
    const image = new Image(); image.src = `data:image/png;base64,${data}`; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = 600; canvas.height = 600;
    canvas.getContext('2d').drawImage(image, 0, 0);
    // Exercise video frame decoding with a simulated camera, without hardware access.
    navigator.mediaDevices.getUserMedia = async () => {
      const stream = canvas.captureStream(15);
      const timer = setInterval(() => canvas.getContext('2d').drawImage(image, 0, 0), 65);
      stream.getVideoTracks()[0].addEventListener('ended', () => clearInterval(timer));
      return stream;
    };
  }, cameraImage);
  await page.getByRole('button', { name: 'Bật camera quét QR' }).click();
  await ready();
  await expect(page.getByRole('heading', { name: 'Nhân vật PWA 1', exact: true })).toBeVisible();
  // Unknown QR gives a recoverable message instead of a network error/404 shell.
  await page.goto(`${base}/play/${new ObjectId()}`);
  await expect(page.locator('.game-message.error')).toContainText('chưa có trong bộ dữ liệu');
  // Wi-Fi can stay connected even when the Internet/server is unreachable.
  await page.addInitScript(() => Object.defineProperty(Navigator.prototype, 'onLine', { get: () => true, configurable: true }));
  await page.goto(base);
  await expect(page.locator('.pwa-status')).toHaveText('Chuẩn bị chơi offline');
  await expect(page.getByRole('heading', { name: 'Nhân vật đã lưu trên máy' })).toBeVisible();
  await context.setOffline(false);
  await db.collection('character_questions').updateOne({ _id: rows[0]._id }, { $set: { question: 'Câu hỏi đã cập nhật sau khi có mạng trở lại', updatedAt: new Date() } });
  await page.goto(base);
  await packReady();
  await expect.poll(async () => page.evaluate(async () => (await (await fetch('/__offline/pack')).json()).questions.some(q => q.question === 'Câu hỏi đã cập nhật sau khi có mạng trở lại')), { timeout: 60000 }).toBe(true);
  const keys = await page.evaluate(async () => (await Promise.all((await caches.keys()).map(async name => (await (await caches.open(name)).keys()).map(key => new URL(key.url).pathname)))).flat());
  expect(keys.some(key => /^\/(admin|orders|checkout)(\/|$)/.test(key))).toBe(false);
  expect(keys.filter(key => key.startsWith('/api/'))).toEqual([]);
  expect(errors).toEqual([]);
  console.log('PASS: first sync, install manifest, mid-round disconnect, local correct/incorrect grading, no-repeat cycles, offline home reload and images, purchase notice, unvisited character from real QR image, simulated camera frame decoding, offline lazy decoder, character reload/background/portrait, unknown QR, reconnect update and private-route cache exclusion.');
} catch (error) {
  console.error('Page:', page.url(), '\nPWA:', await page.locator('.pwa-status').innerText().catch(() => 'none'));
  await page.screenshot({ path: 'test-results/pwa-failure.png', fullPage: true }).catch(() => {});
  throw error;
} finally {
  await browser.close(); const db = client.db(process.env.MONGODB_DB_NAME || undefined);
  for (const name of ['quiz_attempts', 'question_cycles', 'character_questions']) await db.collection(name).deleteMany({ characterId: { $in: ids.map(String) } });
  await db.collection('characters').deleteMany({ _id: { $in: ids }, openingLine: { $regex: marker } });
  await client.close();
}
