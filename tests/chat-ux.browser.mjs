// Phase 5A UX checks. Real published responses + explicitly mocked transport errors.
// No knowledge, quiz fixtures, approvals or content are written to the database.
import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const base = process.env.CHAT_DEMO_URL || 'http://localhost:3013';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Local server required');
const fixture = JSON.parse(readFileSync('.local/phase4-demo-fixture.json', 'utf8'));
const folder = '.local/chat-phase-5a'; mkdirSync(folder, { recursive: true });
const report = { startedAt: new Date().toISOString(), checks: [], limitations: ['Edge viewport + VisualViewport resize/offset simulation; no real iOS keyboard', 'Transport errors and delayed responses are injected for UX tests, using unchanged published answer text'] };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
let activePage;
async function check(name, work) {
  try { await work(); report.checks.push({ name, status: 'passed' }); console.log('PASS', name); }
  catch (error) { report.checks.push({ name, status: 'failed', error: String(error).slice(0, 1800) }); if (activePage) await activePage.screenshot({ path: `${folder}/failure.png` }); throw error; }
}
const input = page => page.locator('.character-chat-composer textarea:visible');
const idle = page => expect(input(page)).not.toHaveAttribute('readonly', '');
const log = page => page.locator('.character-chat-log:visible');
async function send(page, text) {
  await expect(input(page)).toBeEnabled(); await idle(page); await input(page).fill(text);
  const response = page.waitForResponse(r => r.url().endsWith('/api/chat'));
  await input(page).press('Enter');
  const result = await response; assert.equal(result.status(), 200); const body = await result.json();
  await idle(page); return body;
}
async function openFirst(page) {
  const response = page.waitForResponse(r => r.url().endsWith('/api/chat/suggestions'));
  void response.catch(() => {});
  await page.locator('.character-chat-launcher:visible').click();
  assert.equal((await response).status(), 200);
  await expect(input(page)).toBeEnabled(); await idle(page);
}
async function bottom(page) { await expect.poll(() => log(page).evaluate(e => e.scrollHeight - e.scrollTop - e.clientHeight)).toBeLessThan(49); }
async function assertFrame(page, width, height) {
  const panel = await page.locator('.character-chat-panel:visible').boundingBox();
  assert.ok(panel.x >= -1 && panel.y >= -1 && panel.x + panel.width <= width + 1 && panel.y + panel.height <= height + 1);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const header = await page.locator('.character-chat-panel:visible > header').boundingBox(), composer = await page.locator('.character-chat-composer:visible').boundingBox();
  assert.ok(header.y >= panel.y && composer.y + composer.height <= panel.y + panel.height + 1);
  if (width <= 640) { assert.ok(panel.width >= width - 1 && panel.height >= height - 1); assert.equal(await page.locator('.character-chat-panel').getAttribute('aria-modal'), 'true'); }
  else assert.equal(Math.round(panel.width), 400);
}
try {
  const main = fixture.personas.find(p => p.characterId === 'vo-nguyen-giap');
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 375, height: 667 }]) {
    const name = `${viewport.width}x${viewport.height}`;
    const context = await browser.newContext({ viewport, serviceWorkers: 'block', reducedMotion: 'reduce' });
    const page = await context.newPage(); activePage = page;
    const pageErrors = []; page.on('pageerror', e => pageErrors.push(e.message));
    await page.goto(`${base}/play/${main.databaseId}`);
    await page.locator('#scene-question-title:visible').waitFor({ timeout: 45000 });
    const question = await page.locator('#scene-question-title:visible').textContent();
    await page.locator('.answer-option').nth(1).click();
    const boardScroll = await page.evaluate(() => scrollY);
    await check(`${name}: layout, published starters and exact answer without source UI`, async () => {
      await openFirst(page); await assertFrame(page, viewport.width, viewport.height);
      assert.equal(await page.locator('.chat-starters .chat-suggestions button:visible').count(), 3);
      const response = await send(page, fixture.question.canonicalQuestion);
      assert.equal(response.answer, main.answer);
      assert.equal(await page.locator('.chat-message.assistant .chat-message-text').last().textContent(), main.answer);
      assert.equal(await page.locator('.chat-starters-toggle').getAttribute('aria-expanded'), 'false');
      await expect(page.locator('details.chat-source')).toHaveCount(0);
      await bottom(page);
    });
    await check(`${name}: read older history without jumping, new-message button, reopen preserves scroll`, async () => {
      for (let i = 0; i < 3; i++) await send(page, fixture.question.canonicalQuestion);
      let release; const delayed = new Promise(resolve => { release = resolve; });
      await page.route('**/api/chat', async route => { await delayed; await route.fulfill({ json: { status: 'answered', characterId: main.characterId, questionId: fixture.question.questionId, answer: main.answer, source: { document: 'Tong-hop-kien-thuc.docx', sectionId: 'IV.2' } } }); });
      await input(page).fill(fixture.question.canonicalQuestion); await input(page).press('Enter');
      await expect(page.locator('.chat-loading')).toBeVisible();
      assert.equal(await input(page).evaluate(e => document.activeElement === e), true);
      await log(page).evaluate(e => { e.scrollTop = 30; });
      await expect(page.locator('.chat-jump')).toBeVisible();
      const oldTop = await log(page).evaluate(e => e.scrollTop);
      release(); await idle(page); await expect(page.getByRole('button', { name: 'Tin nhắn mới' })).toBeVisible();
      assert.ok(Math.abs(await log(page).evaluate(e => e.scrollTop) - oldTop) < 2);
      await page.getByRole('button', { name: 'Tin nhắn mới' }).click(); await bottom(page);
      await log(page).evaluate(e => { e.scrollTop = 35; }); await expect(page.locator('.chat-jump')).toBeVisible();
      await page.getByRole('button', { name: 'Đóng trò chuyện', exact: true }).click();
      assert.ok(Math.abs(await page.evaluate(() => scrollY) - boardScroll) < 2);
      assert.equal(await page.locator('#scene-question-title:visible').textContent(), question);
      assert.ok(await page.locator('input[name="answer"]').nth(1).isChecked());
      await page.locator('.character-chat-launcher:visible').click();
      assert.ok(Math.abs(await log(page).evaluate(e => e.scrollTop) - 35) < 2);
      await page.locator('.chat-jump').click(); await bottom(page);
      await page.unroute('**/api/chat');
    });
    await check(`${name}: network failure, manual retry once, suggestion retry retains questionId`, async () => {
      await page.route('**/api/chat', route => route.abort('failed'));
      const count = await page.locator('.chat-message.user').count();
      await input(page).fill(fixture.question.canonicalQuestion); await input(page).press('Enter');
      await expect(page.getByRole('button', { name: 'Thử gửi lại' })).toBeEnabled();
      assert.equal(await page.locator('.chat-message.user').count(), count + 1);
      await page.unroute('**/api/chat');
      let requests = 0;
      await page.route('**/api/chat', async route => { requests++; await new Promise(r => setTimeout(r, 250)); await route.continue(); });
      await page.getByRole('button', { name: 'Thử gửi lại' }).click(); await page.keyboard.press('Enter'); await idle(page);
      await expect(page.locator('.chat-send-failed')).toHaveCount(0); assert.equal(requests, 1);
      assert.equal(await page.locator('.chat-message.user').count(), count + 1); await page.unroute('**/api/chat');
      await log(page).evaluate(e => { e.scrollTop = 0; });
      await page.locator('.chat-starters-toggle').click();
      await page.route('**/api/chat/answer', route => route.fulfill({ status: 503, json: { code: 'CHAT_UNAVAILABLE' } }));
      await page.locator('.chat-starters .chat-suggestions button').first().click();
      await expect(page.getByRole('button', { name: 'Thử gửi lại' })).toBeEnabled();
      const suggestionCount = await page.locator('.chat-message.user').count();
      await page.unroute('**/api/chat/answer');
      const selected = page.waitForResponse(r => r.url().endsWith('/api/chat/answer'));
      await page.getByRole('button', { name: 'Thử gửi lại' }).click();
      const response = await selected; assert.equal(response.status(), 200);
      assert.ok(response.request().postDataJSON().questionId); await idle(page);
      assert.equal(await page.locator('.chat-message.user').count(), suggestionCount);
    });
    await check(`${name}: IME, Shift+Enter, offline, rate limit and expired session`, async () => {
      let submitted = 0;
      await page.route('**/api/chat', route => { submitted++; return route.fulfill({ status: 429, headers: { 'Retry-After': '1' }, json: { code: 'RATE_LIMITED' } }); });
      await input(page).fill('Tiếng Việt');
      await input(page).dispatchEvent('compositionstart'); await input(page).press('Enter'); assert.equal(submitted, 0);
      await input(page).dispatchEvent('compositionend'); await input(page).press('Shift+Enter'); assert.ok((await input(page).inputValue()).includes('\n'));
      await input(page).press('Enter'); await expect(page.getByRole('button', { name: 'Thử gửi lại' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Thử gửi lại' })).toBeEnabled({ timeout: 5000 }); assert.equal(submitted, 1);
      await context.setOffline(true); await expect(input(page)).toBeDisabled(); await expect(page.getByText('Trò chuyện cần kết nối mạng.', { exact: false })).toBeVisible();
      await context.setOffline(false); await page.unroute('**/api/chat');
      await page.route('**/api/chat', route => route.fulfill({ status: 401, json: { code: 'INVALID_SESSION' } }));
      await page.getByRole('button', { name: 'Thử gửi lại' }).click();
      await expect(page.getByRole('link', { name: 'Quét lại mã QR' })).toBeVisible(); await expect(input(page)).toBeDisabled();
      await page.unroute('**/api/chat');
    });
    await page.screenshot({ path: `${folder}/${name}-error.png` });
    // Fresh mount for an unobstructed demo screenshot and keyboard geometry.
    await page.getByRole('button', { name: 'Đóng trò chuyện', exact: true }).click();
    await page.reload(); await page.locator('#scene-question-title:visible').waitFor(); await openFirst(page);
    await send(page, fixture.question.canonicalQuestion);
    await page.screenshot({ path: `${folder}/${name}.png` });
    if (viewport.width < 640) await check(`${name}: virtual viewport keyboard resize/offset, focus trap and scroll restoration`, async () => {
      await input(page).focus();
      await page.evaluate(() => { Object.defineProperty(visualViewport, 'height', { configurable: true, value: 350 }); Object.defineProperty(visualViewport, 'offsetTop', { configurable: true, value: 24 }); visualViewport.dispatchEvent(new Event('resize')); });
      const panel = await page.locator('.character-chat-panel').boundingBox(), composer = await page.locator('.character-chat-composer').boundingBox();
      assert.equal(Math.round(panel.y), 24); assert.equal(Math.round(panel.height), 350); assert.ok(composer.y + composer.height <= 375);
      assert.ok((await log(page).boundingBox()).height > 20);
      await page.screenshot({ path: `${folder}/${name}-keyboard-simulation.png` });
      await context.setOffline(true);
      await expect(page.getByText('Trò chuyện cần kết nối mạng.', { exact: false })).toBeVisible();
      const offlineComposer = await page.locator('.character-chat-composer').boundingBox();
      assert.ok(offlineComposer.y + offlineComposer.height <= 375);
      assert.ok((await log(page).boundingBox()).height > 0);
      await context.setOffline(false);
      await page.evaluate(() => { delete visualViewport.height; delete visualViewport.offsetTop; visualViewport.dispatchEvent(new Event('resize')); });
      await page.getByRole('button', { name: 'Đóng trò chuyện', exact: true }).focus(); await page.keyboard.press('Shift+Tab');
      assert.ok(await page.locator('.character-chat-panel').evaluate(e => e.contains(document.activeElement)));
      await page.keyboard.press('Escape'); await expect(page.locator('.character-chat-panel')).toHaveCount(0);
      assert.notEqual(await page.evaluate(() => document.body.style.position), 'fixed');
    });
    assert.deepEqual(pageErrors, []); await context.close();
  }
  for (const persona of fixture.personas.filter(p => p.characterId !== 'vo-nguyen-giap')) await check(`${persona.name}: responsive header and unchanged published persona`, async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    const page = await context.newPage(); activePage = page;
    await page.goto(`${base}/play/${persona.databaseId}`); await page.locator('.scene-question[aria-busy="false"]:visible').waitFor({ timeout: 45000 });
    await openFirst(page); assert.equal(await page.locator('.character-chat-panel header h2').textContent(), persona.name);
    assert.equal((await send(page, fixture.question.canonicalQuestion)).answer, persona.answer);
    await assertFrame(page, 390, 844); await context.close();
  });
} catch (error) { console.error(String(error)); process.exitCode = 1; }
finally { report.finishedAt = new Date().toISOString(); writeFileSync(`${folder}/browser-report.json`, JSON.stringify(report, null, 2)); await browser.close(); }
