// Requires the isolated development server launched with --quota-zero.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const folder = '.local/chat-phase-5c2', base = 'http://localhost:3014';
const fixture = JSON.parse(readFileSync(`${folder}/fixture.json`, 'utf8'));
const persona = fixture.personas.find(p => p.characterId === 'vo-nguyen-giap');
const count = () => JSON.parse(readFileSync(`${folder}/generation-ledger.json`, 'utf8')).calls;
const before = count(), report = { cases: [], callsBefore: before, quotaPerDay: 0 };
if (before !== 9 || existsSync(`${folder}/fallback-report.json`)) throw new Error('Unexpected diagnostic state; no automatic replay');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage(); page.setDefaultTimeout(60000);
  await page.goto(`${base}/play/${persona.databaseId}`, { waitUntil: 'domcontentloaded' });
  await page.locator('.scene-question[aria-busy="false"]:visible').waitFor();
  const ready = page.waitForResponse(r => r.url().endsWith('/api/chat/suggestions'));
  await page.locator('.character-chat-launcher:visible').click(); assert.equal((await ready).status(), 200);
  for (const [label, message, expected] of [
    ['cache_survives_zero_quota', 'Cháu muốn biết cuộc khởi nghĩa tại Hà Nội đã thắng lợi vào ngày nào?', 'suggest'],
    ['unaccented_alias_fallback', 'Ngay thang loi cua khoi nghia o Ha Noi thang 8/1945 la ngay nao?', 'suggest'],
    ['unaccented_paraphrase_refusal', 'Ngay nao nguoi dan Ha Noi gianh chinh quyen thanh cong?', 'out_of_scope'],
    ['typo_refusal', 'Cuộc khởi ngĩa ở Hà Nọi đã thắg lợi vào ngày nào ạ?', 'out_of_scope'],
    ['unrelated_refusal', 'Cách làm bánh pizza phô mai?', 'out_of_scope'],
    ['saigon_fallback_refusal', 'Còn tại Sài Gòn, nhân dân giành chính quyền thắng lợi ngày mấy?', 'out_of_scope'],
    ['multi_location_refusal', 'Hà Nội và Huế cùng giành chính quyền vào một ngày phải không?', 'out_of_scope'],
    ['wrong_date_refusal', 'Khởi nghĩa Hà Nội thắng lợi ngày 23/8/1945 đúng không?', 'out_of_scope'],
  ]) {
    const input = page.locator('.character-chat-composer textarea:enabled:not([readonly]):visible');
    await input.waitFor(); await input.fill(message);
    const pending = page.waitForResponse(r => r.url().endsWith('/api/chat'));
    await input.press('Enter');
    const response = await pending, body = await response.json();
    const row = { label, httpStatus: response.status(), status: body.status, generationCalls: count() - before };
    report.cases.push(row);
    assert.equal(response.status(), 200); assert.equal(body.status, expected); assert.equal(count(), before);
    if (expected === 'out_of_scope') { assert.equal(body.answer, persona.refusalText); row.staticRefusalVerified = true; }
    else {
      assert.equal('answer' in body, false); assert.equal(body.suggestions[0].questionId, 'cmtt45-q017');
      const selected = page.waitForResponse(r => r.url().endsWith('/api/chat/answer'));
      await page.locator('.chat-message.assistant .chat-suggestions').last().locator('button').first().click();
      assert.equal((await (await selected).json()).answer, persona.answers['cmtt45-q017']); row.storedAnswerVerified = true;
    }
    row.passed = true; console.log('PASS', label);
  }
} catch { report.failed = true; process.exitCode = 1; console.error('Controlled fallback test failed'); }
finally { report.callsAfter = count(); writeFileSync(`${folder}/fallback-report.json`, JSON.stringify(report, null, 2)); await browser.close(); }
