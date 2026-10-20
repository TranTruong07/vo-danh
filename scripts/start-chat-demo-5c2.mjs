// Local development only; leaves the user's current dev server and .env.local alone.
import { mkdirSync, existsSync, readFileSync, writeFileSync, cpSync, symlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
const root = process.cwd(), folder = resolve('.local/chat-phase-5c2'), workspace = `${folder}/workspace`;
mkdirSync(folder, { recursive: true });
const ledger = `${folder}/generation-ledger.json`;
if (!existsSync(ledger)) writeFileSync(ledger, JSON.stringify({ phase: '5C.2', maximum: 10, calls: 0 }, null, 2), { flag: 'wx' });
if (JSON.parse(readFileSync(ledger, 'utf8')).calls >= 10) throw new Error('Budget exhausted; never reset the ledger');
mkdirSync(workspace, { recursive: true });
for (const name of ['actions', 'app', 'components', 'data', 'features', 'hooks', 'lib', 'public', 'server', 'types', 'knowledge', 'package.json', 'package-lock.json', 'next.config.ts', 'next-env.d.ts', 'postcss.config.mjs', 'tsconfig.json', '.env.local']) {
  if (existsSync(name)) cpSync(name, `${workspace}/${name}`, { recursive: true });
}
if (!existsSync(`${workspace}/node_modules`)) symlinkSync(resolve('node_modules'), `${workspace}/node_modules`, 'junction');
const env = { ...process.env, CHAT_AI_DIAGNOSTIC_RUN: 'phase-5c2', CHAT_AI_DIAGNOSTIC_DIR: folder,
  CHAT_AI_MATCHING_ENABLED: 'true', GEMINI_MODEL: 'gemini-3.5-flash-lite', CHAT_AI_AUTO_ANSWER: 'false',
  NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --import=${pathToFileURL(resolve('scripts/support/chat-demo-5c2-budget.mjs')).href}` };
if (process.argv.includes('--quota-zero')) env.CHAT_AI_CALLS_PER_DAY = '0'; // Controlled fallback test, no counter reset.
const child = spawn(process.execPath, [resolve('node_modules/next/dist/bin/next'), 'dev', workspace, '--webpack', '--port', '3014', '--hostname', '127.0.0.1'], { cwd: root, env, stdio: 'inherit', windowsHide: true });
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
child.on('exit', code => { process.exitCode = code || 0; });
