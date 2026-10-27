import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import { loader } from './support/load-typescript.mjs';

const id='a'.repeat(24), characterId='b'.repeat(24), url='https://cdn.ttsforfree.com/20261025/fixture.mp3';
const domain=loader()('@/server/domain/quiz-audio');
const envKeys=['TTSFORFREE_API_KEY','TTSFORFREE_ENABLED',...Array.from({length:4},(_,i)=>[`TTSFORFREE_VOICE_${i+1}_ID`,`TTSFORFREE_VOICE_${i+1}_LABEL`]).flat()];
let previous, originalFetch;
beforeEach(()=>{
  previous=Object.fromEntries(envKeys.map(k=>[k,process.env[k]]));originalFetch=globalThis.fetch;
  for(const key of envKeys)delete process.env[key];
  Object.assign(process.env,{TTSFORFREE_API_KEY:'fixture-only',TTSFORFREE_ENABLED:'true',TTSFORFREE_VOICE_1_ID:'v1:one',TTSFORFREE_VOICE_1_LABEL:'Giọng Một',TTSFORFREE_VOICE_2_ID:'v1:two'});
  globalThis.fetch=async()=>assert.fail('Live network is forbidden');
});
afterEach(()=>{globalThis.fetch=originalFetch;for(const [key,value] of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value;}});
const fixture=()=>({_id:new ObjectId(id),characterId,question:'Ai đang đặt câu hỏi?',answers:['Một','Hai','Ba','Bốn'],correctIndex:2,correctFeedback:'Đúng rồi bạn ơi.',incorrectFeedback:'Chưa đúng bạn nhé.',createdAt:new Date(),updatedAt:new Date()});
function setup(options={}) {
  let question=fixture(),manifest=null;
  const calls={create:0,poll:0,download:0,upload:0,writes:0,reads:0};
  const load=loader({
    './admin-auth':{requireAdmin:async()=>{if(options.denied)throw Error('Unauthorized');}},
    '@/server/repositories/character-questions':{findCharacterQuestion:async()=>{calls.reads++;return question;}},
    '@/server/infrastructure/r2':{isR2Configured:()=>!options.noR2,R2_PUBLIC_BASE_URL:'https://media.example.test'},
    '@/server/repositories/speech':{
      readQuizAudio:async(_,provider)=>{assert.equal(provider,'ttsforfree');return manifest;},
      claimQuizAudio:async(_,owner,voiceId,provider)=>{assert.equal(provider,'ttsforfree');if(manifest?.owner)return null;manifest={...(manifest||{_id:`quiz-audio:ttsforfree:${id}`,kind:'quiz-audio',questionId:id,segments:{}}),voiceId,owner,leaseUntil:new Date(Date.now()+600000)};return structuredClone(manifest);},
      saveQuizAudioSegment:async(_,owner,segment,asset,provider)=>{assert.equal(provider,'ttsforfree');assert.equal(owner,manifest.owner);manifest.segments[segment]=structuredClone(asset);calls.writes++;},
      releaseQuizAudio:async(_,owner,provider)=>{assert.equal(provider,'ttsforfree');assert.equal(owner,manifest.owner);delete manifest.owner;delete manifest.leaseUntil;},
      uploadQuizAudio:async(key,bytes)=>{calls.upload++;assert.match(key,/^quiz-audio\/ttsforfree\//);assert.equal(bytes.length,834);if(options.uploadFailure)throw Error('secret upload failure');},
    },
    '@/server/infrastructure/ttsforfree':{
      downloadTtsForFreeAudio:async value=>{calls.download++;assert.equal(value,url);if(options.downloadFailure)throw Error('secret download failure');return mp3();},
      createTtsForFreeJob:async(text,voice,pitch)=>{calls.create++;options.texts?.push({text,voice,pitch});if(options.hold)await options.hold;if(options.createFailure)throw Error('secret');return String(calls.create);},
      waitForTtsForFreeJob:async job=>{calls.poll++;assert.ok(Object.values(manifest.segments).some(asset=>asset.jobId===job));if(options.pollFailure)throw new (load('@/server/domain/quiz-audio').QuizAudioError)('Job chưa sẵn sàng.',502);if(options.terminalFailure)throw new (load('@/server/domain/quiz-audio').QuizAudioError)('Job thất bại.',502,'TTS_JOB_FAILED');if(options.editDuringPoll)question.question+=' đã sửa';return url;},
    },
  });
  return {service:load('@/server/services/quiz-audio'),calls,options,get manifest(){return manifest;},get question(){return question;},set question(value){question=value;}};
}
const request=(segments=['question'],voiceId='v1:one')=>({segments,voiceId,confirmed:true});
const mp3=()=>{const bytes=Buffer.alloc(834);for(const at of [0,417])bytes.set([255,251,144,0],at);return bytes;};

test('seven segments preserve exact question/feedback and add only A–D labels',()=>{
  const q=fixture(),texts=domain.quizAudioTexts(q);assert.deepEqual(Object.keys(texts),domain.AUDIO_SEGMENTS);assert.equal(texts.question,q.question);assert.equal(texts.optionC,'Đáp án C. Ba');assert.equal(texts.correctFeedback,q.correctFeedback);q.answers[0]=' ';assert.equal(domain.quizAudioTexts(q).optionA,'');
});
test('configuration exposes only labels/IDs; blank, duplicate or malformed IDs cannot generate',async()=>{
  const run=setup();assert.equal((await run.service.loadQuizAudio(id)).voices.length,2);
  assert.equal(JSON.stringify(await run.service.loadQuizAudio(id)).includes('fixture-only'),false);
  for(const [key,value] of [['TTSFORFREE_VOICE_2_ID','v1:one'],['TTSFORFREE_VOICE_1_ID','invalid space'],['TTSFORFREE_ENABLED','false'],['TTSFORFREE_API_KEY','']]){const old=process.env[key];process.env[key]=value;await assert.rejects(()=>run.service.generateQuizAudio(id,request()));process.env[key]=old;}
  delete process.env.TTSFORFREE_VOICE_1_ID;delete process.env.TTSFORFREE_VOICE_2_ID;assert.equal((await run.service.loadQuizAudio(id)).canGenerate,false);assert.equal(run.calls.create,0);
});
test('admin authorization precedes DB and provider; invalid or missing question rejected',async()=>{
  const run=setup({denied:true});await assert.rejects(()=>run.service.loadQuizAudio(id),/Unauthorized/);await assert.rejects(()=>run.service.generateQuizAudio(id,request()),/Unauthorized/);assert.equal(run.calls.reads,0);
  const other=setup();await assert.rejects(()=>other.service.loadQuizAudio('../bad'));other.question=null;await assert.rejects(()=>other.service.generateQuizAudio(id,request()),/không còn/);assert.equal(other.calls.create,0);
});
test('rejects injected text/key/host, unconfigured voice, duplicate segments and no confirmation',async()=>{
  const {service}=setup();for(const input of [null,{...request(),text:'forged'},{...request(),apiKey:'forged'},{...request(),baseUrl:'https://evil.test'},request(['question','question']),request(['invalid']),request(['question'],'evil'),{...request(),confirmed:false},request(Array(8).fill('question'))])await assert.rejects(()=>service.generateQuizAudio(id,input));
  await assert.rejects(()=>service.loadQuizAudio(id,'evil'));
});
test('all seven segments generate independently; URLs persist and reload/replay never synthesizes',async()=>{
  const run=setup({texts:[]});assert.equal((await run.service.loadQuizAudio(id)).status,'no_audio');
  let result=await run.service.generateQuizAudio(id,request(['optionD']));assert.equal(result.segments[4].status,'ready');assert.match(result.segments[4].url,/^https:\/\/media.example.test\/quiz-audio\/ttsforfree\//);assert.equal(run.manifest.segments.optionD.url,result.segments[4].url);assert.ok(!JSON.stringify(result).includes('cdn.ttsforfree.com'));
  result=await run.service.generateQuizAudio(id,request(domain.AUDIO_SEGMENTS));assert.equal(result.status,'ready');assert.equal(run.calls.create,7);
  await run.service.generateQuizAudio(id,request(domain.AUDIO_SEGMENTS));await run.service.loadQuizAudio(id);assert.equal(run.calls.create,7);assert.equal(run.calls.poll,7);assert.equal(run.calls.upload,7);
  assert.equal(run.options.texts.find(x=>x.text===fixture().correctFeedback).voice,'v1:one');assert.ok(!JSON.stringify(result).includes('jobId'));
});
test('content, voice and character changes invalidate URL; old stored metadata untouched by reads',async()=>{
  const run=setup();await run.service.generateQuizAudio(id,request());const old=structuredClone(run.manifest.segments.question);
  run.question.question+=' mới';assert.equal((await run.service.loadQuizAudio(id)).segments[0].status,'stale');assert.equal((await run.service.loadQuizAudio(id)).segments[0].url,undefined);assert.deepEqual(run.manifest.segments.question,old);
  run.question=fixture();assert.equal((await run.service.loadQuizAudio(id,'v1:two')).segments[0].status,'stale');run.question.characterId=id;assert.equal((await run.service.loadQuizAudio(id)).segments[0].status,'stale');
});
test('hash includes exact text, voice, pitch, provider and character',()=>{
  const hash=loader()('@/server/domain/quiz-audio-hash'),args=['é','v1:one',0,characterId],base=hash.ttsForFreeAudioHash(...args);
  for(const changed of [['é','v1:one',0,characterId],['é','v1:two',0,characterId],['é','v1:one',1,characterId],['é','v1:one',0,id]])assert.notEqual(hash.ttsForFreeAudioHash(...changed),base);
  assert.notEqual(hash.quizAudioHash('é',0,characterId),base);
});
test('poll failure keeps job ID; manual continuation never repeats POST',async()=>{
  const run=setup({pollFailure:true});let result=await run.service.generateQuizAudio(id,request());assert.equal(result.segments[0].status,'failed');assert.equal(run.manifest.segments.question.jobId,'1');
  run.options.pollFailure=false;result=await run.service.generateQuizAudio(id,request());assert.equal(result.segments[0].status,'ready');assert.equal(run.calls.create,1);assert.equal(run.calls.poll,2);
});
test('provider failure stops batch, sanitizes error and keeps completed segments',async()=>{
  const run=setup();await run.service.generateQuizAudio(id,request());run.options.createFailure=true;
  const result=await run.service.generateQuizAudio(id,request(['optionA','optionB']));assert.deepEqual(result.segments.slice(0,3).map(x=>x.status),['ready','failed','missing']);assert.equal(run.calls.create,2);assert.ok(!JSON.stringify(result).includes('secret'));assert.equal(run.manifest.owner,undefined);
});
test('concurrent generation is rejected; lease released; empty text never billed',async()=>{
  let release;const run=setup({hold:new Promise(resolve=>{release=resolve;})});const first=run.service.generateQuizAudio(id,request());
  while(!run.calls.create)await new Promise(resolve=>setImmediate(resolve));await assert.rejects(()=>run.service.generateQuizAudio(id,request()),/lượt khác/);release();await first;assert.equal(run.calls.create,1);assert.equal(run.manifest.owner,undefined);
  run.question.question=' ';const result=await run.service.generateQuizAudio(id,request());assert.equal(result.segments[0].status,'unavailable');assert.equal(run.calls.create,1);
});
test('concurrent content edit never exposes old audio as current',async()=>{
  const run=setup({editDuringPoll:true});const view=await run.service.generateQuizAudio(id,request());assert.equal(view.segments[0].status,'stale');assert.equal(view.segments[0].url,undefined);
});
test('repository separates provider namespaces, preserving existing FPT manifests',async()=>{
  const filters=[];const rows={findOne:async f=>{filters.push(f);return null;},findOneAndUpdate:async f=>{filters.push(f);return {};},updateOne:async f=>{filters.push(f);return{matchedCount:1};}};
  const repo=loader({'@/lib/db/client':{getDatabase:async()=>({collection:()=>rows})}})('@/server/repositories/speech');
  await repo.readQuizAudio(id);assert.equal(filters.pop()._id,`quiz-audio:${id}`);
  await repo.readQuizAudio(id,'ttsforfree');await repo.claimQuizAudio(id,'owner','v1:one','ttsforfree');await repo.saveQuizAudioSegment(id,'owner','question',{},'ttsforfree');await repo.releaseQuizAudio(id,'owner','ttsforfree');
  assert.ok(filters.every(f=>f._id===`quiz-audio:ttsforfree:${id}`));
});
test('provider POST contract, fixed host, no redirects; only SUCCESS yields verified URL',async()=>{
  const provider=loader()('@/server/infrastructure/ttsforfree');const calls=[];
  globalThis.fetch=async(target,init)=>{calls.push({target,init});return Response.json(init.method==='POST'?{Id:42,ExpectUrl:'https://evil.test'}:{Status:'SUCCESS',Data:url});};
  assert.equal(await provider.createTtsForFreeJob('Nội dung Việt','v1:one',0),'42');assert.equal(await provider.waitForTtsForFreeJob('42'),url);
  assert.equal(calls[0].target,'https://api.ttsforfree.com/api/tts/createby');assert.equal(calls[0].init.headers['X-API-Key'],'fixture-only');assert.equal(calls[0].init.redirect,'error');assert.deepEqual(JSON.parse(calls[0].init.body),{Texts:'Nội dung Việt',Voice:'v1:one',Pitch:0,ConnectionId:'',CallbackUrl:''});assert.equal(calls.length,2);
});
test('429/403/500/timeout/bad JSON/oversize return sanitized errors without POST retry',async()=>{
  const provider=loader()('@/server/infrastructure/ttsforfree');
  for(const failure of [429,403,500,'timeout','json','oversize','id']){let calls=0;globalThis.fetch=async()=>{calls++;if(failure==='timeout')throw Error('secret key');if(failure==='json')return new Response('secret key');if(failure==='oversize')return new Response('x'.repeat(17000));if(failure==='id')return Response.json({Id:-1,Message:'secret key'});return new Response('secret key',{status:failure});};await assert.rejects(()=>provider.createTtsForFreeJob('test','v1:one',0),e=>!e.message.includes('secret'));assert.equal(calls,1);}
});
test('status ERROR/429 and invalid URLs stop polling immediately without create',async()=>{
  const provider=loader()('@/server/infrastructure/ttsforfree');
  for(const value of [{Status:'ERROR',Message:'secret'},{Status:'SUCCESS',Data:'http://localhost/a.mp3'},{Status:'SUCCESS',Data:'https://cdn.ttsforfree.com.evil.test/a.mp3'}]){let calls=0;globalThis.fetch=async(_,init)=>{calls++;assert.equal(init.method,'GET');return Response.json(value);};await assert.rejects(()=>provider.waitForTtsForFreeJob('1'),e=>!e.message.includes('secret'));assert.equal(calls,1);}
  globalThis.fetch=async()=>new Response('',{status:429});await assert.rejects(()=>provider.waitForTtsForFreeJob('1'),/429/);
  for(const invalid of ['https://user:pass@cdn.ttsforfree.com/a.mp3','https://cdn.ttsforfree.com:444/a.mp3','https://cdn.ttsforfree.com/a.html','https://127.0.0.1/a.mp3','javascript:alert(1)'])assert.throws(()=>provider.verifiedTtsForFreeUrl(invalid));
});
test('pending polling is bounded to 12 GETs and 5s intervals without resubmission',async context=>{
  context.mock.timers.enable({apis:['setTimeout','Date'],now:100000});let calls=0;
  globalThis.fetch=async()=>{calls++;return Response.json({Status:'PENDING',ExpectUrl:url});};
  const provider=loader()('@/server/infrastructure/ttsforfree');const result=assert.rejects(()=>provider.waitForTtsForFreeJob('1'),/đang được xử lý/);
  for(let i=0;i<12;i++){await new Promise(resolve=>setImmediate(resolve));context.mock.timers.tick(5000);}
  await result;assert.equal(calls,12);
});
test('invalid input/key prevents provider requests',async()=>{
  const provider=loader()('@/server/infrastructure/ttsforfree');await assert.rejects(()=>provider.createTtsForFreeJob('','v1:one',0));await assert.rejects(()=>provider.createTtsForFreeJob('x'.repeat(5001),'v1:one',0));await assert.rejects(()=>provider.waitForTtsForFreeJob('../1'));delete process.env.TTSFORFREE_API_KEY;await assert.rejects(()=>provider.createTtsForFreeJob('test','v1:one',0));
});
test('missing R2 blocks generation before any paid POST',async()=>{
  const run=setup({noR2:true});assert.equal((await run.service.loadQuizAudio(id)).canGenerate,false);await assert.rejects(()=>run.service.generateQuizAudio(id,request()),/R2/);assert.equal(run.calls.create,0);
});
test('download/R2 failures preserve final URL and job; continuation does not synthesize or poll again',async()=>{
  for(const failure of ['downloadFailure','uploadFailure']){
    const run=setup({[failure]:true});let result=await run.service.generateQuizAudio(id,request());assert.equal(result.segments[0].status,'failed');assert.equal(result.segments[0].url,undefined);assert.equal(run.manifest.segments.question.providerUrl,url);assert.ok(!JSON.stringify(result).includes('secret'));
    run.options[failure]=false;result=await run.service.generateQuizAudio(id,request());assert.equal(result.segments[0].status,'ready');assert.equal(run.calls.create,1);assert.equal(run.calls.poll,1);assert.equal(run.calls.download,2);assert.equal(run.manifest.segments.question.providerUrl,undefined);
  }
});
test('terminal ERROR retains failed job ID; a new job needs another explicit confirmed request',async()=>{
  const run=setup({terminalFailure:true});await run.service.generateQuizAudio(id,request());assert.equal(run.calls.create,1);assert.equal(run.manifest.segments.question.failedJobId,'1');assert.equal(run.manifest.segments.question.jobId,undefined);
  await run.service.loadQuizAudio(id);assert.equal(run.calls.create,1);run.options.terminalFailure=false;await run.service.generateQuizAudio(id,request());assert.equal(run.calls.create,2);assert.equal(run.manifest.segments.question.status,'ready');
});
test('R2 object key rejects traversal and isolates provider/character/question/segment/hash',()=>{
  const hash=loader()('@/server/domain/quiz-audio-hash'),digest=hash.ttsForFreeAudioHash('text','v1:opaque/token',0,characterId);
  assert.equal(hash.ttsForFreeAudioKey(characterId,id,'question',digest),`quiz-audio/ttsforfree/${characterId}/${id}/question/${digest}.mp3`);
  assert.throws(()=>hash.ttsForFreeAudioKey('../bad',id,'question',digest));assert.throws(()=>hash.ttsForFreeAudioKey(characterId,id,'../bad',digest));
});
test('CDN download strips credentials, disallows redirects and validates real MP3 frames',async()=>{
  const provider=loader()('@/server/infrastructure/ttsforfree');let calls=0;
  globalThis.fetch=async(target,init)=>{calls++;assert.equal(target,url);assert.equal(init.headers,undefined);assert.equal(init.redirect,'error');return new Response(mp3(),{headers:{'content-type':'audio/mpeg'}});};
  assert.equal((await provider.downloadTtsForFreeAudio(url)).length,834);assert.equal(calls,1);
  await assert.rejects(()=>provider.downloadTtsForFreeAudio('https://localhost/a.mp3'));assert.equal(calls,1);
  for(const response of [new Response('',{status:302}),new Response('<html>error</html>',{headers:{'content-type':'audio/mpeg'}}),new Response(mp3(),{headers:{'content-type':'text/html'}}),new Response(Buffer.alloc(5*1024*1024+1),{headers:{'content-type':'audio/mpeg'}})]){globalThis.fetch=async()=>response;await assert.rejects(()=>provider.downloadTtsForFreeAudio(url));}
});
