import test from 'node:test';
import assert from 'node:assert/strict';
import {loader} from './support/load-typescript.mjs';

const id='a'.repeat(24),characterId='b'.repeat(24),round='12345678-1234-1234-1234-123456789abc';
const load=loader(),hash=load('@/server/domain/quiz-audio-hash'),domain=load('@/server/domain/quiz-audio');
const question=()=>({id,characterId,question:'Câu hỏi đã lưu?',answers:['Một','Hai','Ba','Bốn'],correctIndex:1,correctFeedback:'Đúng rồi.',incorrectFeedback:'Chưa đúng.',updatedAt:''});
function manifest(q=question()){
  const texts=domain.quizAudioTexts(q);return {_id:`quiz-audio:ttsforfree:${id}`,kind:'quiz-audio',questionId:id,voiceId:'v1:fixture',segments:Object.fromEntries(domain.AUDIO_SEGMENTS.map(segment=>{const textHash=hash.ttsForFreeAudioHash(texts[segment],'v1:fixture',0,characterId);return [segment,{segmentType:segment,status:'ready',provider:'ttsforfree',voiceId:'v1:fixture',pitch:0,textHash,r2Key:hash.ttsForFreeAudioKey(characterId,id,segment,textHash),url:'https://media.example.test/ignored',jobId:'private-job'}];}))};
}
test('ready stored MP3s map to ordered question/A–D and separate feedback; no provider metadata leaks',()=>{
  const service=loader()('@/server/services/quiz-audio-playback'),audio=service.playableQuestionAudio(id,question(),manifest());
  assert.equal(audio.prompt.length,5);assert.equal(audio.correct.length,1);assert.equal(audio.incorrect.length,1);
  for(const [index,segment] of ['question','optionA','optionB','optionC','optionD'].entries())assert.match(audio.prompt[index],new RegExp(`/audio/quiz/${characterId}/${id}/${segment}/[a-f0-9]{64}$`));
  assert.match(audio.correct[0],/correctFeedback/);assert.match(audio.incorrect[0],/incorrectFeedback/);assert.ok(!JSON.stringify(audio).includes('private-job'));
});
test('wrong text/voice/owner/key or non-ready assets never become playable; missing parts are skipped',()=>{
  const {playableQuestionAudio}=loader()('@/server/services/quiz-audio-playback');
  for(const changes of [{status:'failed'},{status:'generating'},{textHash:'c'.repeat(64)},{voiceId:'v1:other'},{provider:'fpt'},{pitch:1},{r2Key:'../foreign'}]){const m=manifest();Object.assign(m.segments.question,changes);assert.equal(playableQuestionAudio(id,question(),m).prompt.length,4);}
  const m=manifest();m.questionId='c'.repeat(24);assert.equal(playableQuestionAudio(id,question(),m).prompt.length,0);
  assert.equal(playableQuestionAudio(id,{...question(),characterId:'c'.repeat(24)},manifest()).prompt.length,0);
  const partial=manifest();delete partial.segments.optionC;assert.equal(playableQuestionAudio(id,question(),partial).prompt.length,4);
  assert.equal(playableQuestionAudio(id,{...question(),question:'Nội dung sửa'},manifest()).prompt.length,4);
});
test('offline pack queries audio once, changes version when audio becomes ready and preserves local grading',async()=>{
  let rows=[],reads=0;const q=question();
  const service=loader({
    '@/server/repositories/offline-game':{readOfflineGame:async()=>({characters:[{id:characterId}],questions:[q]})},
    '@/server/repositories/speech':{readQuizAudioBatch:async ids=>{reads++;assert.deepEqual(ids,[id]);return rows;}},
  })('@/server/services/offline-game');
  const before=await service.offlineGamePack();assert.equal(before.questions[0].audio.prompt.length,0);
  rows=[manifest()];const after=await service.offlineGamePack();assert.notEqual(after.version,before.version);assert.equal(reads,2);
  const local=loader()('@/features/pwa/local-game');assert.equal(local.localPublicQuestion(after.questions[0]).narration.length,5);assert.match(local.gradeLocalQuestion(after.questions[0],1).narration[0],/correctFeedback/);assert.match(local.gradeLocalQuestion(after.questions[0],0).narration[0],/incorrectFeedback/);
});
function sessionFixture(){
  let attempt;const q=question();const repo={getQuiz:async()=>attempt,reserveQuiz:async row=>{attempt=row;return true;},limitQuizGeneration:async()=>{},failQuiz:async()=>{},finishQuiz:async(_,value,fact,sources,sourceQuestionId)=>Object.assign(attempt,{state:'ready',question:value,sourceQuestionId,fact,sources}),chooseAnswer:async(_,__,selectedIndex)=>{attempt.selectedIndex??=selectedIndex;return attempt;}};
  const service=loader({
    './player-session':{playerSession:async()=> 'owner'},
    '@/server/repositories/characters':{findCharacter:async()=>({})},
    '@/server/repositories/question-cycles':{drawCharacterQuestion:async()=>({...q,_id:{toHexString:()=>id}})},
    '@/server/repositories/quizzes':repo,
    '@/server/repositories/speech':{readQuizAudio:async(questionId,provider)=>{assert.equal(questionId,id);assert.equal(provider,'ttsforfree');return manifest();}},
  })('@/server/services/quizzes');
  return {service};
}

test('admin list counts only current playable audio with one batch read and no private metadata',async()=>{
  let rows=[manifest()],reads=0;
  const {questionAudioSummaries}=loader({'@/server/repositories/speech':{readQuizAudioBatch:async ids=>{reads++;assert.deepEqual(ids,[id]);return rows;}}})('@/server/services/question-audio-summary');
  assert.deepEqual(await questionAudioSummaries([]),{});assert.equal(reads,0);
  assert.deepEqual(await questionAudioSummaries([question()]),{[id]:7});
  assert.deepEqual(await questionAudioSummaries([{...question(),question:'Nội dung đã sửa'}]),{[id]:6});
  rows[0].segments.optionA.status='generating';rows[0].segments.optionB.status='failed';delete rows[0].segments.optionC;
  assert.deepEqual(await questionAudioSummaries([question()]),{[id]:4});
  rows=[];assert.deepEqual(await questionAudioSummaries([question()]),{[id]:0});assert.equal(reads,4);
});

test('admin list distinguishes an unavailable lookup from zero audio files',async()=>{
  const {questionAudioSummaries}=loader({'@/server/repositories/speech':{readQuizAudioBatch:async()=>{throw Error('offline');}}})('@/server/services/question-audio-summary');
  assert.deepEqual(await questionAudioSummaries([question()]),{[id]:null});
});
test('online QR round and repeat load contain narration; only graded feedback is returned',async()=>{
  const {service}=sessionFixture();const result=await service.startQuiz(characterId,round);assert.equal(result.narration.length,5);assert.equal(result.correctIndex,undefined);assert.ok(!JSON.stringify(result).includes('Feedback'));
  assert.deepEqual(await service.startQuiz(characterId,round),result);assert.match((await service.answerQuiz(round,1)).narration[0],/correctFeedback/);
  const other=sessionFixture();await other.service.startQuiz(characterId,round);assert.match((await other.service.answerQuiz(round,0)).narration[0],/incorrectFeedback/);
});
test('media lookup failure leaves quiz playable; incomplete legacy attempt needs no DB audio query',async()=>{
  let calls=0;const {quizAttemptAudio}=loader({'@/server/repositories/speech':{readQuizAudio:async()=>{calls++;throw Error('unavailable');}}})('@/server/services/quiz-audio-playback');
  assert.deepEqual(await quizAttemptAudio({question:{},characterId}),{prompt:[],correct:[],incorrect:[]});assert.equal(calls,0);
  assert.deepEqual(await quizAttemptAudio({sourceQuestionId:id,question:{},characterId}),{prompt:[],correct:[],incorrect:[]});assert.equal(calls,1);
});
test('audio refresh preserves drawn question/correct index and never plays mismatched feedback',()=>{
  const {refreshLocalAudio}=loader()('@/features/pwa/local-game'),original=question(),fresh={...original,correctIndex:3,correctFeedback:'Đã sửa',audio:{prompt:['prompt'],correct:['new-correct'],incorrect:['wrong']}};
  const result=refreshLocalAudio(original,fresh);assert.equal(result.correctIndex,original.correctIndex);assert.equal(result.correctFeedback,original.correctFeedback);assert.deepEqual(result.audio,{prompt:['prompt'],correct:[],incorrect:['wrong']});
  assert.equal(refreshLocalAudio(original,{...fresh,question:'Khác'}),original);assert.equal(refreshLocalAudio(original,{...fresh,audio:undefined}),original);
});
test('public quiz audio route validates immutable path, supports byte ranges, never accesses database/provider',async()=>{
  const calls=[];const asset=['b'.repeat(24),'a'.repeat(24),'question','c'.repeat(64)];
  const {GET}=loader({'@/server/repositories/speech':{readQuizAudioFile:async(key,range)=>{calls.push({key,range});return{Body:{transformToByteArray:async()=>new Uint8Array([1,2,3])},ContentLength:3,...(range?{ContentRange:'bytes 0-2/3'}:{})};}}})('@/app/audio/quiz/[...asset]/route');
  const request=range=>new Request('https://game.test/audio/quiz/'+asset.join('/'),{headers:range?{range}:{}});
  for(const [range,status] of [[undefined,200],['bytes=0-2',206]]){const response=await GET(request(range),{params:Promise.resolve({asset})});assert.equal(response.status,status);assert.equal(response.headers.get('Content-Type'),'audio/mpeg');assert.equal((await response.arrayBuffer()).byteLength,3);}
  assert.equal(calls[0].key,`quiz-audio/ttsforfree/${asset[0]}/${asset[1]}/question/${asset[3]}.mp3`);
  for(const invalid of [[],['..',...asset.slice(1)],[...asset.slice(0,2),'evil',asset[3]],[...asset.slice(0,3),'bad']])assert.equal((await GET(request(),{params:Promise.resolve({asset:invalid})})).status,404);
  assert.equal((await GET(request('bytes=0-1,3-4'),{params:Promise.resolve({asset})})).status,416);assert.equal(calls.length,2);
});
