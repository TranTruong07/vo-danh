import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
const nativeRequire = createRequire(import.meta.url);
export function loader(mocks = {}) {
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
