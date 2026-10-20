// Run ONLY against the consented local server started with the Phase 5C.1 budget preloader.
// Two live cache misses maximum. The preloader enforces the whole diagnostic budget of five.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';

const base = 'http://localhost:3013';
const folder = '.local/chat-phase-5c1';
const fixture = JSON.parse(readFileSync('.local/phase4-demo-fixture.json', 'utf8'));
const count = () => JSON.parse(readFileSync(`${folder}/generation-ledger.json`, 'utf8')).calls;
const events = () => existsSync(`${folder}/e2e-generation.jsonl`) ? readFileSync(`${folder}/e2e-generation.jsonl`, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line)) : [];
if (JSON.parse(readFileSync(`${folder}/matching.json`, 'utf8')).status !== 'passed') throw new Error('Matching must pass first');
if (count() !== 3) throw new Error('Expected precisely three diagnostic calls before E2E; never replay automatically');
const report = { startedAt: new Date().toISOString(), checks: [], generationCallsBefore: count() };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const question = 'Hà Nội khởi nghĩa thắng lợi vào hôm nào vậy?';
let activePage;
async function check(name, operation) {
  try { await operation(); report.checks.push({ name, status: 'passed' }); console.log('PASS', name); }
  catch { report.checks.push({ name, status: 'failed' }); throw new Error(`Failed controlled check: ${name}`); }
}
async function ask(page, message) {
  const input = page.locator('.character-chat-composer textarea:visible');
  await expect(input).toBeEnabled(); await expect(input).not.toHaveAttribute('readonly', '');
  await input.fill(message);
  const pending = page.waitForResponse(r => r.url().endsWith('/api/chat'), { timeout: 30000 });
  await input.press('Enter');
  const response = await pending; assert.equal(response.status(), 200);
  await expect(input).not.toHaveAttribute('readonly', ''); return response.json();
}
try {
  for (const [i, persona] of fixture.personas.entries()) {
    const context = await browser.newContext({ viewport: i === 1 ? { width: 390, height: 844 } : { width: 1440, height: 900 }, serviceWorkers: 'block' });
    const page = await context.newPage(); activePage = page;
    await page.goto(`${base}/play/${persona.databaseId}`);
    await page.locator('.scene-question[aria-busy="false"]:visible').waitFor({ timeout: 60000 });
    const quiz = await page.locator('.question-speech h2').textContent();
    const starter = page.waitForResponse(r => r.url().endsWith('/api/chat/suggestions'));
    await page.locator('.character-chat-launcher:visible').click();
    assert.equal((await starter).status(), 200);
    await check(`${persona.characterId}: exact and alias bypass Gemini`, async () => {
      const before = count();
      for (const message of [fixture.question.canonicalQuestion, fixture.question.aliases[0]]) {
        const response = await ask(page, message);
        assert.equal(response.status, 'answered'); assert.equal(response.answer, persona.answer); assert.equal(response.characterId, persona.characterId);
      }
      assert.equal(count(), before);
    });
    await check(`${persona.characterId}: Hanoi suggestion -> clicked stored persona answer`, async () => {
      const response = await ask(page, question);
      assert.equal(response.status, 'suggest'); assert.equal(response.suggestions[0].questionId, 'cmtt45-q017');
      assert.equal('answer' in response, false);
      if (i === 0) {
        assert.equal(count(), 4); assert.equal(events()[0]?.decision, 'match'); assert.equal(events()[0]?.questionId, 'cmtt45-q017');
      } else assert.equal(count(), 4, 'Shared cache must avoid repeat generation for other personas');
      const answerResponse = page.waitForResponse(r => r.url().endsWith('/api/chat/answer'));
      await page.locator('.chat-message.assistant .chat-suggestions').last().locator('button').first().click();
      const selected = await (await answerResponse).json();
      assert.equal(selected.status, 'answered'); assert.equal(selected.answer, persona.answer); assert.equal(selected.characterId, persona.characterId);
      assert.equal(await page.locator('.question-speech h2').textContent(), quiz);
      await expect(page.locator('details.chat-source')).toHaveCount(0);
    });
    if (i === fixture.personas.length - 1) {
      await check('unrelated out_of_scope has no candidate and no generation', async () => {
        const before = count();
        assert.equal((await ask(page, 'Hướng dẫn nấu bánh pizza phô mai?')).status, 'out_of_scope');
        assert.equal(count(), before);
      });
      await check('live multi-intent no_match falls back without generated answer', async () => {
        const response = await ask(page, 'Hà Nội giành chính quyền và dự báo thời tiết ngày mai thế nào?');
        assert.equal(count(), 5); assert.equal(events()[1]?.decision, 'no_match');
        assert.notEqual(response.status, 'answered');
        assert.ok(['out_of_scope', 'suggest'].includes(response.status));
      });
      await check('shared Gemini quota exhausted -> legacy fallback, no sixth call', async () => {
        const response = await ask(page, 'Cho cháu biết thời điểm khởi nghĩa thắng lợi ở Sài Gòn nhé?');
        assert.notEqual(response.status, 'answered'); assert.equal(count(), 5);
        assert.equal(events().length, 2);
      });
      await page.screenshot({ path: `${folder}/e2e-desktop.png` });
    }
    await context.close();
  }
} catch (error) {
  report.failed = true;
  if (activePage && !activePage.isClosed()) await activePage.screenshot({ path: `${folder}/e2e-failure.png` });
  console.error(error.message); process.exitCode = 1;
} finally {
  report.generationCallsAfter = count(); report.generationEvents = events();
  writeFileSync(`${folder}/e2e.json`, JSON.stringify(report, null, 2)); await browser.close();
}
