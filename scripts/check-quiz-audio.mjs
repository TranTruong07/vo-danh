// Isolated TTSForFree browser/build checks. No .env files, live providers, DB or R2.
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { chromium, expect } from '@playwright/test';

const root=process.cwd(),mode=process.argv[2];
if(!['browser','build'].includes(mode))throw Error('Use browser or build');
const folder=path.join(root,'.local/ttsforfree'),workspace=path.join(folder,`${mode}-${Date.now()}`);
fs.mkdirSync(workspace,{recursive:true});
for(const dir of ['actions','app','components','data','features','hooks','server','lib','public','knowledge','docs/source','scripts','tests','types'])if(fs.existsSync(path.join(root,dir)))fs.cpSync(path.join(root,dir),path.join(workspace,dir),{recursive:true});
for(const file of fs.readdirSync(root).filter(name=>/^(?:package(?:-lock)?\.json|tsconfig\.json|next-env\.d\.ts|next\.config\..+|postcss\.config\..+|eslint\.config\..+|proxy\.[jt]s)$/.test(name)))fs.copyFileSync(path.join(root,file),path.join(workspace,file));
fs.symlinkSync(path.join(root,'node_modules'),path.join(workspace,'node_modules'),'junction');
const env={...process.env,MONGODB_URI:'',MONGODB_TEST_URI:'',FPT_TTS_API_KEY:'',FPT_TTS_ENABLED:'false',TTSFORFREE_API_KEY:'',TTSFORFREE_ENABLED:'false',GEMINI_API_KEY:'',CHAT_AI_MATCHING_ENABLED:'false',KNOWLEDGE_GENERATION_ENABLED:'false',NODE_OPTIONS:`--import=${pathToFileURL(path.join(root,'scripts/support/chat-history-offline-guard.mjs')).href}`};
for(const key of ['R2_ACCOUNT_ID','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_BUCKET','R2_PUBLIC_BASE_URL'])env[key]='';
const write=(file,text)=>{const target=path.join(workspace,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,text);};
if(mode==='build'){
  const result=spawnSync(process.platform==='win32'?'cmd.exe':'npm',process.platform==='win32'?['/d','/s','/c','npm run build']:['run','build'],{cwd:workspace,env,encoding:'utf8',maxBuffer:12*1024*1024,windowsHide:true});
  fs.writeFileSync(path.join(folder,'build.log'),(result.stdout||'')+(result.stderr||''));
  fs.writeFileSync(path.join(folder,'build.json'),JSON.stringify({exitCode:result.status,workspace,providerCalls:0,databaseConnections:0},null,2));
  console.log(result.stdout,result.stderr);process.exitCode=result.status??1;
}else{
  write('app/layout.tsx',`import './globals.css';import './admin/admin.css';import './admin/questions/questions.css';export default function Layout({children}:{children:React.ReactNode}){return <html lang="vi"><body>{children}</body></html>}`);
  write('app/tts-pilot-fixture/page.tsx',`"use client";import {useState} from 'react';import QuestionForm from '@/features/questions/question-form';
const q={id:'${'a'.repeat(24)}',characterId:'${'b'.repeat(24)}',question:'Ai đang đặt câu hỏi?',answers:['Một','Hai','Ba','Bốn'],correctIndex:2,correctFeedback:'Đúng rồi bạn ơi.',incorrectFeedback:'Chưa đúng bạn nhé.',updatedAt:''};
export default function Page(){const [fresh,setFresh]=useState(false);return <main className="admin-shell" style={{display:'block',padding:20,maxWidth:1000,margin:'auto'}}><button onClick={()=>setFresh(v=>!v)}>Đổi trạng thái lưu fixture</button><QuestionForm key={String(fresh)} question={fresh?undefined:q} choices={[{id:q.characterId,name:'Võ Nguyên Giáp',image:'',questionCount:1}]} /></main>}`);
  const port=await new Promise(resolve=>{const socket=net.createServer();socket.listen(0,'127.0.0.1',()=>{const value=socket.address().port;socket.close(()=>resolve(value));});});
  const base=`http://localhost:${port}`,log=fs.openSync(path.join(folder,'browser-server.log'),'w');
  const server=spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'dev','--webpack','--port',String(port)],{cwd:workspace,env,stdio:['ignore',log,log],windowsHide:true});
  const report={checks:[],screenshots:[],providerCalls:0,databaseConnections:0,transport:'mock API responses in isolated source copy; actual form/audio component/CSS'};
  let browser;
  const check=async(name,run)=>{await run();report.checks.push({name,status:'pass'});console.log('PASS',name);};
  try{
    let ready=false;for(let n=0;n<120;n++){if(server.exitCode!==null)throw Error('Server exited');try{if((await fetch(base+'/tts-pilot-fixture')).ok){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,500));}
    if(!ready)throw Error('Server not ready');browser=await chromium.launch({channel:'chrome',headless:true});
    for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:375,height:667}]){
      const context=await browser.newContext({viewport,serviceWorkers:'block'}),page=await context.newPage();
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      const types=['question','optionA','optionB','optionC','optionD','correctFeedback','incorrectFeedback'];
      const data={questionId:'a'.repeat(24),voiceId:'v1:one',voices:['one','two','three','four'].map((name,i)=>({id:`v1:${name}`,label:`Giọng ${i+1}`})),pitch:0,status:'no_audio',maxFiles:7,canGenerate:true,reason:'',busy:false,segments:types.map(segmentType=>({segmentType,characters:20,status:'missing'}))};
      let posts=0,fail=false,hold=false,pending=null,getFailure=false;
      await page.route('**/*',async route=>{
        const url=new URL(route.request().url());if(url.origin!==base)return route.abort();
        if(url.pathname.includes('/api/admin/quiz-questions/')){
          if(route.request().method()==='GET')return route.fulfill({status:getFailure?503:200,json:getFailure?{message:'Không tải được trạng thái fixture.'}:{...data,voiceId:url.searchParams.get('voiceId')||data.voiceId}});
          posts++;const input=route.request().postDataJSON();assert.equal(input.confirmed,true);assert.equal(input.text,undefined);
          assert.equal(input.segments.length,1);
          const finish=()=>{for(const type of input.segments){const item=data.segments.find(x=>x.segmentType===type);item.status=fail?'failed':'ready';item.url=fail?undefined:base+'/fixture-audio.mp3';item.lastError=fail?'Lỗi TTSForFree fixture.':undefined;}data.status='partial';data.voiceId=input.voiceId;return route.fulfill({json:data});};
          if(hold){pending=finish;return;}return finish();
        }
        if(url.pathname==='/fixture-audio.mp3')return route.fulfill({status:200,contentType:'audio/mpeg',body:Buffer.alloc(100)});
        return route.continue();
      });
      await page.goto(base+'/tts-pilot-fixture');
      const section=page.locator('[data-question-audio]'),question=section.locator('[data-segment="question"]');
      const label=`${viewport.width}x${viewport.height}`;
      await check(`${label}: seven segments and verified voice dropdown; open/change never generates`,async()=>{
        await expect(section.locator('li')).toHaveCount(7);await section.locator('select').selectOption('v1:two');await expect(section.getByRole('button',{name:'Cập nhật trạng thái'})).toBeEnabled();assert.equal(posts,0);await expect(section.locator('option')).toHaveCount(4);
        await expect(section.locator('[data-segment="optionD"] button')).toBeEnabled();
      });
      await check(`${label}: explicit confirmation, loading/double-submit guard, ready preview`,async()=>{
        await question.getByRole('button',{name:'Tạo MP3',exact:true}).click();assert.equal(posts,0);hold=true;await section.getByRole('button',{name:'Xác nhận tạo MP3',exact:true}).click();await expect.poll(()=>posts).toBe(1);
        await expect(section.getByRole('button',{name:'Xác nhận tạo MP3',exact:true})).toBeDisabled();await expect(section.getByText(/Đang tạo và lưu MP3/)).toBeVisible();await pending();hold=false;
        await expect(question.locator('audio')).toHaveAttribute('preload','none');await expect(question.locator('audio')).toHaveAttribute('src',base+'/fixture-audio.mp3');
      });
      await check(`${label}: failure visible; ready segment retained; no automatic retry`,async()=>{
        fail=true;await section.locator('[data-segment="optionA"]').getByRole('button',{name:'Tạo MP3',exact:true}).click();await section.getByRole('button',{name:'Xác nhận tạo MP3',exact:true}).click();await expect(section.getByText('Lỗi TTSForFree fixture.',{exact:true})).toBeVisible();assert.equal(posts,2);await expect(question.locator('audio')).toHaveCount(1);fail=false;
      });
      await check(`${label}: load failure and manual refresh; missing configuration blocks generation`,async()=>{
        getFailure=true;await section.getByRole('button',{name:'Cập nhật trạng thái'}).click();await expect(section.getByRole('alert')).toContainText('Không tải được');getFailure=false;data.canGenerate=false;data.reason='Chưa cấu hình API key TTSForFree.';
        await section.getByRole('button',{name:'Cập nhật trạng thái'}).click();await expect(section.getByText(data.reason,{exact:true})).toBeVisible();await expect(section.getByRole('button',{name:'Tạo các MP3 còn thiếu'})).toBeDisabled();
        data.canGenerate=true;data.reason='';await section.getByRole('button',{name:'Cập nhật trạng thái'}).click();await expect(section.locator('[data-segment="optionA"] button')).toBeEnabled();
      });
      await check(`${label}: batch stops on failed segment, resumes remaining only after confirmation`,async()=>{
        fail=true;await section.getByRole('button',{name:'Tạo các MP3 còn thiếu'}).click();await section.getByRole('button',{name:'Xác nhận tạo MP3',exact:true}).click();await expect(section.getByRole('button',{name:'Cập nhật trạng thái'})).toBeEnabled();assert.equal(posts,3);
        fail=false;await section.getByRole('button',{name:'Tạo các MP3 còn thiếu'}).click();await section.getByRole('button',{name:'Xác nhận tạo MP3',exact:true}).click();await expect(section.locator('audio')).toHaveCount(7);assert.equal(posts,9);
      });
      await check(`${label}: no horizontal overflow; unsaved edits block generation; new form requires save`,async()=>{
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await section.scrollIntoViewIfNeeded();const shot=`${label}-audio.png`;await page.screenshot({path:path.join(folder,shot),fullPage:true});report.screenshots.push(shot);
        await page.getByLabel('Nội dung câu hỏi',{exact:true}).fill('Câu hỏi đã sửa nhưng chưa lưu');await expect(section.getByText(/Có thay đổi chưa lưu/)).toBeVisible();
        await page.getByRole('button',{name:'Đổi trạng thái lưu fixture'}).click();await expect(page.getByText('Lưu câu hỏi trước để thiết lập âm thanh.')).toBeVisible();assert.equal(posts,9);
      });
      assert.deepEqual(errors,[]);await context.close();
    }
  }catch(error){report.error=String(error);console.error(error);process.exitCode=1;}
  finally{await browser?.close();if(server.pid){if(process.platform==='win32')spawnSync('taskkill',['/PID',String(server.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});else server.kill();}fs.closeSync(log);fs.writeFileSync(path.join(folder,'browser-report.json'),JSON.stringify(report,null,2));}
}
