import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loader } from './support/load-typescript.mjs';

const id = 'a'.repeat(64), characterId = 'b'.repeat(24);
const source = p => fs.readFileSync(p, 'utf8');
test('runtime has no legacy Google synthesis client, credentials, voice catalogue or generation action', () => {
  const forbidden = /texttospeech\.googleapis|GoogleAuth|synthesizeSpeech|audioContent|GOOGLE_TTS|GOOGLE_APPLICATION_CREDENTIALS|GOOGLE_CLOUD_PROJECT|VIETNAMESE_VOICES|google-mp3-v1|speechSynthesis/i;
  function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (/\.(?:ts|tsx|js|mjs)$/.test(file)) assert.doesNotMatch(source(file), forbidden, file);
    }
  }
  for (const dir of ['actions', 'app', 'features', 'server', 'lib', 'hooks']) visit(dir);
  for (const file of ['actions/speech.ts', 'server/services/speech.ts', 'server/infrastructure/google-tts.ts', 'features/characters/voice-picker.tsx', 'features/characters/prepare-speech.tsx', '.env.tts.example']) assert.equal(fs.existsSync(file), false, file);
  const pkg = JSON.parse(source('package.json'));
  assert.equal(pkg.dependencies['google-auth-library'], undefined);
  assert.ok(pkg.dependencies['@google/genai']); assert.ok(pkg.dependencies['@aws-sdk/client-s3']);
  assert.match(source('app/layout.tsx'), /next\/font\/google/);
});
test('legacy character metadata is ignored publicly and preserved by an admin edit', async () => {
  const row = { _id: { toHexString: () => characterId }, name: 'Nhân vật', image: '/images/a.webp', backgroundImage: '/images/b.webp', openingLine: 'Xin chào', voiceName: 'legacy-voice', updatedAt: new Date() };
  const calls = [];
  const repository = loader({ '@/lib/db/client': { getDatabase: async () => ({ collection: () => ({
    createIndex: async () => {},
    findOneAndUpdate: async (filter, update) => { calls.push(update); Object.assign(row, update.$set); return row; },
  }) }) } })('@/server/repositories/characters');
  assert.equal(repository.publicCharacter(row).voiceName, undefined);
  const input = { name: 'Tên mới', image: row.image, backgroundImage: row.backgroundImage, openingLine: row.openingLine };
  await repository.saveCharacter(characterId, input);
  assert.equal(row.voiceName, 'legacy-voice'); assert.equal(calls[0].$unset, undefined);
  assert.equal(calls[0].$set.voiceName, undefined); assert.equal(row.name, 'Tên mới');
});
test('saving a character ignores obsolete client voice fields and never loads a TTS provider', async () => {
  let saved;
  const service = loader({
    './admin-auth': { requireAdmin: async () => {} },
    '@/server/repositories/characters': { saveCharacter: async (_, data) => { saved = data; return data; }, characterRecord: r => r },
  })('@/server/services/characters');
  const form = new FormData();
  for (const [key,value] of Object.entries({name:'Nhân vật',openingLine:'Xin chào',image:'/images/a.webp',backgroundImage:'/images/b.webp',voiceName:'forged-old-voice'})) form.set(key,value);
  await service.saveCharacterForm(null,form);
  assert.equal(saved.voiceName,undefined);
});
test('existing MP3 playlists still map to prompt and correct/incorrect feedback; missing audio is safe', () => {
  const originalCrypto = globalThis.crypto;
  const local = loader()('@/features/pwa/local-game');
  const question = { id:'q',characterId,question:'Câu hỏi?',answers:['A','B','C','D'],correctIndex:0,correctFeedback:'Đúng',incorrectFeedback:'Sai',audio:{prompt:[`/audio/${id}`],correct:[`/audio/${'c'.repeat(64)}`],incorrect:[`/audio/${'d'.repeat(64)}`]} };
  assert.deepEqual(local.localPublicQuestion(question).narration,question.audio.prompt);
  assert.deepEqual(local.gradeLocalQuestion(question,0).narration,question.audio.correct);
  assert.deepEqual(local.gradeLocalQuestion(question,1).narration,question.audio.incorrect);
  const missing={...question,audio:undefined};
  assert.equal(local.localPublicQuestion(missing).narration,undefined);
  assert.equal(local.gradeLocalQuestion(missing,1).correct,false);
  assert.equal(globalThis.crypto,originalCrypto);
});
test('offline pack retains supplied playlists without invoking generation or synthesis cache', async () => {
  const audio={prompt:[`/audio/${id}`],correct:[],incorrect:[]};
  const service=loader({'@/server/repositories/offline-game':{readOfflineGame:async()=>({characters:[{id:characterId}],questions:[{id:'q',characterId,audio}]})}})('@/server/services/offline-game');
  assert.deepEqual((await service.offlineGamePack()).questions[0].audio,audio);
});
test('R2 reader retains object path and Range without writing metadata or uploading', async () => {
  const calls=[];
  const repo=loader({'@/server/infrastructure/r2':{R2_BUCKET:'fixture',getR2Client:()=>({send:async(command)=>{calls.push(command);return{Body:'existing'};}})},'@/lib/db/client':{getDatabase:async()=>{throw Error('Reader must not access MongoDB');}}})('@/server/repositories/speech');
  assert.equal((await repo.readSpeechFile(id,'bytes=1-3')).Body,'existing');
  assert.equal(calls[0].constructor.name,'GetObjectCommand');
  assert.deepEqual(calls[0].input,{Bucket:'fixture',Key:`audio/tts/${id}.mp3`,Range:'bytes=1-3'});
});
test('audio route serves existing content/ranges, handles missing media and refuses malformed IDs', async () => {
  let calls=0,fail='';
  const {GET}=loader({'@/server/repositories/speech':{readSpeechFile:async(_,range)=>{
    calls++; if(fail){const e=new Error();e.name=fail;throw e;}
    return {Body:{transformToByteArray:async()=>new Uint8Array([1,2,3])},ContentLength:3,...(range?{ContentRange:'bytes 1-3/5'}:{})};
  }}})('@/app/audio/[id]/route');
  const request=(range)=>new Request(`http://test/audio/${id}`,{headers:range?{range}:{}});
  for(const [range,status] of [[undefined,200],['bytes=1-3',206]]){
    const response=await GET(request(range),{params:Promise.resolve({id})});
    assert.equal(response.status,status);assert.equal(response.headers.get('Content-Type'),'audio/mpeg');assert.equal((await response.arrayBuffer()).byteLength,3);
  }
  const count=calls;
  assert.equal((await GET(request(),{params:Promise.resolve({id:'../secret'})})).status,404);
  assert.equal((await GET(request('bytes=1-2,4-5'),{params:Promise.resolve({id})})).status,416);assert.equal(calls,count);
  for(const [name,status] of [['NoSuchKey',404],['InvalidRange',416],['Unavailable',503]]){fail=name;assert.equal((await GET(request(),{params:Promise.resolve({id})})).status,status);}
});
test('question narration formatter remains provider independent', () => {
  const {questionSpeech}=loader()('@/server/domain/speech');
  assert.equal(questionSpeech('Câu hỏi?',['Một','Hai','Ba','Bốn']),'Câu hỏi?\nĐáp án A. Một\nĐáp án B. Hai\nĐáp án C. Ba\nĐáp án D. Bốn');
});
