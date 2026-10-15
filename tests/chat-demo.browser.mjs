// Real HTTP/browser checks against an explicitly started local demo server.
// Fixture is prepared read-only by scripts/prepare-chat-demo-fixture.ts.
// Creates ordinary expiring player/chat rounds only; never writes knowledge.
import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { chromium, expect } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QRCodeSVG } from "qrcode.react";
import sharp from "sharp";

const baseURL = process.env.CHAT_DEMO_URL || "http://localhost:3013";
if (!["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname)) throw new Error("Local demo server required");
const fixture = JSON.parse(readFileSync(".local/phase4-demo-fixture.json", "utf8"));
mkdirSync(".local/chat-demo", { recursive: true });
const report = { startedAt: new Date().toISOString(), baseURL, checks: [], limitations: ["QR image and pasted payload tested; physical camera not tested", "Expired-session UI uses injected HTTP 401; expiry validation tested by unit tests"] };
const browser = await chromium.launch({ channel: "msedge", headless: true });
let activePage;
async function check(name, work) {
  try { await work(); report.checks.push({ name, status: "passed" }); console.log("PASS", name); }
  catch (error) { report.checks.push({ name, status: "failed", error: String(error).slice(0, 1200) }); if (activePage) { await activePage.screenshot({ path: ".local/chat-demo/failure.png" }); writeFileSync(".local/chat-demo/failure.txt", await activePage.locator("body").innerText()); } throw error; }
}
async function enter(page, persona) {
  await page.goto(`${baseURL}/play`);
  await page.locator(".manual-qr summary").click();
  await page.locator(".manual-qr input").fill(`${baseURL}/play/${persona.databaseId}`);
  await page.locator(".manual-qr button").click();
  await ready(page);
  assert.equal(await page.locator(".scene-actor h1").textContent(), persona.name);
}
async function ready(page) { await page.locator('.scene-question[aria-busy="false"]:visible').waitFor({ timeout: 60000 }); }
async function open(page) {
  const response = page.waitForResponse(r => r.url().endsWith("/api/chat/suggestions"), { timeout: 45000 });
  void response.catch(() => {}); // Observe rejection if an earlier UI assertion fails.
  await page.locator(".character-chat-launcher:visible").click();
  const result = await response;
  assert.equal(result.status(), 200, await result.text());
  const starter = await result.json();
  assert.equal(starter.status, "suggest"); assert.equal(starter.suggestions.length, 3);
  starter.suggestions.forEach(item => assert.deepEqual(Object.keys(item).sort(), ["question", "questionId"]));
  await page.locator(".character-chat-composer textarea:enabled:not([readonly]):visible").waitFor();
  return result.request().postDataJSON().sessionId;
}
async function ask(page, text) {
  await page.locator(".character-chat-composer textarea").fill(text);
  const pending = page.waitForResponse(r => r.url().endsWith("/api/chat"));
  await page.locator(".character-chat-composer textarea").press("Enter");
  const result = await pending;
  assert.equal(result.status(), 200, await result.text());
  await page.locator(".character-chat-composer textarea:enabled:not([readonly])").waitFor();
  return result.json();
}
async function post(context, path, data) {
  return context.request.post(`${baseURL}${path}`, { data, headers: { Origin: baseURL } });
}
try {
  for (const [index, persona] of fixture.personas.entries()) {
    const context = await browser.newContext({ viewport: index === 1 ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, serviceWorkers: "block" });
    const page = await context.newPage();
    activePage = page;
    await check(`${persona.name}: QR character page, published starters, canonical and persona`, async () => {
      await enter(page, persona);
      const quiz = await page.locator(".question-speech h2").textContent();
      const sessionId = await open(page);
      const result = await ask(page, fixture.question.canonicalQuestion);
      assert.equal(result.status, "answered"); assert.equal(result.characterId, persona.characterId); assert.equal(result.answer, persona.answer);
      assert.equal(await page.locator(".question-speech h2").textContent(), quiz);
      assert.ok((await page.locator(".character-chat-log").textContent()).includes(persona.answer));
      if (index === 0) {
        await check("Exact alias, fuzzy suggestion, selection, refusal", async () => {
          assert.equal((await ask(page, fixture.question.aliases[0])).answer, persona.answer);
          const fuzzy = await ask(page, fixture.fuzzy); assert.equal(fuzzy.status, "suggest");
          const chosen = fuzzy.suggestions.find(item => item.questionId === fixture.question.questionId); assert.ok(chosen);
          const selected = page.waitForResponse(r => r.url().endsWith("/api/chat/answer"));
          await page.locator(".chat-message.assistant .chat-suggestions button").filter({ hasText: chosen.question }).click();
          assert.equal((await (await selected).json()).answer, persona.answer);
          assert.equal((await ask(page, "Hướng dẫn nấu bánh pizza phô mai?")).status, "out_of_scope");
        });
        await check("Reject invalid session, foreign owner, client persona and unpublished revision IDs", async () => {
          assert.equal((await post(context, "/api/chat", { sessionId: "00000000-0000-4000-8000-000000000001", message: fixture.question.canonicalQuestion })).status(), 401);
          assert.equal((await post(context, "/api/chat", { sessionId, message: fixture.question.canonicalQuestion, characterId: persona.databaseId })).status(), 400);
          const stranger = await browser.newContext();
          assert.equal((await post(stranger, "/api/chat", { sessionId, message: fixture.question.canonicalQuestion })).status(), 401); await stranger.close();
          for (const draft of fixture.unpublished.slice(0, 2)) {
            const response = await post(context, "/api/chat/answer", { sessionId, questionId: draft.revisionId });
            assert.ok([400, 200].includes(response.status()));
            if (response.status() === 200) assert.equal((await response.json()).status, "out_of_scope");
            const logical = await post(context, "/api/chat/answer", { sessionId, questionId: draft.questionId });
            assert.equal(logical.status(), 200);
            const answer = await logical.json();
            if (draft.publishedAnswer) assert.equal(answer.answer, draft.publishedAnswer);
            else assert.equal(answer.status, "out_of_scope");
          }
        });
        await check("Rapid Enter sends once; Shift+Enter inserts a newline", async () => {
          let count = 0;
          await page.route("**/api/chat", async route => { count++; await new Promise(resolve => setTimeout(resolve, 400)); await route.continue(); });
          const textarea = page.locator(".character-chat-composer textarea");
          await textarea.fill(fixture.question.canonicalQuestion);
          await textarea.press("Shift+Enter"); assert.ok((await textarea.inputValue()).includes("\n"));
          await textarea.press("Enter"); await page.keyboard.press("Enter"); await page.keyboard.press("Enter");
          await page.locator(".character-chat-composer textarea:enabled:not([readonly])").waitFor(); assert.equal(count, 1);
          await page.unroute("**/api/chat");
        });
        await check("Offline notice, recovery and service failure", async () => {
          await context.setOffline(true);
          await page.getByText("Trò chuyện cần kết nối mạng.", { exact: false }).waitFor();
          assert.equal(await page.locator(".character-chat-composer textarea").isDisabled(), true);
          await context.setOffline(false);
          await page.locator(".character-chat-composer textarea:enabled:not([readonly])").waitFor();
          await page.route("**/api/chat", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ code: "UNAVAILABLE", message: "internal error" }) }));
          await page.locator(".character-chat-composer textarea").fill("Thử kết nối"); await page.locator(".character-chat-composer textarea").press("Enter");
          await page.locator(".character-chat-notice").waitFor();
          assert.ok(!(await page.locator(".character-chat-notice").textContent()).includes("internal error"));
          await page.unroute("**/api/chat");
        });
      }
      await page.screenshot({ path: `.local/chat-demo/${index === 1 ? "mobile" : `desktop-${index}`}.png`, fullPage: false });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.locator('button[aria-label="Đóng trò chuyện"]').click();
      if (persona.quizCount > 0) {
        await page.locator(".answer-option").first().click();
        await page.locator(".confirm-answer").click();
        await page.locator(".answer-feedback").waitFor({ timeout: 30000 });
      } else report.limitations.push(`${persona.name}: no existing quiz questions; chat tested, quiz completion not available`);
      await check(`${persona.name}: refresh clears chat history`, async () => {
        await page.reload(); await ready(page); await open(page);
        assert.equal(await page.locator(".chat-message.user").count(), 0);
      });
    });
    if (index === 1) await check("Expired-session UI requires QR rescan", async () => {
      await page.route("**/api/chat", route => route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ code: "INVALID_SESSION", message: "expired" }) }));
      await page.locator(".character-chat-composer textarea").fill("Câu hỏi"); await page.locator(".character-chat-composer textarea").press("Enter");
      await page.getByRole("link", { name: "Quét lại mã QR" }).waitFor(); assert.ok(await page.locator(".character-chat-composer textarea").isDisabled());
    });
    if (index === 2) await check("Real API shared rate limit", async () => {
      const request = page.waitForRequest(r => r.url().endsWith("/api/chat"));
      await ask(page, fixture.question.canonicalQuestion); const sessionId = (await request).postDataJSON().sessionId;
      let limited = false;
      for (let i = 0; i < 25; i++) { const response = await post(context, "/api/chat", { sessionId, message: "Pizza?" }); if (response.status() === 429) { assert.ok(Number(response.headers()["retry-after"]) > 0); limited = true; break; } assert.equal(response.status(), 200); }
      assert.ok(limited);
      await page.locator(".character-chat-composer textarea").fill("Pizza?"); await page.locator(".character-chat-composer textarea").press("Enter");
      await page.locator(".character-chat-notice").waitFor(); assert.ok(await page.locator(".character-chat-composer textarea").isDisabled());
    });
    if (index === 3) await check("QR character switch resets chat and persona", async () => {
      await page.locator('button[aria-label="Đóng trò chuyện"]').click();
      await page.getByRole("button", { name: "Quét nhân vật tiếp" }).click();
      await page.locator(".manual-qr summary").click(); await page.locator(".manual-qr input").fill(fixture.personas[0].databaseId); await page.locator(".manual-qr button").click();
      await ready(page); await open(page);
      assert.equal(await page.locator(".chat-message.user").count(), 0);
      assert.equal((await ask(page, fixture.question.canonicalQuestion)).answer, fixture.personas[0].answer);
    });
    await context.close();
  }
  await check("Production PWA: QR image, cached quiz chat binding, offline quiz and chat recovery", async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage(); activePage = page;
    const persona = fixture.personas.find(p => p.quizCount > 0); assert.ok(persona);
    await page.goto(baseURL);
    await expect.poll(() => page.evaluate(async () => !!navigator.serviceWorker.controller && (await fetch('/__offline/pack')).ok), { timeout: 180000, intervals: [2000] }).toBe(true);
    const qr = await sharp(Buffer.from(renderToStaticMarkup(createElement(QRCodeSVG, { value: `${baseURL}/play/${persona.databaseId}`, size: 480, marginSize: 4 })))).png().toBuffer();
    await page.goto(`${baseURL}/play`);
    await page.locator('input[type="file"]').setInputFiles({ name: "character-qr.png", mimeType: "image/png", buffer: qr });
    await ready(page); await page.locator("#scene-question-title").waitFor();
    // Offline pack supplies this quiz; no server quiz action/cookie is needed.
    assert.equal((await context.cookies()).some(c => c.name === "history_player"), false);
    await open(page);
    assert.ok((await context.cookies()).some(c => c.name === "history_player"));
    assert.equal((await ask(page, fixture.question.canonicalQuestion)).answer, persona.answer);
    await page.screenshot({ path: ".local/chat-demo/mobile-cached-quiz.png" });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await context.setOffline(true);
    await page.getByText("Trò chuyện cần kết nối mạng.", { exact: false }).waitFor();
    await page.locator('button[aria-label="Đóng trò chuyện"]').click();
    await page.locator(".answer-option").first().click(); await page.locator(".confirm-answer").click();
    await page.locator(".answer-feedback").waitFor();
    await page.getByRole("button", { name: "Quét nhân vật tiếp" }).click();
    await page.locator('input[type="file"]').setInputFiles({ name: "character-qr.png", mimeType: "image/png", buffer: qr });
    await ready(page); await page.locator("#scene-question-title").waitFor();
    await page.locator(".character-chat-launcher:visible").click();
    await page.getByText("Trò chuyện cần kết nối mạng.", { exact: false }).waitFor();
    await context.setOffline(false);
    await page.reload(); await ready(page); await open(page);
    assert.equal((await ask(page, fixture.question.canonicalQuestion)).answer, persona.answer);
    await context.close();
  });
} catch (error) { console.error(String(error)); process.exitCode = 1; }
finally { report.finishedAt = new Date().toISOString(); writeFileSync(".local/chat-demo/browser-report.json", JSON.stringify(report, null, 2)); await browser.close(); }
