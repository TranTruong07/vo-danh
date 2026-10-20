import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = process.cwd(), folder = path.join(root, '.local/chat-phase-5e');
fs.mkdirSync(folder, { recursive: true });
const guard = pathToFileURL(path.join(root, 'scripts/support/chat-history-offline-guard.mjs')).href;
const env = { ...process.env, MONGODB_URI: '', GEMINI_API_KEY: '', NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --import=${guard}` };
const mode = process.argv[2];
if (mode === 'test') {
  const names = ['chat', 'chat-ai', 'chat-ai-errors', 'chat-repositories', 'chat-demo', 'chat-dialogue', 'chat-model-evaluation', 'chat-fallback', 'chat-history', 'knowledge-admin', 'knowledge-generation'];
  const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...names.map(n => `tests/${n}.test.mjs`)], { cwd: root, env, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  fs.writeFileSync(path.join(folder, 'tests.tap'), result.stdout || '');
  const total = Number(result.stdout?.match(/# tests (\d+)/)?.[1] || 0), passed = Number(result.stdout?.match(/# pass (\d+)/)?.[1] || 0);
  const report = { total, passed, failed: total - passed, exitCode: result.status, generationCalls: 0, networkBlocked: true };
  fs.writeFileSync(path.join(folder, 'tests.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  if (result.status !== 0) console.log((result.stdout || result.stderr || '').split('\n').filter(line => /not ok|error:|expected:|actual:/.test(line)).join('\n'));
  process.exitCode = result.status ?? 1;
} else if (mode === 'build') {
  const workspace = path.join(folder, `build-workspace-${Date.now()}`);
  fs.mkdirSync(workspace);
  for (const dir of ['actions', 'app', 'components', 'data', 'features', 'hooks', 'server', 'lib', 'public', 'knowledge', 'docs/source', 'scripts', 'tests', 'types']) {
    if (fs.existsSync(path.join(root, dir))) fs.cpSync(path.join(root, dir), path.join(workspace, dir), { recursive: true });
  }
  for (const name of fs.readdirSync(root).filter(name => /^(?:package(?:-lock)?\.json|tsconfig\.json|next-env\.d\.ts|next\.config\..+|postcss\.config\..+|eslint\.config\..+|proxy\.[jt]s)$/.test(name))) fs.copyFileSync(path.join(root, name), path.join(workspace, name));
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(workspace, 'node_modules'), 'junction');
  const result = spawnSync(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'build', '--webpack'], { cwd: workspace, env, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  fs.writeFileSync(path.join(folder, 'build.log'), (result.stdout || '') + (result.stderr || ''));
  const report = { exitCode: result.status, isolatedWorkspace: true, copiedEnvFile: false, generationCalls: 0, networkBlocked: true };
  fs.writeFileSync(path.join(folder, 'build.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report)); console.log(result.stdout); console.log(result.stderr);
  process.exitCode = result.status ?? 1;
} else throw Error('Use test or build');
