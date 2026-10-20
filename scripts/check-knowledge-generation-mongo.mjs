import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { randomUUID, createHash } from 'node:crypto';
import { MongoClient, GridFSBucket, ObjectId } from 'mongodb';
import { configureTestEnvironment, TEST_DATABASE, safeError } from './knowledge-generation-test-env.mjs';
import { loader } from '../tests/support/load-typescript.mjs';
const require = createRequire(import.meta.url), JSZip = require('jszip');
const phase5e2 = process.argv.includes('--phase5e2');
const folder = phase5e2 ? '.local/chat-phase-5e2' : '.local/chat-phase-5e1';
fs.mkdirSync(folder,{recursive:true});
const runId = randomUUID(), report = { runId, target: TEST_DATABASE, startedAt: new Date().toISOString(), status: 'running', checks: [], generationCalls: 0 };
let client;
const sha = v => createHash('sha256').update(v).digest('hex');
async function check(name, work) { await work(); report.checks.push({ name, status: 'passed' }); console.log('PASS', name); }
try {
  const { uri } = configureTestEnvironment();
  if (JSON.parse(fs.readFileSync(`${folder}/preflight.json`,'utf8')).status !== 'passed') throw Error('PREFLIGHT_REQUIRED');
  client = new MongoClient(uri,{serverSelectionTimeoutMS:10000}); await client.connect();
  const db = client.db(TEST_DATABASE); await db.command({ping:1});
  const actorId = new ObjectId(), actor = { userId: actorId.toHexString(), email:`integration-${runId}@phase5e1.test` };
  await db.collection('users').insertOne({_id:actorId,email:actor.email,role:'admin',authVersion:1,createdAt:new Date(),testRunId:runId});
  const load = loader({ '@/lib/db/client': { getDatabase:async()=>db,getMongoClient:async()=>client },
    '@/server/services/knowledge-admin': {requireKnowledgeAdmin:async()=>actor} });
  const repo = load('@/server/repositories/knowledge-generation'), service=load('@/server/services/knowledge-generation');
  const {PERSONA_FRAMES}=load('@/server/domain/knowledge-generation');
  const beforePointers=await db.collection('knowledge_questions').find({publishedVersionId:{$exists:true}}).sort({_id:1}).toArray();
  const manifest=JSON.parse(fs.readFileSync('knowledge/extraction-manifest.json','utf8'));
  const original=manifest.blocks.find(b=>b.sectionId==='I' && b.text.length>100 && b.text.length<1800) || manifest.blocks.find(b=>b.text.length>100&&b.text.length<1000);
  if(!original) throw Error('SOURCE_FIXTURE_MISSING');
  const core=original.text;
  const xmlEscape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  const zip=new JSZip();zip.file('[Content_Types].xml','<Types><Override ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('word/document.xml',`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${xmlEscape(core)}</w:t></w:r></w:p></w:body></w:document>`);
  const bytes=await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'});
  const file=`${folder}/historical-fixture-${runId}.docx`;fs.writeFileSync(file,bytes);
  let sourceId,pack;
  await check('GridFS upload/read checksum; metadata and source chunks',async()=>{
    ({sourceId}=await service.adminUploadKnowledge(bytes,'application/vnd.openxmlformats-officedocument.wordprocessingml.document',`fixture-${runId}.docx`));
    pack=await repo.generationSource(sourceId); assert.equal(pack.source.sourceStatus,'pending'); assert.equal(pack.source.checksum,sha(bytes));assert.equal(pack.chunks[0].text,core);
    const chunks=[];for await(const part of new GridFSBucket(db,{bucketName:'knowledge_private_files'}).openDownloadStream(new ObjectId(pack.source.storageRef))) chunks.push(part);
    assert.equal(sha(Buffer.concat(chunks)),sha(bytes));
  });
  await check('source confirmation and actor audit',async()=>{
    await service.adminConfirmSource(sourceId,{confirmed:true});pack=await repo.generationSource(sourceId);
    assert.equal(pack.source.confirmedBy,actor.userId);assert.equal(pack.source.sourceStatus,'confirmed');
    assert.equal(await db.collection('knowledge_generation_audit').countDocuments({entityId:sourceId,action:'confirm_source',actor:actor.userId}),1);
  });
  const content=(tag)=>({canonicalQuestion:`Tư liệu nêu nội dung gì về Cách mạng tháng Tám? [${runId}-${tag}]`,aliases:[`Đoạn tài liệu cho biết điều gì? [${runId}-${tag}]`,`Giải thích đoạn nguồn này? [${runId}-${tag}]`],neutralAnswer:core,
    characterAnswers:Object.fromEntries(Object.entries(PERSONA_FRAMES).map(([k,v])=>[k,v[0]+core])),evidence:[{sourceId,chunkId:pack.chunks[0]._id,quote:core}],warnings:[],insufficientEvidence:false});
  const proposal=(tag)=>{const id=randomUUID();return {_id:id,batchId:id,origin:'document',sourceIds:[sourceId],sourceChunkIds:[pack.chunks[0]._id],content:content(tag),duplicates:[],generationModel:'fixture-no-provider',promptVersion:'test-5e1',generationStatus:'ready_for_review',createdBy:actor.userId,createdAt:new Date(),updatedAt:new Date(),version:1,notes:'Test fixture only'};};
  const first=proposal('main');
  if (phase5e2) {
    const groupId = sha(runId), question = `Câu hỏi từ lịch sử integration [${runId}]`;
    await db.collection('chat_interactions').insertOne({_id:randomUUID(),sessionRef:sha('private'),characterId:'vo-nguyen-giap',kind:'question',createdAt:new Date(Date.now()-20*60000),expiresAt:new Date(Date.now()+86400000),question,redacted:false,groupId,requestHash:sha(question),outcome:'unresolved',matchingSource:'clarify',suggestedQuestionIds:[],providerCalls:0,cacheHit:false,latencyMs:1,reviewReason:'clarify',feedbackStatus:'not_requested'});
    const input = {requestId:randomUUID(),sourceId,chunkId:pack.chunks[0]._id,groupId,content:content('manual'),notes:'Manual test only'};
    let manualId;
    await check('manual proposal, DB-resolved history, audit, no budget consumption and no PII', async()=>{
      const budget=await repo.generationBudget(20);const result=await service.adminCreateManualKnowledge(input);manualId=result.proposalId;
      const p=await repo.readProposal(manualId);assert.equal(p.originalQuestion,question);assert.equal(p.originalChatGroupId,groupId);assert.equal(p.creationMethod,'manual');assert.equal(p.generationStatus,'ready_for_review');assert.equal(p.sessionRef,undefined);assert.equal(p.requestHash,undefined);
      assert.equal(await db.collection('knowledge_generation_audit').countDocuments({entityId:manualId,action:'create_manual',actor:actor.userId}),1);assert.deepEqual(await repo.generationBudget(20),budget);
    });
    await check('manual idempotency, changed payload conflict and concurrent same request',async()=>{
      const repeat=await service.adminCreateManualKnowledge(input);assert.equal(repeat.proposalId,manualId);assert.equal(repeat.reused,true);
      await assert.rejects(()=>service.adminCreateManualKnowledge({...input,notes:'changed'}),e=>e.code==='CONFLICT');
      const another={...input,requestId:randomUUID(),content:content('manual-concurrent')};
      const results=await Promise.all([service.adminCreateManualKnowledge(another),service.adminCreateManualKnowledge(another)]);assert.equal(results[0].proposalId,results[1].proposalId);
      assert.equal(await db.collection('knowledge_proposals').countDocuments({_id:results[0].proposalId}),1);
      assert.equal(await db.collection('knowledge_generation_audit').countDocuments({entityId:results[0].proposalId,action:'create_manual'}),1);
    });
    await check('manual edit then explicit Draft conversion preserves provenance',async()=>{
      await service.adminEditProposal(manualId,{action:'edit',version:1,content:input.content,notes:'Edited test'});
      const converted=await service.adminConvertProposal(manualId,{version:2,reviewedEvidence:true,reviewedPersonas:true,duplicateDecision:'reviewed'});
      const p=await repo.readProposal(manualId),r=await db.collection('knowledge_question_revisions').findOne({_id:converted.revisionId});
      assert.equal(p.revisionId,r._id);assert.equal(r.importBatchId,p.batchId);assert.equal(r.status,'draft');assert.equal(p.originalChatGroupId,groupId);
    });
    await check('chat groups count filter is applied after aggregation',async()=>{
      const history=load('@/server/repositories/chat-history'), filters=load('@/server/services/chat-history-admin');
      const f=filters.parseChatHistoryFilter({text:runId,minCount:1,maxCount:1});assert.equal((await history.queryChatGroups(f)).total,1);
      assert.equal((await history.queryChatGroups({...f,minCount:2,maxCount:3})).total,0);
    });
  }
  await check('proposal persistence, editing and compare-and-set',async()=>{
    await db.collection('knowledge_proposals').insertOne(first);
    await service.adminEditProposal(first._id,{action:'edit',version:1,content:first.content,notes:'Biên tập fixture integration'});
    assert.equal((await repo.readProposal(first._id)).version,2);
    await assert.rejects(()=>service.adminEditProposal(first._id,{action:'edit',version:1,content:first.content,notes:'stale'}),e=>e.code==='CONFLICT');
    const audit=await db.collection('knowledge_generation_audit').findOne({entityId:first._id,action:'edit'});assert.equal(audit.actor,actor.userId);assert.ok(audit.before.content);
  });
  const confirm={version:2,reviewedEvidence:true,reviewedPersonas:true,duplicateDecision:'reviewed'};let converted;
  await check('Draft conversion is atomic with audit, real actor and no Published pointer',async()=>{
    converted=await service.adminConvertProposal(first._id,confirm);
    const revision=await db.collection('knowledge_question_revisions').findOne({_id:converted.revisionId});
    assert.equal(revision.status,'draft');assert.equal(revision.reviewedBy,undefined);assert.equal(revision.createdBy,actor.userId);
    assert.equal((await db.collection('knowledge_questions').findOne({_id:converted.questionId})).publishedVersionId,undefined);
    assert.equal((await repo.readProposal(first._id)).generationStatus,'converted_to_draft');
    assert.equal(await db.collection('knowledge_audit').countDocuments({revisionId:converted.revisionId,actorId:actor.userId}),1);
  });
  await check('conversion cannot be replayed',async()=>{await assert.rejects(()=>service.adminConvertProposal(first._id,confirm),e=>e.code==='CONFLICT');assert.equal(await db.collection('knowledge_question_revisions').countDocuments({questionId:converted.questionId}),1);});
  const duplicate=proposal('duplicate');duplicate.content=first.content;
  await check('exact duplicate blocks new logical question; explicit existing target gets a fresh Draft revision',async()=>{
    await db.collection('knowledge_proposals').insertOne(duplicate);
    await assert.rejects(()=>service.adminConvertProposal(duplicate._id,{...confirm,version:1}),e=>e.code==='EXACT_DUPLICATE');
    const result=await service.adminConvertProposal(duplicate._id,{...confirm,version:1,targetId:converted.questionId});
    assert.equal(result.questionId,converted.questionId);assert.notEqual(result.revisionId,converted.revisionId);
    const prior=await db.collection('knowledge_question_revisions').findOne({_id:converted.revisionId});assert.equal(prior.status,'draft');
  });
  const racing=proposal('race');await db.collection('knowledge_proposals').insertOne(racing);
  await check('concurrent conversion commits exactly one revision and rejects the stale request',async()=>{
    const results=await Promise.allSettled([service.adminConvertProposal(racing._id,{...confirm,version:1}),service.adminConvertProposal(racing._id,{...confirm,version:1})]);
    assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected').length,1);
    const p=await repo.readProposal(racing._id);assert.equal(await db.collection('knowledge_question_revisions').countDocuments({_id:p.revisionId}),1);
  });
  const rollback=proposal('rollback');await db.collection('knowledge_proposals').insertOne(rollback);
  await check('transaction rollback leaves proposal and logical counts unchanged after late write failure',async()=>{
    const before=await db.collection('knowledge_questions').countDocuments();
    await assert.rejects(()=>repo.convertProposal(rollback._id,1,undefined,()=>({revision: {_id:converted.revisionId,questionId:converted.questionId,version:1,status:'draft',createdAt:new Date()},audit:{_id:randomUUID(),actorId:actor.userId}})));
    assert.equal(await db.collection('knowledge_questions').countDocuments(),before);assert.equal((await repo.readProposal(rollback._id)).generationStatus,'ready_for_review');
  });
  const reservation=proposal('idempotency');delete reservation.content;reservation.version=0;reservation.generationStatus='generating';
  await check('generation reservation idempotency preserves budget; no provider calls',async()=>{
    const key=`generation:${new Date().toISOString().slice(0,10)}`,budget=await db.collection('knowledge_generation_budget').findOne({_id:key});
    const a=await repo.reserveGeneration(reservation,20), b=await repo.reserveGeneration(reservation,20);
    assert.equal(a.started,true);assert.equal(b.started,false);assert.equal((await db.collection('knowledge_generation_budget').findOne({_id:key})).calls,(budget?.calls||0)+1);
    report.testBudgetReservations=1;
  });
  await check('indexes exist and source chunk ordering is unique',async()=>{
    const indexes=await db.collection('knowledge_source_chunks').listIndexes().toArray();assert.ok(indexes.some(i=>i.unique&&i.key.sourceId===1&&i.key.order===1));
    for(const collection of ['knowledge_sources','knowledge_proposals','knowledge_generation_audit','knowledge_private_files.files','knowledge_private_files.chunks']) assert.ok((await db.collection(collection).listIndexes().toArray()).length>=2);
  });
  await check('all pre-existing Published pointers unchanged; no approve/publish operations',async()=>{
    assert.deepEqual(await db.collection('knowledge_questions').find({publishedVersionId:{$exists:true}}).sort({_id:1}).toArray(),beforePointers);
    assert.equal(await db.collection('knowledge_audit').countDocuments({actorId:actor.userId,action:{$in:['approve','publish']}}),0);
  });
  fs.writeFileSync(`${folder}/integration-fixture.json`,JSON.stringify({runId,sourceId,docxFile:file,originalDocument:manifest.document,originalBlockId:original.id,originalSourceSha256:manifest.sourceSha256,core,actorId:actor.userId,proposalIds:[first._id,duplicate._id,racing._id,rollback._id,reservation._id]},null,2));
  report.status='passed';report.fixtureRecordsRetained=true;
}catch(error){report.status='failed';report.error=safeError(error);process.exitCode=1;}
finally{await client?.close();fs.writeFileSync(`${folder}/mongo-integration.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
