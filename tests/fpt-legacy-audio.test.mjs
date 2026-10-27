import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { MongoServerError } from 'mongodb';
import { loader } from './support/load-typescript.mjs';
const id='a'.repeat(24), characterId='b'.repeat(24), url='https://s3-ap-southeast-1.amazonaws.com/text2speech-v4/male.0.test.mp3';
const domain=loader()('@/server/domain/quiz-audio'), hash=loader()('@/server/domain/quiz-audio-hash');
let previous, originalFetch;
beforeEach(()=>{previous=process.env.FPT_TTS_API_KEY;originalFetch=globalThis.fetch;process.env.FPT_TTS_API_KEY='fixture-only';});
afterEach(()=>{globalThis.fetch=originalFetch;if(previous===undefined)delete process.env.FPT_TTS_API_KEY;else process.env.FPT_TTS_API_KEY=previous;});
const mp3=()=>{const bytes=Buffer.alloc(834);for(const at of [0,417])bytes.set([255,251,144,0],at);return bytes;};
test('seven verified voice IDs; hash reflects exact text, speed and character; key rejects traversal',()=>{
  assert.equal(domain.FPT_VOICES.length,7);assert.ok(domain.isFptVoice('leminh'));assert.equal(domain.isFptVoice('fake'),false);
  const value=hash.quizAudioHash('é',0,characterId);for(const args of [['é',0,characterId],['é ',0,characterId],['é',1,characterId],['é',0,id]])assert.notEqual(value,hash.quizAudioHash(...args));
  assert.throws(()=>hash.quizAudioKey('../x',id,'question',value,'leminh'));
  assert.throws(()=>hash.quizAudioKey(characterId,id,'question',value,'../x'));
});

test('MP3 validator rejects HTML, wrong MIME, ID3-only, bad sync, truncated and oversized data',()=>{
  const fpt=loader()('@/server/infrastructure/fpt-tts');fpt.validateMp3(mp3(),'audio/mpeg');
  for(const [bytes,mime] of [[Buffer.from('<html>error</html>'),'audio/mpeg'],[mp3(),'text/html'],[Buffer.from('ID3\x04\x00\x00\x00\x00\x00\x00'),'audio/mpeg'],[mp3().subarray(0,500),'audio/mpeg'],[Buffer.alloc(fpt.MAX_AUDIO_BYTES+1),'audio/mpeg']])assert.throws(()=>fpt.validateMp3(bytes,mime));
});

test('one FPT POST uses exact UTF-8 text and official headers; no retries or raw error leakage',async()=>{
  const fpt=loader()('@/server/infrastructure/fpt-tts');let calls=0;
  globalThis.fetch=async(target,init)=>{calls++;assert.equal(target,'https://api.fpt.ai/hmi/tts/v5');assert.equal(init.headers.api_key,'fixture-only');assert.equal(init.body,'Câu hỏi thử?');assert.equal(init.redirect,'error');return Response.json({error:0,async:url});};
  assert.equal(await fpt.requestFptAudio('Câu hỏi thử?','leminh',0),url);assert.equal(calls,1);
  for(const kind of ['quota','timeout','json','oversize']){calls=0;globalThis.fetch=async()=>{calls++;if(kind==='timeout')throw new DOMException('secret key','TimeoutError');if(kind==='json')return new Response('secret');if(kind==='oversize')return new Response('x'.repeat(17000));return new Response('secret',{status:429});};await assert.rejects(()=>fpt.requestFptAudio('Câu hỏi thử?','leminh',0),e=>!e.message.includes('secret'));assert.equal(calls,1);}
});

test('no key or invalid text/voice prevents all FPT requests',async()=>{
  const fpt=loader()('@/server/infrastructure/fpt-tts');globalThis.fetch=async()=>assert.fail('No provider allowed');
  await assert.rejects(()=>fpt.requestFptAudio('a','leminh',0));await assert.rejects(()=>fpt.requestFptAudio('hello','evil',0));delete process.env.FPT_TTS_API_KEY;await assert.rejects(()=>fpt.requestFptAudio('hello','leminh',0));
});

test('download polls only provider GET, rejects redirect/invalid files; length cap works without Content-Length',async()=>{
  const fpt=loader()('@/server/infrastructure/fpt-tts');let calls=0;
  globalThis.fetch=async(target,init)=>{calls++;assert.equal(target,url);assert.equal(init.redirect,'error');return calls===1?new Response('',{status:404}):new Response(mp3(),{headers:{'content-type':'audio/mpeg'}});};
  assert.equal((await fpt.downloadFptAudio(url)).length,834);assert.equal(calls,2);
  for(const response of [new Response('',{status:302}),new Response('<html>error</html>',{headers:{'content-type':'audio/mpeg'}}),new Response(Buffer.alloc(fpt.MAX_AUDIO_BYTES+1),{headers:{'content-type':'audio/mpeg'}})]){globalThis.fetch=async()=>response;await assert.rejects(()=>fpt.downloadFptAudio(url));}
});

test('polling exhaustion stops at six GETs, without retrying synthesis',async()=>{
  const fpt=loader()('@/server/infrastructure/fpt-tts');let calls=0;
  globalThis.fetch=async(target,init)=>{assert.equal(target,url);assert.notEqual(init.method,'POST');calls++;return new Response('',{status:404});};
  await assert.rejects(()=>fpt.downloadFptAudio(url),/chưa sẵn sàng/);assert.equal(calls,6);
});

test('repository uses existing speech_assets unique _id mutex and owner fencing, R2 Put only',async()=>{
  const updates=[],puts=[];let conflict=false;
  const rows={findOne:async filter=>{assert.equal(filter._id,`quiz-audio:${id}`);return null;},findOneAndUpdate:async(filter,update,options)=>{updates.push({filter,update,options});if(conflict)throw new MongoServerError({code:11000});return {_id:filter._id};},updateOne:async(filter,update)=>{updates.push({filter,update});return{matchedCount:1};}};
  const repo=loader({'@/lib/db/client':{getDatabase:async()=>({collection:name=>{assert.equal(name,'speech_assets');return rows;}})},'@/server/infrastructure/r2':{R2_BUCKET:'mock',getR2Client:()=>({send:async command=>{puts.push(command);}})}})('@/server/repositories/speech');
  await repo.claimQuizAudio(id,'owner','leminh');assert.equal(updates[0].options.upsert,true);assert.equal(updates[0].filter.$or.length,2);conflict=true;assert.equal(await repo.claimQuizAudio(id,'other','leminh'),null);
  await repo.saveQuizAudioSegment(id,'owner','question',{status:'ready'});assert.equal(updates.at(-1).filter.owner,'owner');assert.ok(updates.at(-1).filter.leaseUntil.$gt);
  await repo.releaseQuizAudio(id,'owner');assert.equal(updates.at(-1).filter.owner,'owner');
  await repo.uploadQuizAudio('quiz-audio/test.mp3',mp3());assert.equal(puts[0].constructor.name,'PutObjectCommand');assert.equal(puts[0].input.ContentType,'audio/mpeg');assert.equal(puts.length,1);
});

test('HTTP gates admin/origin, bounds input and sanitizes unexpected errors',async()=>{
  let admin=false,calls=0;
  const http=loader({'@/server/services/admin-auth':{hasAdminSession:async()=>admin}})('@/server/infrastructure/quiz-audio-http');
  const req=(origin='https://test.local',body='{}')=>new Request('https://test.local/api',{method:'POST',headers:{origin,'content-type':'application/json'},body});
  const run=async()=>{calls++;return{ok:true};};assert.equal((await http.quizAudioHttp(req(),run)).status,403);admin=true;assert.equal((await http.quizAudioHttp(req('https://evil.test'),run)).status,403);assert.equal(calls,0);
  assert.equal((await http.quizAudioHttp(req(),run)).status,200);assert.equal(calls,1);
  assert.equal((await http.quizAudioHttp(req(),()=>{throw Error('secret');})).status,503);
  for(const body of ['x','x'.repeat(2049)])await assert.rejects(()=>http.readQuizAudioBody(req(undefined,body)));
  assert.deepEqual(await http.readQuizAudioBody(req()),{});
});
