// Development-only demonstration. Uses the separate 5C.2 server-side ten-call ledger.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QRCodeSVG } from 'qrcode.react';
import sharp from 'sharp';
const base = 'http://localhost:3014', folder = '.local/chat-phase-5c2';
const fixture = JSON.parse(readFileSync(`${folder}/fixture.json`, 'utf8'));
const count = () => JSON.parse(readFileSync(`${folder}/generation-ledger.json`, 'utf8')).calls;
const events = () => existsSync(`${folder}/generation-events.jsonl`) ? readFileSync(`${folder}/generation-events.jsonl`, 'utf8').trim().split('\n').filter(Boolean).map(s => JSON.parse(s)) : [];
const resume = process.argv.includes('--resume-rest') ? 2 : process.argv.includes('--resume') ? 1 : 0;
const reportFile = `${folder}/${resume === 2 ? 'browser-rest-report' : resume ? 'browser-resume-report' : 'browser-report'}.json`;
if (existsSync(reportFile)) throw new Error('This run already has a report; do not replay automatically');
if (resume && (!existsSync(`${folder}/browser-report.json`) || count() !== (resume === 2 ? 6 : 5))) throw new Error('Unexpected continuation state');
const report = { startedAt: new Date().toISOString(), checks: [], cases: [], quizStates: [], callsBefore: count() };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const paraphrase = 'Cháu muốn biết cuộc khởi nghĩa tại Hà Nội đã thắng lợi vào ngày nào?';
let page, quiz;
async function check(name, work) {
  try { await work(); report.checks.push({ name, status: 'passed' }); console.log('PASS', name); }
  catch { report.checks.push({ name, status: 'failed' }); console.log('FAIL', name); }
}
async function ask(text, label, persona, expectedId, noGeneration = false) {
  const before = count(), start = performance.now();
  const input = page.locator('.character-chat-composer textarea:enabled:not([readonly]):visible');
  await input.waitFor({ timeout: 60000 }); await input.fill(text);
  const pending = page.waitForResponse(r => r.url().endsWith('/api/chat'), { timeout: 60000 });
  await input.press('Enter');
  const response = await pending;
  const body = await response.json();
  await input.waitFor({ timeout: 60000 });
  const row = { label, persona: persona.characterId, input: text, httpStatus: response.status(), status: body.status,
    suggestions: body.suggestions?.map(s => s.questionId), generationCalls: count() - before,
    latencyMs: Math.round(performance.now() - start), events: events().filter(e => e.call > before) };
  report.cases.push(row);
  assert.equal(response.status(), 200);
  assert.ok(count() <= 10);
  if (noGeneration) assert.equal(count(), before);
  if (body.status === 'answered') {
    assert.equal(count(), before, 'Gemini may never answer automatically');
    assert.ok(expectedId); assert.equal(body.answer, persona.answers[expectedId]); row.storedAnswerVerified = true;
  } else if (body.status === 'out_of_scope') {
    assert.equal(body.answer, persona.refusalText); row.staticRefusalVerified = true;
  } else assert.equal('answer' in body, false);
  for (const item of body.suggestions || []) assert.ok(fixture.publishedIds.includes(item.questionId));
  if (expectedId && body.status !== 'answered') {
    assert.equal(body.status, 'suggest'); assert.equal(body.suggestions[0].questionId, expectedId);
    const pendingAnswer = page.waitForResponse(r => r.url().endsWith('/api/chat/answer'), { timeout: 60000 });
    await page.locator('.chat-message.assistant .chat-suggestions').last().locator('button').first().click();
    const answer = await (await pendingAnswer).json();
    assert.equal(answer.status, 'answered'); assert.equal(answer.answer, persona.answers[expectedId]);
    assert.equal(answer.characterId, persona.characterId); row.storedAnswerAfterClickVerified = true;
  }
  assert.equal(await page.locator('.question-speech h2').textContent(), quiz);
  return body;
}
try {
  // First persona has real quiz data. Others intentionally exercise the existing empty-bank state too.
  const personas = [...fixture.personas].sort((a, b) => b.quizCount - a.quizCount);
  for (const [i, persona] of personas.entries()) {
    if (i < resume) continue; // Preserve earlier reports; never repeat their generation calls.
    console.log('ENTER', persona.characterId);
    const context = await browser.newContext({ viewport: i % 2 ? { width: 390, height: 844 } : { width: 1440, height: 900 }, serviceWorkers: 'block' });
    page = await context.newPage(); page.setDefaultTimeout(60000);
    await page.goto(`${base}/play`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Chọn ảnh QR', { exact: true }).waitFor();
    await page.waitForTimeout(1000); // Let development Strict Mode mount/cleanup settle before file input.
    const png = await sharp(Buffer.from(renderToStaticMarkup(createElement(QRCodeSVG, { value: `${base}/play/${persona.databaseId}`, size: 480, marginSize: 4 })))).png().toBuffer();
    await page.getByLabel('Chọn ảnh QR', { exact: true }).setInputFiles({ name: 'character.png', mimeType: 'image/png', buffer: png });
    await page.locator('.scene-question[aria-busy="false"]:visible').waitFor();
    quiz = await page.locator('.question-speech h2').textContent();
    const answerOptions = await page.locator('.answer-option').count();
    report.quizStates.push({ persona: persona.characterId, quizCountInDatabase: persona.quizCount, answerOptions, actualQuizReady: answerOptions === 4 });
    await check(`${persona.characterId}: QR PNG -> correct character -> popup`, async () => {
      assert.equal(await page.locator('.scene-actor h1').textContent(), persona.name);
      const pending = page.waitForResponse(r => r.url().endsWith('/api/chat/suggestions'));
      await page.locator('.character-chat-launcher:visible').click();
      const response = await pending; assert.equal(response.status(), 200);
      const starters = await response.json(); assert.equal(starters.suggestions.length, 3);
      starters.suggestions.forEach(s => assert.ok(fixture.publishedIds.includes(s.questionId)));
    });
    const q = fixture.questions.find(q => q.questionId === 'cmtt45-q017');
    await check(`${persona.characterId}: exact`, () => ask(q.canonicalQuestion, 'exact', persona, q.questionId, true));
    await check(`${persona.characterId}: alias`, () => ask(q.aliases[0], 'alias', persona, q.questionId, true));
    await check(`${persona.characterId}: paraphrase and shared cache`, () => ask(paraphrase, i ? 'cached_paraphrase' : 'paraphrase', persona, q.questionId, i > 0));
    if (i === 0) {
      await check('unaccented alias selects Hanoi', () => ask(q.aliases[0].normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D'), 'unaccented_alias', persona, q.questionId));
      await check('unaccented paraphrase selects Hanoi', () => ask('Ngay nao nguoi dan Ha Noi gianh chinh quyen thanh cong?', 'unaccented_paraphrase', persona, q.questionId));
      await check('misspelled question selects Hanoi', () => ask('Cuộc khởi ngĩa ở Hà Nọi đã thắg lợi vào ngày nào ạ?', 'typo', persona, q.questionId));
      await check('unrelated question refused', async () => assert.equal((await ask('Cách làm bánh pizza phô mai?', 'out_of_scope', persona)).status, 'out_of_scope'));
    }
    if (i === 1) {
      await check('Hue does not select Hanoi', () => ask('Bác cho cháu hỏi, ở Huế cuộc khởi nghĩa thành công vào hôm nào?', 'hue', persona, 'cmtt45-q018'));
    }
    if (i === 2) {
      // Respect the configured five-per-minute shared quota without increasing/resetting it.
      if (!resume) {
        console.log('Waiting 61 seconds across two short waits before the next live batch');
        await page.waitForTimeout(30000); await page.waitForTimeout(31000);
      }
      await check('Saigon does not select Hanoi or Hue', () => ask('Còn tại Sài Gòn, nhân dân giành chính quyền thắng lợi ngày mấy?', 'saigon', persona, 'cmtt45-q019'));
      await check('multiple locations not automatically answered', async () => assert.notEqual((await ask('Hà Nội và Huế cùng giành chính quyền vào một ngày phải không?', 'multi_location', persona)).status, 'answered'));
    }
    if (i === 3) {
      await check('incorrect Hanoi date not automatically answered', async () => assert.notEqual((await ask('Khởi nghĩa Hà Nội thắng lợi ngày 23/8/1945 đúng không?', 'wrong_date', persona)).status, 'answered'));
      await check('network failure -> manual retry -> stored exact answer', async () => {
        const before = count();
        await page.route('**/api/chat', route => route.abort('failed'));
        const input = page.locator('.character-chat-composer textarea:enabled:not([readonly]):visible');
        await input.fill(q.canonicalQuestion); await input.press('Enter');
        await page.getByRole('button', { name: 'Thử gửi lại' }).waitFor();
        await page.unroute('**/api/chat');
        const pending = page.waitForResponse(r => r.url().endsWith('/api/chat'));
        await page.getByRole('button', { name: 'Thử gửi lại' }).click();
        const response = await pending; assert.equal((await response.json()).answer, persona.answers[q.questionId]);
        assert.equal(count(), before);
      });
    }
    await check(`${persona.characterId}: close/reopen preserves quiz and chat`, async () => {
      const messages = await page.locator('.chat-message.user').count();
      await page.locator('button[aria-label="Đóng trò chuyện"]').click();
      assert.equal(await page.locator('.question-speech h2').textContent(), quiz);
      await page.locator('.character-chat-launcher:visible').click();
      assert.equal(await page.locator('.chat-message.user').count(), messages);
      await expect(page.locator('details.chat-source')).toHaveCount(0);
    });
    await page.screenshot({ path: `${folder}/demo-${persona.characterId}.png` });
    await context.close();
  }
} catch (error) {
  report.fatal = true; report.failure = { name: error.name, message: error.message.slice(0, 600) };
  if (page && !page.isClosed()) await page.screenshot({ path: `${folder}/flow-failure.png` }).catch(() => {});
  console.error('Browser flow interrupted; inspect sanitized report.'); process.exitCode = 1;
}
finally {
  report.callsAfter = count(); report.generationEvents = events(); report.finishedAt = new Date().toISOString();
  writeFileSync(reportFile, JSON.stringify(report, null, 2));
  await browser.close();
  if (report.checks.some(c => c.status === 'failed')) process.exitCode = 1;
}
