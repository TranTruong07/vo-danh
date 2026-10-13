import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loader } from './support/load-typescript.mjs';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

test('offline pack contains only public character/question records, filters orphans and versions content changes', async () => {
  let text = 'Câu hỏi thứ nhất';
  const { offlineGamePack } = loader({ '@/server/repositories/offline-game': { readOfflineGame: async () => ({ characters: [{ id: 'one', name: 'Name' }], questions: [{ id: 'q', characterId: 'one', question: text }, { id: 'orphan', characterId: 'deleted' }] }) } })('@/server/services/offline-game');
  const first = await offlineGamePack();
  assert.equal(first.questions.length, 1); assert.equal(first.schema, 1);
  assert.equal((await offlineGamePack()).version, first.version);
  text = 'Nội dung đã sửa'; assert.notEqual((await offlineGamePack()).version, first.version);
});

test('local grading uses the saved snapshot and rejects invalid answer indexes', () => {
  const { gradeLocalQuestion, matchSavedQuestion } = loader()('@/features/pwa/local-game');
  const question = { characterId: 'one', question: 'Question', answers: ['A', 'B', 'C', 'D'], correctIndex: 2, correctFeedback: 'Correct', incorrectFeedback: 'Wrong' };
  assert.equal(gradeLocalQuestion(question, 2).correct, true);
  assert.equal(gradeLocalQuestion(question, 0).explanation, 'Wrong');
  assert.throws(() => gradeLocalQuestion(question, 4));
  assert.throws(() => gradeLocalQuestion(question, 1.5));
  assert.equal(matchSavedQuestion({ questions: [question] }, 'one', { question: 'Question', options: question.answers }), question);
  assert.equal(matchSavedQuestion({ questions: [question] }, 'other', { question: 'Question', options: question.answers }), undefined);
});

test('service worker commits complete packs only, keeps the previous pack on download failure and excludes private requests', async () => {
  const stores = new Map(), handlers = new Map(), messages = [];
  const key = request => new URL(typeof request === 'string' ? request : request.url, 'https://example.test').href;
  const caches = {
    open: async name => {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return { match: async request => store.get(key(request))?.clone(), put: async (request, response) => { store.set(key(request), response.clone()); } };
    },
    keys: async () => [...stores.keys()], delete: async name => stores.delete(name),
  };
  let version = 'one', fail = false;
  const context = vm.createContext({
    URL, Response, AbortSignal, caches,
    self: { location: { origin: 'https://example.test' }, addEventListener: (name, callback) => handlers.set(name, callback), clients: { matchAll: async () => [{ postMessage: message => messages.push(message) }], claim: async () => {} }, skipWaiting: () => {} },
    fetch: async url => {
      if (url === '/pwa-assets.json') return Response.json({ build: 'build', assets: ['/offline', '/offline-home', '/image.webp'] });
      if (url === '/api/offline/pack') return Response.json({ schema: 1, version, characters: [], questions: [] });
      if (fail && url === '/image.webp') return new Response('', { status: 503 });
      return new Response('asset');
    },
  });
  vm.runInContext(await readFile('public/sw.js', 'utf8'), context);
  const sync = async () => { let done; handlers.get('message')({ data: { type: 'PWA_SYNC' }, waitUntil: promise => { done = promise; } }); await done; };
  const pointer = async () => (await (await caches.open('history-pwa-control-v1')).match('/__offline/active')).text();
  await sync(); assert.equal(await pointer(), 'history-pwa-v1-build-one');
  version = 'two'; fail = true; await sync();
  assert.equal(await pointer(), 'history-pwa-v1-build-one');
  assert.equal(stores.has('history-pwa-v1-build-two'), false);
  assert.equal(messages.at(-1).type, 'PWA_ERROR');
  fail = false; await sync(); assert.equal(await pointer(), 'history-pwa-v1-build-two');
  assert.equal(messages.at(-1).type, 'PWA_READY');
  await sync(); assert.equal(messages.at(-1).type, 'PWA_READY');
  const listener = handlers.get('fetch');
  for (const [url, method, mode, headers] of [
    ['/admin', 'GET', 'navigate', new Headers()], ['/orders', 'GET', 'navigate', new Headers()],
    ['/?auth=reset&token=secret', 'GET', 'navigate', new Headers()],
    ['/play', 'POST', 'cors', new Headers()], ['/play?_rsc=x', 'GET', 'cors', new Headers({ RSC: '1' })],
  ]) {
    let intercepted = false;
    listener({ request: { url: key(url), method, mode, headers }, respondWith: () => { intercepted = true; } });
    assert.equal(intercepted, false, url);
  }
});
