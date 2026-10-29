/* Public game data only. Never cache account HTML, RSC requests, actions or orders. */
const PREFIX = 'history-pwa-v1-';
const CONTROL = 'history-pwa-control-v1';
const POINTER = '/__offline/active';
const PACK = '/__offline/pack';
let syncing;
const audioPath = path => ['/audio/winner-sound.mp3', '/audio/wrong-answer.mp3'].includes(path) || /^\/audio\/[a-f0-9]{64}$/.test(path) || /^\/audio\/quiz\/[a-f0-9]{24}\/[a-f0-9]{24}\/(?:question|option[A-D]|correctFeedback|incorrectFeedback)\/[a-f0-9]{64}$/.test(path);
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
async function activeCache() {
  const pointer = await (await caches.open(CONTROL)).match(POINTER);
  return pointer ? caches.open(await pointer.text()) : null;
}
async function announce(message) {
  for (const client of await self.clients.matchAll({ type: 'window' })) client.postMessage(message);
}
async function download(url) {
  const external = new URL(url, self.location.origin).origin !== self.location.origin;
  const response = await fetch(url, { credentials: 'omit', cache: 'no-store', mode: external ? 'no-cors' : 'same-origin', signal: AbortSignal.timeout(45000) });
  if (!response.ok && response.type !== 'opaque') throw new Error('download');
  return response;
}
async function sync() {
  let staging;
  try {
    const [manifestResponse, packResponse] = await Promise.all([download('/pwa-assets.json'), download('/api/offline/pack')]);
    const manifest = await manifestResponse.json(), pack = await packResponse.json();
    if (pack.schema !== 1 || !Array.isArray(pack.characters) || !Array.isArray(pack.questions) || !Array.isArray(manifest.assets)) throw new Error('schema');
    const name = `${PREFIX}${manifest.build}-${pack.version}`;
    const control = await caches.open(CONTROL), pointer = await control.match(POINTER);
    const previous = pointer ? await pointer.text() : null;
    if (previous === name) { await announce({ type: 'PWA_READY' }); return; }
    const old = await activeCache();
    staging = name;
    const target = await caches.open(name);
    const images = pack.characters.flatMap(character => [character.image, character.backgroundImage]).filter(Boolean);
    const audio = pack.questions.flatMap(question => question.audio ? [...question.audio.prompt, ...question.audio.correct, ...question.audio.incorrect] : []).filter(audioPath);
    const assets = [...new Set([...manifest.assets, ...images, ...audio])];
    let completed = 0;
    // Bounded concurrency avoids overwhelming the connection on mobile.
    let cursor = 0;
    let failed = false;
    const downloads = await Promise.allSettled(Array.from({ length: 4 }, async () => {
      while (!failed && cursor < assets.length) {
        const url = assets[cursor++];
        // Hashed scripts/fonts and immutable character image URLs can be reused.
        const reusable = url.startsWith('/_next/static/') || images.includes(url) || audio.includes(url);
        const response = reusable && old ? await old.match(url) : null;
        try { await target.put(url, response || await download(url)); } catch (error) { failed = true; throw error; }
        completed++;
        await announce({ type: 'PWA_PROGRESS', completed, total: assets.length });
      }
    }));
    if (downloads.some(result => result.status === 'rejected')) throw new Error('incomplete');
    // Product media is optional: an unavailable shop image must not block offline quizzes.
    if (pack.product?.mainImage) {
      const url = pack.product.mainImage;
      try {
        if (!await target.match(url)) await target.put(url, await old?.match(url) || await download(url));
      } catch { pack.product.mainImage = '/images/history-landscape.webp'; }
    }
    await target.put(PACK, Response.json({ ...pack, savedAt: new Date().toISOString() }));
    // Commit only after every file is cached. A failed refresh keeps the last pack.
    await control.put(POINTER, new Response(name));
    staging = undefined;
    await announce({ type: 'PWA_READY' });
    // Keep the preceding release for tabs still using its scripts.
    for (const key of await caches.keys()) if (key.startsWith(PREFIX) && key !== name && key !== previous) await caches.delete(key);
  } catch {
    if (staging) await caches.delete(staging);
    await announce({ type: 'PWA_ERROR' });
  }
}
self.addEventListener('message', event => {
  if (event.data?.type === 'PWA_SYNC') {
    syncing ||= sync().finally(() => { syncing = undefined; });
    event.waitUntil(syncing);
  }
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET') return;
  if (url.origin === self.location.origin && url.pathname === PACK) {
    event.respondWith((async () => await (await activeCache())?.match(PACK) || Response.json(null, { status: 404 }))());
    return;
  }
  if (request.mode === 'navigate') {
    const allowed = url.origin === self.location.origin && (url.pathname === '/' || /^\/play(?:\/[a-f0-9]{24})?\/?$/.test(url.pathname) || ['/offline', '/offline-home'].includes(url.pathname));
    if (!allowed || url.searchParams.has('auth') || url.searchParams.has('token')) return;
    event.respondWith((async () => {
      try {
        const response = await fetch(request, { signal: AbortSignal.timeout(5000) });
        if (response.status < 500) return response;
      } catch { /* use the public shell */ }
      const cache = await activeCache();
      const shell = await cache?.match(url.pathname === '/' || url.pathname === '/offline-home' ? '/offline-home' : '/offline');
      return shell || new Response('Cần kết nối mạng lần đầu để tải dữ liệu chơi offline.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    })());
    return;
  }
  // Match only explicitly downloaded assets, never cache arbitrary fetched responses.
  if (request.headers.has('RSC') || url.pathname.startsWith('/api/')) return;
  event.respondWith((async () => {
    const cache = await activeCache();
    const saved = await cache?.match(request);
    if (saved) {
      // Safari and other media players request byte ranges, including while offline.
      const range = request.headers.get('range');
      if (range && url.origin === self.location.origin && audioPath(url.pathname)) {
        const bytes = await saved.arrayBuffer(), length = bytes.byteLength;
        const match = range.match(/^bytes=(\d*)-(\d*)$/);
        const start = match?.[1] ? Number(match[1]) : match?.[2] ? Math.max(0, length - Number(match[2])) : NaN;
        const end = match?.[1] && match?.[2] ? Math.min(Number(match[2]), length - 1) : length - 1;
        if (!Number.isSafeInteger(start) || start < 0 || start >= length || end < start) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${length}` } });
        return new Response(bytes.slice(start, end + 1), { status: 206, headers: { 'Content-Type': 'audio/mpeg', 'Accept-Ranges': 'bytes', 'Content-Length': String(end - start + 1), 'Content-Range': `bytes ${start}-${end}/${length}` } });
      }
      return saved;
    }
    // Existing tabs can still request a hashed chunk from the preceding build.
    if (url.origin === self.location.origin && url.pathname.startsWith('/_next/static/')) {
      for (const name of await caches.keys()) if (name.startsWith(PREFIX)) {
        const old = await (await caches.open(name)).match(request);
        if (old) return old;
      }
    }
    return fetch(request);
  })());
});
