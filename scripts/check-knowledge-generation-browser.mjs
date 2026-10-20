import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { MongoClient, ObjectId } from 'mongodb';
import { chromium, expect as baseExpect } from '@playwright/test';
import { configureTestEnvironment, TEST_DATABASE, safeError } from './knowledge-generation-test-env.mjs';
const phase5e2=process.argv.includes('--phase5e2');
const root=process.cwd(), folder=path.join(root,phase5e2?'.local/chat-phase-5e2':'.local/chat-phase-5e1');
const resume=process.argv.includes('--resume')?JSON.parse(fs.readFileSync(path.join(folder,'browser-e2e.json'),'utf8')):null;
const runId=resume?.runId||randomUUID();
const report={...(resume||{}),runId,target:TEST_DATABASE,status:'running',generationCalls:0,mockedProvider:true,checks:resume?.checks||[],screenshots:resume?.screenshots||[]};
delete report.error;delete report.browserErrorFirstLine;delete report.visibleAlert;delete report.errorDetails;delete report.assertion;
const sha=v=>createHash('sha256').update(v).digest('hex');
const expect=baseExpect.configure({timeout:60000}); // Cold Next development route compilation.
let client, server, browser, page, log;
async function check(name,work){if(report.checks.some(c=>c.name===name&&c.status==='passed')){console.log('RETAIN PASS',name);return;}report.currentCheck=name;await work();report.checks.push({name,status:'passed'});console.log('PASS',name);}
try{
  const {uri}=configureTestEnvironment();
  if(JSON.parse(fs.readFileSync(path.join(folder,'mongo-integration.json'),'utf8')).status!=='passed')throw Error('INTEGRATION_REQUIRED');
  const fixture=JSON.parse(fs.readFileSync(path.join(folder,'integration-fixture.json'),'utf8'));
  if(fs.existsSync(path.join(folder,'browser-e2e.json'))) {
    const previous=JSON.parse(fs.readFileSync(path.join(folder,'browser-e2e.json'),'utf8'));
    fs.copyFileSync(path.join(folder,'browser-e2e.json'),path.join(folder,`browser-attempt-${previous.runId}-${Date.now()}.json`));
  }
  browser=await chromium.launch({channel:'chrome',headless:true});report.browser='Chrome '+browser.version();
  const socket=net.createServer();await new Promise((resolve,reject)=>{socket.once('error',reject);socket.listen(0,'127.0.0.1',resolve);});const port=socket.address().port;await new Promise(r=>socket.close(r));
  const url=`http://localhost:${port}`;
  const prior=fs.readdirSync(folder).filter(n=>n.startsWith('browser-workspace-')).sort((a,b)=>fs.statSync(path.join(folder,b)).mtimeMs-fs.statSync(path.join(folder,a)).mtimeMs)[0];
  const workspace=path.join(folder,prior||`browser-workspace-${runId}`);fs.mkdirSync(workspace,{recursive:true});
  report.isolatedWorkspace=path.relative(root,workspace);report.port=port;
  const changed=(src,dst)=>fs.statSync(src).isDirectory()||!fs.existsSync(dst)||!fs.readFileSync(src).equals(fs.readFileSync(dst));
  for(const dir of ['actions','app','components','data','features','hooks','server','lib','public','knowledge','docs/source','scripts','tests','types'])if(fs.existsSync(path.join(root,dir)))fs.cpSync(path.join(root,dir),path.join(workspace,dir),{recursive:true,filter:changed});
  for(const name of fs.readdirSync(root).filter(n=>/^(?:package(?:-lock)?\.json|tsconfig\.json|next-env\.d\.ts|next\.config\..+|postcss\.config\..+|eslint\.config\..+|proxy\.[jt]s)$/.test(n)))if(changed(path.join(root,name),path.join(workspace,name)))fs.copyFileSync(path.join(root,name),path.join(workspace,name));
  if(!fs.existsSync(path.join(workspace,'node_modules')))fs.symlinkSync(path.join(root,'node_modules'),path.join(workspace,'node_modules'),'junction');
  // Replace only the provider boundary in the disposable copy. Never the application source.
  fs.writeFileSync(path.join(workspace,'server/infrastructure/gemini-knowledge-generator.ts'),`
import 'server-only';
import { randomUUID } from 'node:crypto';
import { PERSONA_FRAMES, type SourceChunk } from '@/server/domain/knowledge-generation';
export const GENERATION_PROMPT_VERSION='fixture-5e1-no-provider';
export function knowledgeGenerationConfig(){return {enabled:true,model:'fixture-no-provider',dailyCalls:20,maxPerRequest:2};}
export async function generateKnowledge(chunks:SourceChunk[], _count:number, originalQuestion?:string):Promise<unknown>{
 await new Promise(r=>setTimeout(r,900));const c=chunks[0], tag=randomUUID();
 return {insufficientEvidence:false,proposals:[{canonicalQuestion:originalQuestion || 'Tư liệu nêu điều gì về Cách mạng tháng Tám? ['+tag+']',
 aliases:['Nội dung chính của đoạn nguồn này là gì? ['+tag+']','Hãy giải thích đoạn tư liệu này? ['+tag+']'],neutralAnswer:c.text,
 characterAnswers:Object.fromEntries(Object.entries(PERSONA_FRAMES).map(([k,v])=>[k,v[0]+c.text])),
 evidence:[{sourceId:c.sourceId,chunkId:c._id,quote:c.text}],warnings:[],insufficientEvidence:false}]};
}`);
  const guard=path.join(workspace,'test-database-guard.mjs');
  fs.writeFileSync(guard,`import {MongoClient} from 'mongodb';
if(process.env.MONGODB_DB_NAME!=='${TEST_DATABASE}'||!process.env.MONGODB_URI)throw Error('WRONG_TEST_TARGET');
const db=MongoClient.prototype.db;MongoClient.prototype.db=function(name,...args){if(name!=='${TEST_DATABASE}')throw Error('FORBIDDEN_DATABASE');return db.call(this,name,...args)};
const fetch=globalThis.fetch;globalThis.fetch=(input,...args)=>{const u=String(input?.url||input);if(/generativelanguage|aiplatform/i.test(u))throw Error('LIVE_AI_FORBIDDEN');return fetch(input,...args)};`);
  client=new MongoClient(uri,{serverSelectionTimeoutMS:10000});await client.connect();const db=client.db(TEST_DATABASE);
  const beforePointers=await db.collection('knowledge_questions').find({publishedVersionId:{$exists:true}}).sort({_id:1}).toArray();
  const email=`browser-${runId}@phase5e1.test`,password=randomBytes(12).toString('hex');
  const actors={};
  for(const role of ['admin','user']){
    const fixtureEmail=role==='admin'?email:`user-${runId}@phase5e1.test`;
    const existing=resume?await db.collection('users').findOne({email:fixtureEmail,testRunId:runId}):null;
    const userId=existing?._id||new ObjectId(),token=randomBytes(32).toString('hex'),now=new Date();actors[role]={userId,token};
    if(!existing)await db.collection('users').insertOne({_id:userId,email:fixtureEmail,role,authVersion:0,passwordHash:'disabled-test-fixture',fullName:'Phase 5E.1 Test',createdAt:now,updatedAt:now,testRunId:runId});
    await db.collection('auth_sessions').insertOne({_id:sha(token),userId,authVersion:0,createdAt:now,expiresAt:new Date(Date.now()+2*3600000),...(role==='admin'?{adminConfigHash:sha(`${email}\0${password}`)}:{})});
  }
  const groupId=sha(runId),historyQuestion=`Tư liệu mô tả Cách mạng tháng Tám như thế nào? [${runId}]`;
  if(!resume)await db.collection('chat_interactions').insertOne({_id:randomUUID(),sessionRef:sha(`fixture-${runId}`),characterId:'vo-nguyen-giap',kind:'question',createdAt:new Date(Date.now()-20*60000),expiresAt:new Date(Date.now()+86400000),question:historyQuestion,redacted:false,groupId,requestHash:sha(historyQuestion),outcome:'unresolved',matchingSource:'clarify',suggestedQuestionIds:[],providerCalls:0,cacheHit:false,latencyMs:1,reviewReason:'clarify',feedbackStatus:'not_requested',testRunId:runId});
  report.testHistoryFixtureCreated=true;
  const env={...process.env,MONGODB_URI:uri,MONGODB_DB_NAME:TEST_DATABASE,GEMINI_API_KEY:'',CHAT_AI_MATCHING_ENABLED:'false',KNOWLEDGE_GENERATION_ENABLED:'false',ADMIN_EMAIL:email,ADMIN_PASSWORD:password,NEXT_PUBLIC_APP_URL:url,NODE_ENV:'development',NEXT_TELEMETRY_DISABLED:'1',NODE_OPTIONS:`--import=${pathToFileURL(guard).href}`};
  log=fs.openSync(path.join(folder,`browser-server-${runId}.log`),'w');
  server=spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'dev','--webpack','--port',String(port)],{cwd:workspace,env,stdio:['ignore',log,log],windowsHide:true});
  for(let i=0;i<90;i++){if(server.exitCode!==null)throw Error('TEST_SERVER_EXITED');try{const r=await fetch(`${url}/api/admin/knowledge/sources`);if(r.status===401)break;}catch{} if(i===89)throw Error('TEST_SERVER_NOT_READY');await new Promise(r=>setTimeout(r,1000));}
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  await context.addCookies([{name:'vo_danh_session',value:actors.admin.token,url,httpOnly:true,sameSite:'Lax'}]);
  page=await context.newPage();page.setDefaultTimeout(60000);page.setDefaultNavigationTimeout(120000);
  const screenshot=async name=>{const file=path.join(folder,`${name}-${runId}.png`);await page.screenshot({path:file,fullPage:true});report.screenshots.push(path.relative(root,file));};
  await check('admin authorization: anonymous 401, regular user 403, pages redirect',async()=>{
    for(const role of ['anonymous','user']){
      const ctx=await browser.newContext();if(role==='user')await ctx.addCookies([{name:'vo_danh_session',value:actors.user.token,url,httpOnly:true,sameSite:'Lax'}]);
      for(const api of ['sources','generate','proposals']){const r=await ctx.request.get(`${url}/api/admin/knowledge/${api}`);assert.equal(r.status(),role==='user'?403:401);}
      const manual=await ctx.request.post(`${url}/api/admin/knowledge/manual`,{headers:{Origin:url},data:{}});assert.equal(manual.status(),role==='user'?403:401);
      const r=await ctx.request.post(`${url}/api/admin/chat-questions`,{data:{}});assert.equal(r.status(),role==='user'?403:401);
      const p=await ctx.newPage();await p.goto(`${url}/admin/knowledge/sources`,{timeout:120000});await expect(p).not.toHaveURL(/\/admin\//);await ctx.close();
    }
  });
  if(!resume)await page.goto(`${url}/admin/knowledge/sources`);
  await check('DOCX upload, extraction preview, loading and source confirmation',async()=>{
    const uploaded=page.waitForResponse(r=>r.url().endsWith('/api/admin/knowledge/sources')&&r.request().method()==='POST');
    await page.locator('input[type=file]').setInputFiles({name:`historical-${runId}.docx`,mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer:fs.readFileSync(path.join(root,fixture.docxFile))});
    await expect(page.getByText('Đang xử lý…',{exact:true})).toBeVisible();const r=await uploaded;assert.equal(r.status(),200);
    await expect(page.locator('.generation-chunks')).toContainText(fixture.core);
    report.docxSourceId=(await db.collection('knowledge_sources').findOne({uploadedBy:actors.admin.userId.toHexString(),fileType:'docx'}))._id;
    await page.getByRole('button',{name:'Tôi đã đọc và xác nhận tài liệu hợp lệ'}).click();await expect(page.locator('.knowledge-success')).toContainText('Đã ghi nhận bạn xác nhận');await screenshot('sources-desktop');
  });
  await check('PDF with Vietnamese text upload and source confirmation',async()=>{
    const pdfPage=await context.newPage();await pdfPage.setContent('<meta charset="utf-8"><div style="font:18px Arial;white-space:pre-wrap"></div>');await pdfPage.locator('div').evaluate((el,t)=>el.textContent=t,fixture.core);
    const file=path.join(folder,`historical-fixture-${runId}.pdf`);await pdfPage.pdf({path:file,format:'A4'});await pdfPage.close();
    const uploaded=page.waitForResponse(r=>r.url().endsWith('/api/admin/knowledge/sources')&&r.request().method()==='POST');await page.locator('input[type=file]').setInputFiles(file);const r=await uploaded;assert.equal(r.status(),200);
    await expect(page.locator('.generation-chunks')).toContainText('Cách mạng');await page.getByRole('button',{name:'Tôi đã đọc và xác nhận tài liệu hợp lệ'}).click();await expect(page.locator('.knowledge-success')).toContainText('Đã ghi nhận bạn xác nhận');
    report.pdfSourceId=(await db.collection('knowledge_sources').findOne({uploadedBy:actors.admin.userId.toHexString(),fileType:'pdf'}))._id;
  });
  await check('malformed PDF shows error without creating a source',async()=>{
    const count=await db.collection('knowledge_sources').countDocuments();await page.locator('input[type=file]').setInputFiles({name:'invalid.pdf',mimeType:'application/pdf',buffer:Buffer.from('invalid fixture')});await expect(page.getByRole('alert')).toBeVisible();assert.equal(await db.collection('knowledge_sources').countDocuments(),count);
  });
  await check('chat history navigation uses server-resolved question; rejects forged question',async()=>{
    await page.goto(`${url}/admin/chat-questions`);await page.locator('.chat-review-question').filter({hasText:historyQuestion}).click();await page.getByText('Tạo kiến thức từ câu hỏi này',{exact:true}).click();await page.getByRole('link',{name:'Gemini tạo từ tài liệu'}).click();await expect(page.locator('blockquote')).toHaveText(historyQuestion);
    const forged=await context.request.post(`${url}/api/admin/knowledge/generate`,{headers:{Origin:url},data:{originalQuestion:'forged',requestId:randomUUID(),count:1,sourceIds:[report.docxSourceId],chunkIds:[]}});assert.equal(forged.status(),400);
    const missing=await context.request.get(`${url}/api/admin/knowledge/generate?groupId=${sha('nonexistent-'+runId)}`);assert.equal(missing.status(),404);
  });
  let batchId=resume?(await db.collection('knowledge_proposals').findOne({createdBy:actors.admin.userId.toHexString()}))?._id:undefined;
  await check('select source, mock generation, loading and idempotent resubmission',async()=>{
    await page.locator('.generation-source-row').filter({hasText:`historical-${runId}.docx`}).getByRole('button',{name:'Chọn đoạn trích'}).click();
    await page.getByLabel('Chọn đoạn',{exact:true}).first().check();
    await expect(page.getByRole('button',{name:'Bắt đầu tạo đề xuất'})).toBeDisabled();
    await expect(page.getByText(/Hạn mức ứng dụng còn/)).toBeVisible();
    await page.getByLabel('Tôi xác nhận gọi Gemini').check();
    const generated=page.waitForResponse(r=>r.url().endsWith('/api/admin/knowledge/generate')&&r.request().method()==='POST');await page.getByRole('button',{name:'Bắt đầu tạo đề xuất'}).click();await expect(page.getByText('Đang xử lý yêu cầu… Không cần bấm gửi lại.')).toBeVisible();const r=await generated;assert.equal(r.status(),200);await expect(page.locator('.knowledge-success')).toContainText('Đã ghi nhận lượt tạo');batchId=(await db.collection('knowledge_proposals').findOne({createdBy:actors.admin.userId.toHexString()}))._id;
    const p=await db.collection('knowledge_proposals').findOne({_id:batchId});assert.equal(p.generationStatus,'ready_for_review');assert.equal(p.originalQuestion,historyQuestion);assert.equal(p.originalChatGroupId,groupId);assert.equal(p.generationModel,'fixture-no-provider');assert.equal(await db.collection('knowledge_question_revisions').countDocuments({importBatchId:batchId}),0);
    const before=await db.collection('knowledge_generation_budget').find().toArray();const repeated=page.waitForResponse(r=>r.url().endsWith('/api/admin/knowledge/generate')&&r.request().method()==='POST');await page.getByRole('button',{name:'Kiểm tra lại cùng lượt tạo'}).click();assert.equal((await repeated).status(),200);await expect(page.locator('.knowledge-success')).toContainText('Đã ghi nhận lượt tạo');assert.deepEqual(await db.collection('knowledge_generation_budget').find().toArray(),before);await screenshot('generate-desktop');
  });
  await check('proposal edit, four personas, explicit Draft conversion and source review',async()=>{
    await page.goto(`${url}/admin/knowledge/proposals`);await page.locator('article.generation-source-row').filter({hasText:historyQuestion}).getByRole('button',{name:'Xem đề xuất'}).click();
    await expect(page.locator('.generation-editor details[open] blockquote').first()).toContainText(fixture.core);
    for(const name of ['Trường Chinh','Lê Duẩn','Phạm Văn Đồng','Võ Nguyên Giáp'])await expect(page.locator('.generation-editor label').filter({hasText:name}).locator('textarea')).toHaveValue(new RegExp(fixture.core.slice(0,20).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
    await expect(page.getByRole('button',{name:'Lưu thành Draft'})).toBeDisabled();await page.getByLabel('Ghi chú biên tập').fill(`Browser fixture ${runId}; only Draft, not historical approval.`);
    await page.getByRole('button',{name:'Lưu biên tập & kiểm tra lại'}).click();await expect(page.locator('.knowledge-success')).toContainText('Đã lưu biên tập');
    await page.getByLabel('Tôi đã so sánh và quyết định').check();await page.getByLabel('Tôi đã đối chiếu evidence').check();await page.getByRole('button',{name:'Lưu thành Draft'}).click();await expect(page.locator('.knowledge-success')).toContainText('Đã tạo Draft');
    const p=await db.collection('knowledge_proposals').findOne({_id:batchId});report.proposalId=batchId;report.draftId=p.draftId;report.revisionId=p.revisionId;
    const revision=await db.collection('knowledge_question_revisions').findOne({_id:p.revisionId});assert.equal(revision.status,'draft');assert.equal(revision.createdBy,actors.admin.userId.toHexString());assert.equal(revision.reviewedBy,undefined);
    assert.equal((await db.collection('knowledge_questions').findOne({_id:p.draftId})).publishedVersionId,undefined);
    await screenshot('proposals-desktop');await page.getByRole('link',{name:'Mở bản nháp để kiểm duyệt →'}).click();await expect(page.getByText('Nguồn để đối chiếu',{exact:true})).toBeVisible();await expect(page.locator('blockquote').first()).toContainText(fixture.core);await screenshot('review-desktop');
  });
  if(phase5e2) await check('history manual creation, alias editor, duplicate resolution and Draft revision',async()=>{
    if(resume?.manualRevisionId) {
      // The previous run completed conversion and stopped at the responsive assertion. Inspect,
      // then resume visual checks without creating another proposal or revision.
      const p=await db.collection('knowledge_proposals').findOne({_id:resume.manualProposalId});
      assert.equal(p.revisionId,resume.manualRevisionId);assert.equal(p.generationStatus,'converted_to_draft');
      assert.equal((await db.collection('knowledge_question_revisions').findOne({_id:p.revisionId})).status,'draft');
      await page.setViewportSize({width:390,height:844});
      await page.goto(`${url}/admin/knowledge/manual?groupId=${groupId}`);await expect(page.getByLabel('Câu hỏi chính')).toHaveValue(historyQuestion);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));await screenshot('manual-form-mobile');
      await page.goto(`${url}/admin/knowledge/proposals`);
      await page.locator('article.generation-source-row').filter({hasText:historyQuestion}).filter({hasText:'manual'}).getByRole('button',{name:'Xem đề xuất'}).click();
      await expect(page.getByRole('link',{name:'Mở bản nháp để kiểm duyệt →'})).toBeVisible();
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));await screenshot('manual-mobile-fixed');
      await page.setViewportSize({width:1440,height:900});return;
    }
    await page.goto(`${url}/admin/chat-questions`);
    await page.getByLabel('Lượt hỏi tối thiểu').fill('2');await page.getByRole('button',{name:'Áp dụng bộ lọc'}).click();await expect(page.locator('.chat-review-question').filter({hasText:historyQuestion})).toHaveCount(0);
    await page.getByLabel('Lượt hỏi tối thiểu').fill('1');await page.getByRole('button',{name:'Áp dụng bộ lọc'}).click();await page.locator('.chat-review-question').filter({hasText:historyQuestion}).click();
    await page.getByText('Tạo kiến thức từ câu hỏi này',{exact:true}).click();await page.locator('.chat-create-knowledge').getByRole('link',{name:'Nhập thủ công'}).click();
    await expect(page.getByLabel('Câu hỏi chính')).toHaveValue(historyQuestion);
    await page.locator('.generation-source-row').filter({hasText:`historical-${runId}.docx`}).getByRole('button',{name:'Chọn đoạn trích'}).click();
    await page.getByRole('button',{name:'Dùng đoạn làm evidence'}).first().click();
    await page.getByLabel('Cách hỏi 1',{exact:true}).fill(`Tư liệu giải thích điều gì? [manual-${runId}]`);
    await page.getByLabel('Cách hỏi 2',{exact:true}).fill(`Tóm lược tư liệu này? [manual-${runId}]`);
    await page.getByRole('button',{name:'Thêm cách hỏi'}).click();await page.getByLabel('Cách hỏi 3',{exact:true}).fill('Câu thử xóa');await page.getByRole('button',{name:'Xóa cách hỏi 3'}).click();await expect(page.getByLabel('Cách hỏi 3',{exact:true})).toHaveCount(0);
    await page.getByLabel('Đáp án trung tính').fill(fixture.core);
    for(const name of ['Trường Chinh','Lê Duẩn','Phạm Văn Đồng','Võ Nguyên Giáp'])await page.getByLabel(`Chọn lời dẫn ${name}`).selectOption({index:1});
    await page.getByLabel('Ghi chú biên tập').fill('Manual browser fixture; no historical approval.');
    const before=await db.collection('knowledge_generation_budget').find().toArray();
    await page.getByRole('button',{name:'Lưu đề xuất thủ công'}).click();await expect(page.locator('.knowledge-success')).toContainText('Đã lưu đề xuất thủ công');
    const manual=await db.collection('knowledge_proposals').findOne({createdBy:actors.admin.userId.toHexString(),creationMethod:'manual'});report.manualProposalId=manual._id;
    assert.equal(manual.originalQuestion,historyQuestion);assert.equal(manual.originalChatGroupId,groupId);assert.equal(manual.generationModel,'manual');assert.deepEqual(await db.collection('knowledge_generation_budget').find().toArray(),before);
    const editor=page.locator('.generation-editor').last();await expect(editor).toContainText('Trùng chính xác');
    await editor.locator('p').filter({hasText:'Trùng chính xác'}).getByRole('button',{name:'Tạo revision cho câu này'}).first().click();
    await editor.getByLabel('Tôi đã so sánh và quyết định').check();await editor.getByLabel('Tôi đã đối chiếu evidence').check();
    await editor.getByRole('button',{name:'Lưu thành Draft'}).click();await expect(page.locator('.knowledge-success')).toContainText('Đã tạo Draft');
    const after=await db.collection('knowledge_proposals').findOne({_id:manual._id});assert.equal(after.draftId,report.draftId);assert.notEqual(after.revisionId,report.revisionId);
    const rev=await db.collection('knowledge_question_revisions').findOne({_id:after.revisionId});assert.equal(rev.status,'draft');assert.equal(rev.importBatchId,manual.batchId);report.manualRevisionId=after.revisionId;
    await screenshot('manual-desktop');await page.setViewportSize({width:390,height:844});await screenshot('manual-mobile');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));await page.setViewportSize({width:1440,height:900});
  });
  await check('list network error and mobile layout',async()=>{
    await page.route('**/api/admin/knowledge/proposals?*',r=>r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Lỗi kết nối mô phỏng kiểm thử.'})}));
    await page.goto(`${url}/admin/knowledge/proposals`);await expect(page.locator('.knowledge-error')).toHaveText('Lỗi kết nối mô phỏng kiểm thử.');await page.unroute('**/api/admin/knowledge/proposals?*');await page.getByRole('button',{name:'Làm mới',exact:true}).click();await expect(page.locator('article.generation-source-row').filter({hasText:historyQuestion}).first()).toBeVisible();await expect(page.locator('.knowledge-error')).toHaveCount(0);
    await page.setViewportSize({width:390,height:844});await screenshot('proposals-mobile');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
  });
  await check('Published unchanged and no approval or publish audit',async()=>{
    assert.deepEqual(await db.collection('knowledge_questions').find({publishedVersionId:{$exists:true}}).sort({_id:1}).toArray(),beforePointers);
    assert.equal(await db.collection('knowledge_audit').countDocuments({actorId:actors.admin.userId.toHexString(),action:{$in:['approve','publish']}}),0);
  });
  report.status='passed';report.fixtureRecordsRetained=true;
}catch(error){
  report.status='failed';report.error=safeError(error);
  if(error?.name==='AssertionError')report.assertion={operator:error.operator};
  if(page){
    report.errorDetails=String(error?.message||'').replace(/(?:mongodb(?:\+srv)?|https?):\/\/\S+/g,'[URL]').slice(0,2500);
    report.browserErrorFirstLine=report.errorDetails.split('\n')[0].slice(0,300);
    report.visibleAlert=await page.locator('[role=alert]').allTextContents().catch(()=>[]);
    await page.screenshot({path:path.join(folder,`browser-failure-${runId}.png`),fullPage:true}).catch(()=>{});
  }
  process.exitCode=1;
}
finally{await browser?.close();if(server?.pid)spawnSync('taskkill',['/PID',String(server.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});if(log!==undefined)fs.closeSync(log);await client?.close();fs.writeFileSync(path.join(folder,'browser-e2e.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
