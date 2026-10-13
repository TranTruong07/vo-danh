import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
import sharp from 'sharp';

const nativeRequire = createRequire(import.meta.url);
function loader(mocks = {}) {
  const cache = new Map();
  function load(name, parent = process.cwd()) {
    if (name in mocks) return mocks[name];
    if (name === 'server-only') return {};
    if (!name.startsWith('@/') && !name.startsWith('.')) return nativeRequire(name);
    const file = (name.startsWith('@/') ? path.resolve(name.slice(2)) : path.resolve(parent, name)) + '.ts';
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
    vm.runInThisContext('(function(require,module,exports){' + code + '\n})', { filename: file })(n => load(n, path.dirname(file)), module, module.exports);
    return module.exports;
  }
  return load;
}
const imageUrl = 'https://images.example/images/characters/01234567-89ab-4def-8123-0123456789ab.webp';
const id = '0123456789abcdef01234567';
const fields = { name: 'Nhân vật thử nghiệm', openingLine: 'Xin chào, cùng khám phá lịch sử!', backgroundImage: 'https://images.example/background.webp' };
function form(image = '') { const f = new FormData(); Object.entries({ ...fields, image }).forEach(([key, value]) => f.set(key, value)); return f; }
function withFile() { const f = form(); f.set('imageFile', new File([Buffer.from('image-fixture')], 'portrait.png', { type: 'image/png' })); return f; }
function fixture() {
  const calls = []; let saved;
  const options = { authorized: true, storageFail: false, secondUploadFail: false, dbFail: false, referenced: false, existingImage: imageUrl };
  const repo = {
    findCharacter: async () => { calls.push('read'); return { image: options.existingImage, backgroundImage: fields.backgroundImage }; },
    saveCharacter: async (_id, data) => { calls.push('save'); if (options.dbFail) throw new Error('DB failed'); saved = data; return data; },
    characterRecord: row => row,
    isCharacterImageReferenced: async () => options.referenced,
  };
  const service = loader({
    './admin-auth': { requireAdmin: async () => { calls.push('auth'); if (!options.authorized) throw new Error('Unauthorized'); } },
    '@/server/repositories/characters': repo,
    '@/server/infrastructure/character-image': { prepareCharacterImage: async bytes => { calls.push('prepare'); assert.ok(bytes.length); return Buffer.from('webp'); } },
    '@/server/repositories/images': {
      uploadCharacterImage: async () => { calls.push('upload'); if (options.storageFail || (options.secondUploadFail && calls.filter(call => call === 'upload').length === 2)) throw new Error('Storage failed'); return { key: 'new-key', url: imageUrl }; },
      discardUncommittedImage: async key => { calls.push('cleanup:' + key); },
    },
  })('@/server/services/characters');
  return { service, options, calls, saved: () => saved };
}
test('actual image decoder converts to WebP, strips metadata and limits dimensions', async () => {
  const { prepareCharacterImage } = loader()('@/server/infrastructure/character-image');
  const input = await sharp({ create: { width: 1800, height: 900, channels: 3, background: '#91252a' } }).png().withMetadata().toBuffer();
  const output = await prepareCharacterImage(input);
  const meta = await sharp(output).metadata();
  assert.equal(meta.format, 'webp'); assert.equal(meta.width, 1600); assert.equal(meta.height, 800); assert.equal(meta.exif, undefined);
});

test('two image uploads roll back the first if the second fails; editing background preserves portrait', async () => {
  const f = fixture(); f.options.secondUploadFail = true;
  const input = withFile(); input.set('backgroundImageFile', new File([Buffer.from('background-fixture')], 'background.png', { type: 'image/png' }));
  await assert.rejects(f.service.saveCharacterForm(null, input));
  assert.equal(f.calls.includes('save'), false);
  assert.equal(f.calls.at(-1), 'cleanup:new-key');
  const edit = fixture(); const editInput = form('__keep__');
  editInput.set('backgroundImageFile', input.get('backgroundImageFile'));
  await edit.service.saveCharacterForm(id, editInput);
  assert.equal(edit.saved().image, imageUrl);
  assert.equal(edit.calls.filter(call => call === 'upload').length, 1);
  const keep = fixture(); const keepInput = form('__keep__'); keepInput.set('backgroundImage', '__keep__');
  await keep.service.saveCharacterForm(id, keepInput);
  assert.equal(keep.saved().backgroundImage, fields.backgroundImage);
  assert.equal(keep.calls.includes('upload'), false);
});
test('image decoder rejects corrupt images, SVG, empty and oversized payloads', async () => {
  const { prepareCharacterImage } = loader()('@/server/infrastructure/character-image');
  for (const bytes of [Buffer.alloc(0), Buffer.alloc(3 * 1024 * 1024 + 1), Buffer.from('not a real PNG'), Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"/>')]) await assert.rejects(prepareCharacterImage(bytes));
});
test('only an admin can upload; valid uploads save an R2 URL instead of base64', async () => {
  const denied = fixture(); denied.options.authorized = false;
  await assert.rejects(denied.service.saveCharacterForm(null, withFile())); assert.deepEqual(denied.calls, ['auth']);
  const f = fixture(); await f.service.saveCharacterForm(null, withFile());
  assert.equal(f.saved().image, imageUrl); assert.deepEqual(f.calls, ['auth', 'prepare', 'upload', 'save']);
});
test('invalid metadata and failed uploads never save an image record', async () => {
  const invalid = fixture(); const input = withFile(); input.set('openingLine', '');
  await assert.rejects(invalid.service.saveCharacterForm(null, input)); assert.equal(invalid.calls.includes('upload'), false);
  const f = fixture(); f.options.storageFail = true;
  await assert.rejects(f.service.saveCharacterForm(null, withFile())); assert.equal(f.calls.includes('save'), false);
});
test('DB failure removes only an unreferenced new object, preserving possibly committed images', async () => {
  const f = fixture(); f.options.dbFail = true;
  await assert.rejects(f.service.saveCharacterForm(null, withFile())); assert.equal(f.calls.at(-1), 'cleanup:new-key');
  const committed = fixture(); committed.options.dbFail = true; committed.options.referenced = true;
  await assert.rejects(committed.service.saveCharacterForm(null, withFile())); assert.equal(committed.calls.includes('cleanup:new-key'), false);
});
test('edit preserves R2 URLs and migrates trusted legacy base64 only on save', async () => {
  const f = fixture(); await f.service.saveCharacterForm(id, form('__keep__'));
  assert.equal(f.saved().image, imageUrl); assert.equal(f.calls.includes('upload'), false);
  const legacy = fixture(); legacy.options.existingImage = 'data:image/png;base64,aGVsbG8=';
  await legacy.service.saveCharacterForm(id, form('__keep__')); assert.equal(legacy.saved().image, imageUrl); assert.ok(legacy.calls.includes('upload'));
  const arbitrary = fixture(); await assert.rejects(arbitrary.service.saveCharacterForm(null, form('data:image/png;base64,aGVsbG8=')));
  assert.equal(arbitrary.calls.includes('upload'), false);
});
