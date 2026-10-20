// Explicitly authorized Phase 5E.1 only: two calls total, no retry, test DB only.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import nextEnvironment from '@next/env';
import { MongoClient, ObjectId } from 'mongodb';
import { configureTestEnvironment, TEST_DATABASE, safeError } from './knowledge-generation-test-env.mjs';
import { loader } from '../tests/support/load-typescript.mjs';
const folder='.local/chat-phase-5e1-live', model='gemini-3.5-flash-lite', mode=process.argv[2];
fs.mkdirSync(folder,{recursive:true});
const read=name=>JSON.parse(fs.readFileSync(`${folder}/${name}.json`,'utf8'));
const save=(name,data)=>fs.writeFileSync(`${folder}/${name}.json`,JSON.stringify(data,null,2));
const sha=data=>createHash('sha256').update(data).digest('hex');
const protectedPaths=['.env.local','.local/chat-phase-5c1/generation-ledger.json','.local/chat-phase-5c2/generation-ledger.json','.local/chat-phase-5c3/generation-ledger.json','server/infrastructure/gemini-question-matcher.ts','server/services/chat-ai-config.ts','server/infrastructure/gemini-knowledge-generator.ts','server/services/knowledge-generation.ts','server/services/knowledge-generation-validation.ts'];
const hashes=()=>Object.fromEntries(protectedPaths.filter(p=>fs.existsSync(p)).map(p=>[p,sha(fs.readFileSync(p))]));
let client,lock;
nextEnvironment.loadEnvConfig(process.cwd(),true,{info(){},error(){}});
const key=process.env.GEMINI_API_KEY?.trim(), configuredModel=process.env.GEMINI_MODEL?.trim();
const {uri}=configureTestEnvironment();
async function environment(){
  assert.equal(configuredModel,model,'UNEXPECTED_MODEL');if(!key)throw Error('KEY_MISSING');
  client=new MongoClient(uri,{serverSelectionTimeoutMS:10000});await client.connect();const db=client.db(TEST_DATABASE);await db.command({ping:1});
  const hello=await db.command({hello:1});if(!(hello.setName||hello.msg==='isdbgrid')||!hello.logicalSessionTimeoutMinutes)throw Error('TRANSACTIONS_UNAVAILABLE');
  return db;
}
async function snapshot(db){return {questions:await db.collection('knowledge_questions').find().sort({_id:1}).toArray(),revisions:await db.collection('knowledge_question_revisions').find().sort({_id:1}).toArray(),audit:await db.collection('knowledge_audit').find().sort({_id:1}).toArray()};}
async function preflight(){
  if(fs.existsSync(`${folder}/preflight.json`))throw Error('PREFLIGHT_ALREADY_RECORDED');
  const db=await environment();
  const owner=JSON.parse(fs.readFileSync('.local/chat-phase-5c3/live-eligibility.json','utf8'));
  if(!owner.ownerConfirmedFreeTierNoBilling)throw Error('FREE_TIER_UNVERIFIED');
  const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}`,{headers:{'x-goog-api-key':key},signal:AbortSignal.timeout(10000)});
  if(!response.ok){save('model-preflight-error',{status:response.status,keyPresent:true});throw Error('MODEL_PREFLIGHT_FAILED');}
  const metadata=await response.json();if(!metadata.supportedGenerationMethods?.includes('generateContent'))throw Error('GENERATION_UNSUPPORTED');
  const browser=JSON.parse(fs.readFileSync('.local/chat-phase-5e1/browser-e2e.json','utf8'));
  const source=await db.collection('knowledge_sources').findOne({_id:browser.docxSourceId,sourceStatus:'confirmed'});
  if(!source?.confirmedBy)throw Error('CONFIRMED_SOURCE_MISSING');
  const chunks=await db.collection('knowledge_source_chunks').find({sourceId:source._id}).sort({order:1}).toArray();if(chunks.length!==1)throw Error('FIXTURE_CHUNKS_CHANGED');
  const actor=await db.collection('users').findOne({_id:new ObjectId(source.confirmedBy),role:'admin'});if(!actor)throw Error('TEST_ACTOR_MISSING');
  const oldProposal=await db.collection('knowledge_proposals').findOne({_id:browser.proposalId});
  const history=await db.collection('chat_interactions').findOne({groupId:oldProposal.originalChatGroupId,kind:'question',expiresAt:{$gt:new Date()}});if(!history)throw Error('HISTORY_FIXTURE_EXPIRED');
  const dailyLimit=Math.min(Number(process.env.KNOWLEDGE_GENERATION_DAILY_CALLS||5),20);
  const budget=await db.collection('knowledge_generation_budget').findOne({_id:`generation:${new Date().toISOString().slice(0,10)}`});
  if((budget?.calls||0)+2>dailyLimit)throw Error('TEST_DAILY_BUDGET_INSUFFICIENT');
  const report={status:'passed',at:new Date().toISOString(),target:TEST_DATABASE,keyPresent:!!key,model,apiVersion:'v1beta',sdkVersion:JSON.parse(fs.readFileSync('node_modules/@google/genai/package.json','utf8')).version,
    modelMetadataHttpStatus:response.status,generateContent:true,structuredOutputDocsSupported:true,
    freeTier:{officialPricingVerified:true,officialDocsCheckedOn:'2026-10-18',ownerConfirmation:owner.confirmationSource,ownerConfirmedAt:owner.confirmedAt,billingApiVerified:false,providerQuotaRemaining:null,
    pricingUrl:'https://ai.google.dev/gemini-api/docs/pricing',modelUrl:'https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite'},
    sourceId:source._id,chunkId:chunks[0]._id,sourceChecksum:source.checksum,chunkSha256:sha(chunks[0].text),actorId:actor._id.toHexString(),groupId:history.groupId,
    testDailyLimit:dailyLimit,testDailyBudgetUsed:budget?.calls||0,protectedHashes:hashes(),knowledgeSnapshotSha256:sha(JSON.stringify(await snapshot(db))),generationCalls:0};
  save('preflight',report);fs.writeFileSync(`${folder}/generation-ledger.json`,JSON.stringify({maximum:2,calls:0,attempts:[]},null,2),{flag:'wx'});
  save('source-snapshot',{source,chunks});console.log(JSON.stringify(report));
}
async function call(number){
  if(![1,2].includes(number))throw Error('INVALID_CALL');
  lock=fs.openSync(`${folder}/run.lock`,'wx');
  const pre=read('preflight');if(pre.status!=='passed'||pre.target!==TEST_DATABASE)throw Error('PREFLIGHT_REQUIRED');
  assert.deepEqual(hashes(),pre.protectedHashes,'PROTECTED_FILE_CHANGED');
  const ledger=read('generation-ledger');if(ledger.calls>=2||ledger.attempts.some(a=>a.number===number))throw Error('NO_RETRY_ALLOWED');
  if(number===2){const prior=read('call-1');if(prior.httpStatus!==200||!prior.schemaValid||prior.persistenceError||prior.failure)throw Error('STOP_AFTER_CALL_ONE_FAILURE');}
  if(number!==ledger.attempts.length+1)throw Error('SEQUENCE_REQUIRED');
  const db=await environment();assert.equal(sha(JSON.stringify(await snapshot(db))),pre.knowledgeSnapshotSha256,'KNOWLEDGE_CHANGED');
  const actor=await db.collection('users').findOne({_id:new ObjectId(pre.actorId),role:'admin'});if(!actor)throw Error('TEST_ACTOR_MISSING');
  process.env.GEMINI_API_KEY=key;process.env.KNOWLEDGE_GENERATION_ENABLED='true';
  const load=loader({'@/lib/db/client':{getDatabase:async()=>db,getMongoClient:async()=>client},'@/server/services/knowledge-admin':{requireKnowledgeAdmin:async()=>({userId:pre.actorId,email:actor.email})}});
  const service=load('@/server/services/knowledge-generation'),repo=load('@/server/repositories/knowledge-generation');
  const validation=load('@/server/services/knowledge-generation-validation'),schema=load('@/server/infrastructure/gemini-knowledge-generator').knowledgeGenerationSchema;
  const source=await repo.generationSource(pre.sourceId);assert.equal(source.source.sourceStatus,'confirmed');assert.equal(sha(source.chunks[0].text),pre.chunkSha256);
  const context=await service.adminGenerationContext(number===2?pre.groupId:undefined);
  // Rejected before reservation/generation: a client cannot supply the question text.
  await assert.rejects(()=>service.adminGenerateKnowledge({originalQuestion:'forged'}));
  const requestId=randomUUID(),batchId=sha(`${pre.actorId}:${requestId}`);
  const record={number,origin:number===1?'document':'chat_question',model,apiVersion:'v1beta',timeoutMs:30000,at:new Date().toISOString(),requestId,batchId,httpStatus:null,latencyMs:null,usage:null,jsonValid:false,schemaValid:false,citationValid:null,networkCalls:0,retries:0,serverResolvedQuestion:number===2,frontendQuestionRejected:true};
  ledger.attempts.push({number,requestId,batchId,status:'reserved',at:record.at});save('generation-ledger',ledger);
  const originalFetch=globalThis.fetch;let responseBody,output,started;
  globalThis.fetch=async(input,init)=>{
    const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);
    if(url.origin!=='https://generativelanguage.googleapis.com'||url.pathname!==`/v1beta/models/${model}:generateContent`||record.networkCalls!==0)throw Error('UNEXPECTED_TRANSPORT_OR_RETRY');
    const payload=JSON.parse(init.body),contents=JSON.parse(payload.contents[0].parts[0].text);
    assert.equal(contents.count,1);assert.equal(contents.originalQuestion,context.originalQuestion||undefined);assert.equal(contents.sources.length,1);assert.equal(contents.sources[0].chunkId,pre.chunkId);
    record.payloadSha256=sha(init.body);record.schemaSha256=sha(JSON.stringify(schema));
    record.networkCalls++;ledger.calls++;ledger.attempts.at(-1).status='sent';save('generation-ledger',ledger);started=performance.now();
    try{const response=await originalFetch(input,init);record.httpStatus=response.status;
      if(response.ok){responseBody=await response.clone().text();if(responseBody.includes(key))throw Error('UNSAFE_RESPONSE');fs.writeFileSync(`${folder}/call-${number}-provider-response.json`,responseBody,{flag:'wx'});}
      else {const failure=await response.clone().json().catch(()=>({}));record.providerError={httpStatus:response.status,code:typeof failure.error?.code==='number'?failure.error.code:null,status:/^[A-Z_]+$/.test(failure.error?.status||'')?failure.error.status:null};}
      return response;
    }finally{record.latencyMs=Math.round(performance.now()-started);}
  };
  try{
    const result=await service.adminGenerateKnowledge({requestId,sourceIds:[pre.sourceId],chunkIds:[pre.chunkId],count:1,...(number===2?{groupId:pre.groupId}:{})});
    assert.equal(result.batchId,batchId);const proposal=await repo.readProposal(batchId);save(`call-${number}-proposal`,proposal);
    record.proposalStatus=proposal.generationStatus;record.errorCode=proposal.errorCode||null;record.duplicates=proposal.duplicates;
    if(number===2)assert.equal(proposal.originalQuestion,context.originalQuestion);
    if(responseBody){const raw=JSON.parse(responseBody);record.actualModelVersion=raw.modelVersion||null;record.usage=raw.usageMetadata||null;record.finishReasons=raw.candidates?.map(c=>c.finishReason);
      const text=raw.candidates?.[0]?.content?.parts?.filter(p=>p.text&&!p.thought).map(p=>p.text).join('')||'';
      fs.writeFileSync(`${folder}/call-${number}-output.txt`,text,{flag:'wx'});
      try{output=JSON.parse(text);record.jsonValid=true;}catch{record.failure='INVALID_JSON';}
      if(output){record.schemaValid=validSchema(output,schema);record.outputCount=output.proposals?.length;record.insufficientEvidence=output.insufficientEvidence;
        if(record.schemaValid&&output.proposals.length===1){try{const parsed=validation.parseProposal(output.proposals[0],source.chunks);record.citationValid=true;record.groundingPassed=!parsed.insufficientEvidence;record.warnings=parsed.warnings;
          record.personas=Object.keys(parsed.characterAnswers);record.testDatabaseDuplicates=validation.detectDuplicates(parsed,(await repo.generationCandidates()).filter(c=>c.id!==`proposal:${batchId}`));
          // Compare only a local snapshot. Never connect to production for this check.
          const priorSnapshot=JSON.parse(fs.readFileSync('knowledge/draft-questions-phase-2-v4.json','utf8'));
          record.localV4SnapshotDuplicates=validation.detectDuplicates(parsed,priorSnapshot.map(q=>({id:q._id,revisionId:`${q._id}:v${q.version}`,canonicalQuestion:q.canonicalQuestion,aliases:q.aliases})));
        }catch(e){record.citationValid=false;record.validationFailure=e.code||'VALIDATION_FAILED';}}
      }
    }
  }catch(error){record.persistenceError=safeError(error);}
  finally{
    globalThis.fetch=originalFetch;ledger.attempts.at(-1).status='finished';save('generation-ledger',ledger);
    record.protectedFilesUnchanged=JSON.stringify(hashes())===JSON.stringify(pre.protectedHashes);record.knowledgeUnchanged=sha(JSON.stringify(await snapshot(db)))===pre.knowledgeSnapshotSha256;
    record.testBudgetAfter=await db.collection('knowledge_generation_budget').findOne({_id:`generation:${new Date().toISOString().slice(0,10)}`});save(`call-${number}`,record);console.log(JSON.stringify(record));
  }
}
function validSchema(value,schema){
  if(schema.type==='object')return value!==null&&typeof value==='object'&&!Array.isArray(value)&&(schema.required||[]).every(k=>k in value)&&(!schema.additionalProperties?Object.keys(value).every(k=>k in schema.properties):true)&&Object.entries(value).every(([k,v])=>!schema.properties[k]||validSchema(v,schema.properties[k]));
  if(schema.type==='array')return Array.isArray(value)&&(schema.minItems===undefined||value.length>=schema.minItems)&&(schema.maxItems===undefined||value.length<=schema.maxItems)&&value.every(v=>validSchema(v,schema.items));
  return typeof value===schema.type;
}
async function postflight(){
  const db=await environment(),pre=read('preflight'),ledger=read('generation-ledger');
  const state=await snapshot(db),proposals=await db.collection('knowledge_proposals').find({_id:{$in:ledger.attempts.map(a=>a.batchId)}}).toArray();
  const result={at:new Date().toISOString(),target:TEST_DATABASE,readOnly:true,liveCalls:ledger.calls,maximum:ledger.maximum,
    knowledgeUnchanged:sha(JSON.stringify(state))===pre.knowledgeSnapshotSha256,protectedFilesUnchanged:JSON.stringify(hashes())===JSON.stringify(pre.protectedHashes),
    logicalQuestions:state.questions.length,revisions:state.revisions.length,approvedRevisions:state.revisions.filter(r=>r.status==='approved').length,publishedPointers:state.questions.filter(q=>q.publishedVersionId).length,
    proposals:proposals.map(p=>({id:p._id,status:p.generationStatus,version:p.version,origin:p.origin,hasDraft:!!p.draftId})),
    testBudget:await db.collection('knowledge_generation_budget').find({}, {projection:{_id:1,calls:1}}).sort({_id:1}).toArray()};
  assert.equal(result.knowledgeUnchanged,true);assert.equal(result.protectedFilesUnchanged,true);assert.equal(result.liveCalls,2);assert.equal(proposals.length,2);
  save('postflight',result);console.log(JSON.stringify(result));
}
try{if(mode==='preflight')await preflight();else if(mode==='call-1')await call(1);else if(mode==='call-2')await call(2);else if(mode==='postflight')await postflight();else throw Error('INVALID_MODE');}
catch(error){console.log(JSON.stringify({status:'blocked_or_failed',error:safeError(error)}));process.exitCode=1;}
finally{await client?.close();if(lock!==undefined){fs.closeSync(lock);fs.unlinkSync(`${folder}/run.lock`);}}
