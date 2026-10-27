// Isolated browser/build verification. No environment files, database or live AI.
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import net from 'node:net';
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';

const root = process.cwd(), mode = process.argv[2];
if (!['browser', 'build'].includes(mode)) throw Error('Use browser or build');
const ttsCleanup = process.argv.includes('--tts0');
const audioPlayback = process.argv.includes('--audio');
const folder = path.join(root, audioPlayback ? '.local/quiz-audio-playback' : ttsCleanup ? '.local/tts-phase-0' : '.local/game-chat-access');
fs.mkdirSync(folder, { recursive: true });
const workspace = path.join(folder, `${mode}-${Date.now()}`);
fs.mkdirSync(workspace);
for (const dir of ['actions', 'app', 'components', 'data', 'features', 'hooks', 'server', 'lib', 'public', 'knowledge', 'docs/source', 'scripts', 'tests', 'types']) {
  if (fs.existsSync(path.join(root, dir))) fs.cpSync(path.join(root, dir), path.join(workspace, dir), { recursive: true });
}
for (const name of fs.readdirSync(root).filter(name => /^(?:package(?:-lock)?\.json|tsconfig\.json|next-env\.d\.ts|next\.config\..+|postcss\.config\..+|eslint\.config\..+|proxy\.[jt]s)$/.test(name))) fs.copyFileSync(path.join(root, name), path.join(workspace, name));
fs.symlinkSync(path.join(root, 'node_modules'), path.join(workspace, 'node_modules'), 'junction');
const guard = pathToFileURL(path.join(root, 'scripts/support/chat-history-offline-guard.mjs')).href;
const env = { ...process.env, MONGODB_URI: '', MONGODB_TEST_URI: '', GEMINI_API_KEY: '', CHAT_AI_MATCHING_ENABLED: 'false', KNOWLEDGE_GENERATION_ENABLED: 'false', TTSFORFREE_API_KEY: '', TTSFORFREE_ENABLED: 'false', FPT_TTS_API_KEY: '', FPT_TTS_ENABLED: 'false', NODE_OPTIONS: `--import=${guard}` };
const write = (file, text) => { const target = path.join(workspace, file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, text); };
if (mode === 'build') {
  // Execute the actual npm script, including PWA asset generation, in the copy.
  const result = spawnSync(process.platform === 'win32' ? 'cmd.exe' : 'npm', process.platform === 'win32' ? ['/d', '/s', '/c', 'npm run build'] : ['run', 'build'], { cwd: workspace, env, encoding: 'utf8', maxBuffer: 12 * 1024 * 1024, windowsHide: true });
  fs.writeFileSync(path.join(folder, 'build.log'), (result.stdout || '') + (result.stderr || ''));
  fs.writeFileSync(path.join(folder, 'build.json'), JSON.stringify({ exitCode: result.status, workspace, generationCalls: 0, databaseConnections: 0 }, null, 2));
  console.log(result.stdout, result.stderr); process.exitCode = result.status ?? 1;
} else {
  // Only the COPY has transport/PWA-context fixtures. Actual GamePlayer,
  // CharacterChat, local grading, viewport hook and CSS run unchanged.
  write('actions/quiz.ts', `export async function startQuizAction(characterId:string, requestId:string) { return (await fetch('/__test/start', {method:'POST',body:JSON.stringify({characterId,requestId})})).json(); }
export async function answerQuizAction(id:string,index:number) { return (await fetch('/__test/answer',{method:'POST',body:JSON.stringify({id,index})})).json(); }`);
  write('features/pwa/pwa-provider.tsx', `"use client";
import {createContext,useContext} from 'react';
export const TestPack = createContext({pack:null});
export const usePwa = () => useContext(TestPack);
export default function PwaProvider({children}:{children:React.ReactNode}) {return children;}`);
  write('app/layout.tsx', `import './globals.css'; import './heritage.css'; export default function Layout({children}:{children:React.ReactNode}) {return <html lang="vi"><body>{children}</body></html>;}`);
  write('app/chat-access-fixture/page.tsx', `"use client";
import {useState} from 'react'; import GamePlayer from '@/features/game/game-player'; import {TestPack} from '@/features/pwa/pwa-provider'; import '@/app/play/play.css'; import '@/features/game/character-stage.css';
const names=['Võ Nguyên Giáp','Trường Chinh','Lê Duẩn','Phạm Văn Đồng'];
export default function Page(){const [round,setRound]=useState(0),[persona,setPersona]=useState(0),[local,setLocal]=useState(false),[audio,setAudio]=useState(false);
const character={id:String(persona+1).repeat(24),name:names[persona],image:'/pwa/icon-192.png',backgroundImage:'/images/history-landscape.webp',openingLine:'Lời chào fixture',createdAt:'',updatedAt:''};
const pack=local?{characters:[character],questions:[{id:'local-question',characterId:character.id,question:'Câu hỏi fixture offline?',answers:['A','B','C','D'],correctIndex:0,correctFeedback:'Đúng fixture',incorrectFeedback:'Sai fixture',...(audio?{audio:{prompt:['/fixture/q.mp3','/fixture/a.mp3'],correct:['/fixture/right.mp3'],incorrect:['/fixture/wrong.mp3']}}:{})}]}:null;
return <><div><button onClick={()=>setRound(n=>n+1)}>Lượt mới fixture</button><button onClick={()=>{setPersona(n=>(n+1)%4);setRound(n=>n+1)}}>Nhân vật mới fixture</button><button onClick={()=>{setLocal(true);setRound(n=>n+1)}}>Offline fixture</button>${audioPlayback ? '<button onClick={()=>setAudio(true)}>Bổ sung audio fixture</button>' : ''}</div>
<TestPack.Provider value={{pack}}><GamePlayer key={round} character={character} openChatSessionAction={async requestId=>(await fetch('/__test/binding',{method:'POST',body:JSON.stringify({requestId})})).json()} /></TestPack.Provider></>}`);
  const port = await new Promise(resolve => { const socket = net.createServer(); socket.listen(0, '127.0.0.1', () => { const value = socket.address().port; socket.close(() => resolve(value)); }); });
  const base = `http://localhost:${port}`, log = fs.openSync(path.join(folder, 'browser-server.log'), 'w');
  const server = spawn(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'dev', '--webpack', '--port', String(port)], { cwd: workspace, env, stdio: ['ignore', log, log], windowsHide: true });
  let browser;
  const report = { checks: [], generationCalls: 0, databaseConnections: 0, transport: 'mocked in isolated copy', screenshots: [] };
  async function check(name, run) { await run(); report.checks.push({ name, status: 'pass' }); console.log('PASS', name); }
  try {
    let ready = false;
    for (let n = 0; n < 120; n++) { if (server.exitCode !== null) throw Error('Server exited'); try { if ((await fetch(base + '/chat-access-fixture')).ok) { ready = true; break; } } catch {} await new Promise(resolve => setTimeout(resolve, 500)); }
    if (!ready) throw Error('Server not ready');
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    if (audioPlayback) {
      const mediaContext=await browser.newContext({serviceWorkers:'block'}),mediaPage=await mediaContext.newPage();
      await mediaPage.setContent('<html><body>Native MP3 metadata check</body></html>');
      for(const effect of ['winner-sound.mp3','wrong-answer.mp3'])await check(`native Chrome decodes ${effect}`,async()=>{
        const duration=await mediaPage.evaluate(url=>new Promise((resolve,reject)=>{
          const audio=new Audio();audio.preload='metadata';const timeout=setTimeout(()=>finish(new Error('Media timeout')),15000);
          function finish(error){clearTimeout(timeout);const duration=audio.duration;audio.pause();audio.removeAttribute('src');audio.load();if(error)reject(error);else resolve(duration);}
          audio.onloadedmetadata=()=>finish();audio.onerror=()=>finish(new Error('Media decode failed'));audio.src=url;
        }),`${base}/audio/${effect}`);
        assert.ok(Number.isFinite(duration)&&duration>0);report[effect]={durationSeconds:duration};
      });
      await mediaContext.close();
    }
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 375, height: 667 }]) {
      const context = await browser.newContext({ viewport, serviceWorkers: 'block', reducedMotion: 'reduce' });
      const page = await context.newPage();
      if (audioPlayback) await page.addInitScript(() => {
        window.__audio = { plays: [], pauses: 0, blocked: true };
        Object.defineProperty(HTMLMediaElement.prototype, 'src', { configurable: true, get() { return this.dataset.fixtureSrc || ''; }, set(value) { this.dataset.fixtureSrc = value; } });
        HTMLMediaElement.prototype.play = function () { window.__audio.plays.push(this.src); return window.__audio.blocked ? Promise.reject(new DOMException('Autoplay blocked fixture', 'NotAllowedError')) : window.__audio.failEffect && this.src.endsWith('winner-sound.mp3') ? Promise.reject(new DOMException('Missing effect fixture','NotSupportedError')) : Promise.resolve(); };
        HTMLMediaElement.prototype.pause = function () { window.__audio.pauses++; };
      });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      if (ttsCleanup) page.on('request', request => {
        if (/texttospeech|\/api\/tts|fpt\.ai/i.test(request.url())) errors.push('Unexpected TTS request');
      });
      let chatCalls = 0, answerCalls = 0, failAnswer = false, pendingAnswer = null, holdAnswer = false, holdChat = false, pendingChat = null, feedbackMissing = false;
      await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin !== base) return route.abort();
        const body = () => JSON.parse(route.request().postData() || '{}');
        if (url.pathname === '/__test/start') return route.fulfill({ json: { ok: true, data: { id: body().requestId, question: 'Câu hỏi fixture?', options: ['A','B','C','D'], expiresAt: '2099-01-01T00:00:00Z', ...(audioPlayback ? {narration:['/fixture/q.mp3','/fixture/a.mp3','/fixture/b.mp3','/fixture/c.mp3','/fixture/d.mp3']} : {}) } } });
        if (url.pathname === '/__test/answer') {
          answerCalls++;
          const finish = () => route.fulfill({ json: failAnswer ? {ok:false,message:'Lỗi ghi nhận fixture'} : {ok:true,data:{selectedIndex:body().index,correctIndex:0,correct:body().index===0,explanation:'Phản hồi fixture',fact:'',sources:'',...(audioPlayback?{narration:feedbackMissing?[]:[body().index===0?'/fixture/right.mp3':'/fixture/wrong.mp3']}:{})}} }).catch(()=>{});
          if (holdAnswer) { pendingAnswer = finish; return; } return finish();
        }
        if (url.pathname === '/__test/binding') return route.fulfill({ json: {ok:true,sessionId:'12345678-1234-1234-1234-123456789abc',expiresAt:'2099-01-01T00:00:00Z'} });
        if (url.pathname.startsWith('/api/chat')) {
          chatCalls++;
          if (url.pathname.endsWith('/suggestions')) return route.fulfill({ json: {status:'suggest',suggestions:[{questionId:'cmtt45-q001',question:'Gợi ý fixture'}]} });
          const finish = () => route.fulfill({json:{status:'answered',characterId:'vo-nguyen-giap',questionId:'cmtt45-q001',answer:'Lời đáp fixture',source:{document:'fixture',sectionId:'I'}}}).catch(()=>{});
          if(holdChat){pendingChat=finish;return;} return finish();
        }
        return route.continue();
      });
      const launcher = page.locator('.character-chat-launcher'), panel = page.locator('.character-chat-panel');
      const confirm = page.locator('.confirm-answer');
      const newRound = async () => { await page.getByText('Lượt mới fixture',{exact:true}).click(); await expect(page.getByRole('radio')).toHaveCount(4); await expect(launcher).toBeDisabled(); };
      const open = async () => { await launcher.click(); await expect(page.locator('.character-chat-composer textarea')).toBeEnabled(); };
      await page.goto(base + '/chat-access-fixture');
      await expect(page.getByRole('radio')).toHaveCount(4);
      const label = `${viewport.width}x${viewport.height}`;
      if (audioPlayback) {
        const audio=page.locator('.narration-player audio');
        await check(`${label}: blocked autoplay offers manual playback; reads question then A–D`,async()=>{
          await expect(page.getByText('Bấm nghe để bật giọng đọc.',{exact:true})).toBeVisible();
          await page.evaluate(()=>{window.__audio.blocked=false;window.__audio.plays=[];});await page.getByRole('button',{name:'Nghe câu hỏi',exact:true}).click();
          for(const name of ['q','a','b','c','d']){await expect(audio).toHaveAttribute('data-fixture-src',`/fixture/${name}.mp3`);await audio.dispatchEvent('ended');}
          assert.deepEqual(await page.evaluate(()=>window.__audio.plays),['/fixture/q.mp3','/fixture/a.mp3','/fixture/b.mp3','/fixture/c.mp3','/fixture/d.mp3']);
        });
        await check(`${label}: wrong effect finishes before spoken feedback; one audio element`,async()=>{
          await page.evaluate(()=>{window.__audio.plays=[];});await page.getByRole('radio').nth(1).check();assert.deepEqual(await page.evaluate(()=>window.__audio.plays),[]);
          await confirm.click();await expect(audio).toHaveAttribute('data-fixture-src','/audio/wrong-answer.mp3');assert.deepEqual(await page.evaluate(()=>window.__audio.plays),['/audio/wrong-answer.mp3']);await expect(page.locator('audio')).toHaveCount(1);
          await audio.dispatchEvent('ended');await expect(audio).toHaveAttribute('data-fixture-src','/fixture/wrong.mp3');await expect(page.locator('.answer-feedback')).toHaveClass(/wrong/);
        });
        await check(`${label}: correct feedback, mute and scanning preserve the answered round`,async()=>{
          await newRound();await page.getByRole('radio').first().check();await confirm.click();await expect(audio).toHaveAttribute('data-fixture-src','/audio/winner-sound.mp3');await audio.dispatchEvent('ended');await expect(audio).toHaveAttribute('data-fixture-src','/fixture/right.mp3');
          await page.getByRole('button',{name:'Tắt âm thanh',exact:true}).click();await expect(page.getByRole('button',{name:'Nghe phản hồi',exact:true})).toBeDisabled();await page.getByRole('button',{name:'Bật âm thanh',exact:true}).click();
          await page.getByRole('button',{name:/Quét nhân vật tiếp/}).click();await page.getByRole('button',{name:/Về câu hỏi/}).click();await expect(page.locator('.answer-feedback')).toHaveClass(/success/);assert.equal(answerCalls,2);
        });
        await check(`${label}: refreshed offline pack attaches audio without redrawing or losing selected answer`,async()=>{
          await page.getByText('Offline fixture',{exact:true}).click();await expect(page.getByText('Câu hỏi fixture offline?',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Nghe câu hỏi',exact:true})).toBeDisabled();await page.getByRole('radio').nth(1).check();
          await page.getByText('Bổ sung audio fixture',{exact:true}).click();await expect(audio).toHaveAttribute('data-fixture-src','/fixture/q.mp3');await expect(page.getByRole('radio').nth(1)).toBeChecked();await confirm.click();await expect(audio).toHaveAttribute('data-fixture-src','/audio/wrong-answer.mp3');await audio.dispatchEvent('ended');await expect(audio).toHaveAttribute('data-fixture-src','/fixture/wrong.mp3');assert.equal(answerCalls,2);
          assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
          const shot=`${label}-playback.png`;await page.screenshot({path:path.join(folder,shot),fullPage:true});report.screenshots.push(shot);
        });
        await check(`${label}: missing effect falls through once; effect still plays without a feedback MP3`,async()=>{
          await page.reload();await expect(page.getByRole('radio')).toHaveCount(4);await page.evaluate(()=>{window.__audio.blocked=false;window.__audio.failEffect=true;window.__audio.plays=[];});await page.getByRole('radio').first().check();await confirm.click();await expect(audio).toHaveAttribute('data-fixture-src','/fixture/right.mp3');assert.deepEqual(await page.evaluate(()=>window.__audio.plays),['/audio/winner-sound.mp3','/fixture/right.mp3']);
          feedbackMissing=true;await page.evaluate(()=>{window.__audio.failEffect=false;});await newRound();await page.getByRole('radio').first().check();await confirm.click();await expect(audio).toHaveAttribute('data-fixture-src','/audio/winner-sound.mp3');await audio.dispatchEvent('ended');await expect(page.getByRole('button',{name:'Nghe phản hồi',exact:true})).toBeEnabled();
        });
        assert.deepEqual(errors,[]);await context.close();continue;
      }
      if (ttsCleanup) await check(`${label}: absent MP3 disables listening without calling a provider`, async () => {
        await expect(page.getByRole('button', { name: 'Nghe câu hỏi', exact: true })).toBeDisabled();
        await expect(page.getByText('Chưa có âm thanh cho nội dung này.', { exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'Nghe câu hỏi', exact: true }).dispatchEvent('click');
        await expect(page.getByRole('radio').first()).toBeEnabled();
      });
      await check(`${label}: initial/selected/submitting locked; successful wrong answer unlocks without auto-open`, async () => {
        await expect(launcher).toBeDisabled(); await expect(panel).toHaveCount(0);
        await launcher.dispatchEvent('click'); await page.keyboard.press('Enter'); assert.equal(chatCalls,0);
        await page.getByRole('radio').nth(1).check(); await expect(launcher).toBeDisabled();
        holdAnswer=true; await confirm.click(); await expect.poll(()=>answerCalls).toBe(1); await expect(launcher).toBeDisabled(); assert.equal(chatCalls,0);
        await pendingAnswer(); holdAnswer=false; await expect(launcher).toBeEnabled(); await expect(panel).toHaveCount(0);
        await expect(page.locator('.answer-feedback')).toHaveClass(/wrong/);
      });
      await check(`${label}: open/send/close/reopen preserves quiz and conversation`, async () => {
        await open(); await page.locator('.chat-suggestions button').click(); await expect(page.locator('.chat-message-text').last()).toHaveText('Lời đáp fixture');
        await page.getByRole('button',{name:'Đóng trò chuyện',exact:true}).click(); await open();
        await expect(page.locator('.chat-message-text').last()).toHaveText('Lời đáp fixture'); await expect(page.getByRole('radio').nth(1)).toBeChecked();
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
        const file=`${label}-unlocked.png`; await page.screenshot({path:path.join(folder,file)}); report.screenshots.push(file);
        await page.getByRole('button',{name:'Đóng trò chuyện',exact:true}).click();
      });
      await check(`${label}: failed submission remains locked; successful correct retry unlocks`, async () => {
        await newRound(); await page.getByRole('radio').first().check(); failAnswer=true; await confirm.click();
        await expect(page.locator('.game-message[role="alert"]')).toContainText('Lỗi ghi nhận'); await expect(launcher).toBeDisabled();
        failAnswer=false; await confirm.click(); await expect(launcher).toBeEnabled(); await expect(page.locator('.answer-feedback')).toHaveClass(/success/);
      });
      await check(`${label}: new round aborts chat and ignores late chat response`, async () => {
        await open(); holdChat=true; await page.locator('.character-chat-composer textarea').fill('Câu hỏi fixture'); await page.locator('.character-chat-composer textarea').press('Enter');
        await expect.poll(()=>!!pendingChat).toBe(true);
        // A real QR transition remounts the page; fixture control remounts GamePlayer.
        await page.getByText('Lượt mới fixture',{exact:true}).evaluate(e=>e.click());
        await expect(launcher).toBeDisabled(); await expect(panel).toHaveCount(0); await pendingChat(); holdChat=false;
        await expect(launcher).toBeDisabled(); assert.notEqual(await page.evaluate(()=>document.body.style.position),'fixed');
      });
      await check(`${label}: late previous answer cannot unlock next question`, async () => {
        holdAnswer=true; pendingAnswer=null; await page.getByRole('radio').first().check(); await confirm.click(); await expect.poll(()=>!!pendingAnswer).toBe(true);
        await newRound(); await pendingAnswer(); holdAnswer=false; await expect(launcher).toBeDisabled(); await expect(page.locator('.answer-feedback')).toHaveCount(0);
      });
      await check(`${label}: all four characters unlock only after confirmation; local grading remains usable`, async () => {
        for(const name of ['Võ Nguyên Giáp','Trường Chinh','Lê Duẩn','Phạm Văn Đồng']) {
          await expect(launcher).toBeDisabled(); await page.getByRole('radio').first().check(); await confirm.click(); await open();
          await expect(panel.locator('h2')).toHaveText(name); await page.keyboard.press('Escape');
          await page.getByText('Nhân vật mới fixture',{exact:true}).click(); await expect(launcher).toBeDisabled();
        }
        await page.getByText('Offline fixture',{exact:true}).click(); await expect(page.locator('#scene-question-title')).toHaveText('Câu hỏi fixture offline?');
        const before=answerCalls; await page.getByRole('radio').nth(1).check(); await confirm.click(); await expect(launcher).toBeEnabled(); assert.equal(answerCalls,before);
        await open(); await expect(panel).toBeVisible(); await page.keyboard.press('Escape');
      });
      assert.deepEqual(errors,[]); await context.close();
    }
  } catch(error) { report.error=String(error); process.exitCode=1; console.error(error); }
  finally {
    await browser?.close();
    if (server.pid) { if(process.platform==='win32') spawnSync('taskkill',['/PID',String(server.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'}); else server.kill(); }
    fs.closeSync(log); fs.writeFileSync(path.join(folder,'browser-report.json'),JSON.stringify(report,null,2));
  }
}
