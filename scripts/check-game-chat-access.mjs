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
const folder = path.join(root, '.local/game-chat-access');
fs.mkdirSync(folder, { recursive: true });
const workspace = path.join(folder, `${mode}-${Date.now()}`);
fs.mkdirSync(workspace);
for (const dir of ['actions', 'app', 'components', 'data', 'features', 'hooks', 'server', 'lib', 'public', 'knowledge', 'docs/source', 'scripts', 'tests', 'types']) {
  if (fs.existsSync(path.join(root, dir))) fs.cpSync(path.join(root, dir), path.join(workspace, dir), { recursive: true });
}
for (const name of fs.readdirSync(root).filter(name => /^(?:package(?:-lock)?\.json|tsconfig\.json|next-env\.d\.ts|next\.config\..+|postcss\.config\..+|eslint\.config\..+|proxy\.[jt]s)$/.test(name))) fs.copyFileSync(path.join(root, name), path.join(workspace, name));
fs.symlinkSync(path.join(root, 'node_modules'), path.join(workspace, 'node_modules'), 'junction');
const guard = pathToFileURL(path.join(root, 'scripts/support/chat-history-offline-guard.mjs')).href;
const env = { ...process.env, MONGODB_URI: '', MONGODB_TEST_URI: '', GEMINI_API_KEY: '', CHAT_AI_MATCHING_ENABLED: 'false', KNOWLEDGE_GENERATION_ENABLED: 'false', NODE_OPTIONS: `--import=${guard}` };
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
export default function Page(){const [round,setRound]=useState(0),[persona,setPersona]=useState(0),[local,setLocal]=useState(false);
const character={id:String(persona+1).repeat(24),name:names[persona],image:'/pwa/icon-192.png',backgroundImage:'/images/history-landscape.webp',openingLine:'Lời chào fixture',createdAt:'',updatedAt:''};
const pack=local?{characters:[character],questions:[{id:'local-question',characterId:character.id,question:'Câu hỏi fixture offline?',answers:['A','B','C','D'],correctIndex:0,correctFeedback:'Đúng fixture',incorrectFeedback:'Sai fixture'}]}:null;
return <><div><button onClick={()=>setRound(n=>n+1)}>Lượt mới fixture</button><button onClick={()=>{setPersona(n=>(n+1)%4);setRound(n=>n+1)}}>Nhân vật mới fixture</button><button onClick={()=>{setLocal(true);setRound(n=>n+1)}}>Offline fixture</button></div>
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
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 375, height: 667 }]) {
      const context = await browser.newContext({ viewport, serviceWorkers: 'block', reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      let chatCalls = 0, answerCalls = 0, failAnswer = false, pendingAnswer = null, holdAnswer = false, holdChat = false, pendingChat = null;
      await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin !== base) return route.abort();
        const body = () => JSON.parse(route.request().postData() || '{}');
        if (url.pathname === '/__test/start') return route.fulfill({ json: { ok: true, data: { id: body().requestId, question: 'Câu hỏi fixture?', options: ['A','B','C','D'], expiresAt: '2099-01-01T00:00:00Z' } } });
        if (url.pathname === '/__test/answer') {
          answerCalls++;
          const finish = () => route.fulfill({ json: failAnswer ? {ok:false,message:'Lỗi ghi nhận fixture'} : {ok:true,data:{selectedIndex:body().index,correctIndex:0,correct:body().index===0,explanation:'Phản hồi fixture',fact:'',sources:''}} }).catch(()=>{});
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
