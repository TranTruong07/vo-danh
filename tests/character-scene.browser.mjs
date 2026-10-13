import { rescanCharacter } from './support/rescan-character.mjs';
import { chromium, expect } from '@playwright/test';
import { MongoClient, ObjectId } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
process.loadEnvFile('.env.local');
const base = process.env.SCENE_TEST_BASE_URL || 'http://localhost:3001';
const marker = 'scene-probe-' + randomUUID(), ids = [new ObjectId(), new ObjectId(), new ObjectId()];
const client = new MongoClient(process.env.MONGODB_URI);
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
const page = await context.newPage();
const errors = [], payloads = [];
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => { if (/generativelanguage\.googleapis\.com|\/api\/(?:chat|tts)(?:\?|$)/.test(request.url())) errors.push('Unexpected chatbot request'); });
page.on('console', message => { if (message.type() === 'error' && /hydration|hydrated/i.test(message.text())) errors.push(message.text()); });
page.on('response', async response => { if (response.request().method() === 'POST') { const body = await response.text().catch(() => ''); if (body.includes('expiresAt')) payloads.push(body); } });
async function ready() {
  await expect(page.getByRole('radio')).toHaveCount(4, { timeout: 20000 });
  await expect(page.getByRole('radio').first()).toBeEnabled();
  await expect(page.locator('.question-speech h2')).toBeVisible();
}
try {
  await client.connect(); const db = client.db(process.env.MONGODB_DB_NAME || undefined);
  const source = await db.collection('characters').findOne({ image: { $regex: '^https://' } }, { projection: { image: 1, backgroundImage: 1 } });
  const image = source?.image || '/images/history-landscape.webp', backgroundImage = source?.backgroundImage || '/images/history-landscape.webp';
  const names = ['Ngô Quyền', 'Trần Hưng Đạo', 'Nhân vật chưa có câu hỏi'];
  await db.collection('characters').insertMany(ids.map((_id, index) => ({ _id, name: names[index], image, backgroundImage, openingLine: `Ta là ${names[index]}, cùng ta mở một trang sử nhé. ${marker}`, createdAt: new Date(), updatedAt: new Date() })));
  const questionTexts = [
    'Chiến thắng Bạch Đằng của Ngô Quyền diễn ra năm nào?',
    'Ngô Quyền dùng cách nào để chống quân Nam Hán trên sông Bạch Đằng?',
    'Sau chiến thắng Bạch Đằng, Ngô Quyền chọn nơi nào làm kinh đô?',
    'Chiến thắng của Ngô Quyền mở ra thời kỳ nào trong lịch sử dân tộc?',
  ];
  const options = [['938', '939', '1288', '981'], ['Bãi cọc ngầm', 'Thành lũy trên núi', 'Kỵ binh', 'Xe chiến'], ['Cổ Loa', 'Phú Xuân', 'Hoa Lư', 'Thăng Long'], ['Độc lập tự chủ', 'Bắc thuộc', 'Pháp thuộc', 'Nội chiến']];
  await db.collection('character_questions').insertMany([
    ...questionTexts.map((question, index) => ({ characterId: ids[0].toHexString(), question, answers: options[index], correctIndex: 0, correctFeedback: 'Phản hồi đúng ' + marker, incorrectFeedback: 'Phản hồi sai ' + marker, createdAt: new Date(), updatedAt: new Date() })),
    { characterId: ids[1].toHexString(), question: 'Trần Hưng Đạo chỉ huy quân dân chống quân xâm lược nào?', answers: ['Nguyên Mông', 'Nam Hán', 'Minh', 'Tống'], correctIndex: 0, correctFeedback: 'Phản hồi đúng ' + marker, incorrectFeedback: 'Phản hồi sai ' + marker, createdAt: new Date(), updatedAt: new Date() },
  ]);
  await mkdir('test-results', { recursive: true });
  for (const path of ['/', '/shop']) {
    await page.goto(base + path);
    await expect(page.locator('a[href="/chat"], .ai-section')).toHaveCount(0);
    await expect(page.locator('main')).not.toContainText('Trợ lý AI');
    await page.screenshot({ path: `test-results/without-chat-${path === '/' ? 'home' : 'shop'}.png`, fullPage: true, caret: 'initial' });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/without-chat-home-mobile.png', fullPage: true, caret: 'initial' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const path of ['/chat', '/api/chat', '/api/tts']) expect((await page.request.get(base + path)).status()).toBe(404);
  expect((await page.request.post(base + '/api/chat', { data: { message: 'test' } })).status()).toBe(404);
  await page.goto(base + '/qr');
  await expect(page).toHaveURL(base + '/play');
  await page.goto(base + '/play/' + ids[0]); await ready();
  expect((await context.cookies()).some(cookie => cookie.name === 'vo_danh_session')).toBe(false);
  await expect(page.locator('.scene-background')).toHaveAttribute('src', backgroundImage);
  await expect(page.locator('.actor-sprite img')).toHaveAttribute('src', image);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Mở trò chuyện với Ngô Quyền' })).toHaveAttribute('aria-expanded', 'false');
  await expect.poll(() => payloads.length).toBeGreaterThan(0);
  expect(payloads.join('')).not.toContain('correctIndex');
  expect(payloads.join('')).not.toContain('Phản hồi đúng');
  const first = await page.locator('.question-speech h2').innerText();
  expect(questionTexts).toContain(first);
  expect(await page.locator('.actor-sprite').evaluate(el => getComputedStyle(el).animationName)).not.toBe('none');
  await page.getByRole('button', { name: 'Tắt chuyển động' }).click();
  expect(await page.locator('.actor-sprite').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await page.screenshot({ path: 'test-results/character-scene-desktop.png', fullPage: true, caret: 'initial' });
  await page.getByRole('button', { name: 'Mở trò chuyện với Ngô Quyền' }).click();
  const chat = page.getByRole('dialog', { name: 'Trò chuyện với Ngô Quyền' });
  await expect(chat.getByRole('log')).toContainText('Ta là Ngô Quyền');
  await expect(chat).toContainText('Trò chuyện đang được chuẩn bị');
  await expect(chat.getByRole('textbox')).toBeDisabled();
  await expect(chat.getByRole('button', { name: 'Gửi tin nhắn' })).toBeDisabled();
  await page.screenshot({ path: 'test-results/character-chat-desktop.png', fullPage: true, caret: 'initial' });
  await page.keyboard.press('Escape');
  await expect(chat).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Mở trò chuyện với Ngô Quyền' })).toBeFocused();
  const seen = [first];
  for (let i = 0; i < 4; i++) {
    await page.getByRole('radio').nth(i === 0 ? 1 : 0).check();
    await page.getByRole('button', { name: 'Chốt đáp án →' }).click();
    await expect(page.locator('.answer-feedback')).toContainText(i === 0 ? 'Phản hồi sai' : 'Phản hồi đúng');
    if (i === 1) { await page.reload(); await ready(); } // history persists across page reloads
    else { await rescanCharacter(page, base + '/play/' + ids[0]); await ready(); }
    seen.push(await page.locator('.question-speech h2').innerText());
  }
  expect(new Set(seen.slice(0, 4)).size).toBe(4);
  expect(seen[4]).not.toBe(seen[3]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.locator('.actor-sprite').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/character-scene-mobile.png', fullPage: true, caret: 'initial' });
  await page.getByRole('button', { name: 'Mở trò chuyện với Ngô Quyền' }).click();
  expect(await chat.evaluate(el => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight; })).toBe(true);
  await page.screenshot({ path: 'test-results/character-chat-mobile.png', fullPage: true, caret: 'initial' });
  await chat.getByRole('button', { name: 'Đóng trò chuyện', exact: true }).click();
  await page.getByRole('button', { name: 'Quét nhân vật tiếp' }).click();
  await page.getByText('Hoặc dán liên kết / mã nhân vật', { exact: true }).click();
  await page.getByLabel('Liên kết hoặc ID nhân vật').fill(base + '/play/' + ids[1]);
  await page.getByRole('button', { name: 'Mở nhân vật', exact: true }).click();
  await expect(page).toHaveURL(new RegExp('/play/' + ids[1] + '\\?round=')); await ready();
  await expect(page.getByRole('heading', { name: 'Trần Hưng Đạo', exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Mở trò chuyện với Trần Hưng Đạo' }).click();
  await expect(page.getByRole('dialog').getByRole('log')).toContainText('Ta là Trần Hưng Đạo');
  await expect(page.getByRole('dialog').getByRole('log')).not.toContainText('Ngô Quyền');
  await page.goto(base + '/play/' + ids[2]);
  await expect(page.getByRole('region', { name: 'Câu hỏi lịch sử' }).getByRole('alert')).toContainText('Nhân vật này chưa có câu hỏi');
  await expect(page.getByRole('radio')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(errors).toEqual([]);
  console.log('PASS: bank-only quiz, unique draws, grading, QR rescan, desktop/mobile, closed chat shell, character greeting, Escape/focus, disabled sending and no chatbot API requests.');
} catch (error) {
  await page.screenshot({ path: 'test-results/character-scene-failure.png', fullPage: true, caret: 'initial' }).catch(() => {});
  console.error('Page:', page.url()); throw error;
} finally {
  await browser.close(); const db = client.db(process.env.MONGODB_DB_NAME || undefined);
  for (const collection of ['quiz_attempts', 'question_cycles', 'character_questions']) await db.collection(collection).deleteMany({ characterId: { $in: ids.map(String) } });
  await db.collection('characters').deleteMany({ _id: { $in: ids }, openingLine: { $regex: marker } });
  await client.close();
}
