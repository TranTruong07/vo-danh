import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const local = process.platform === 'win32' ? '.local/knowledge-venv/Scripts/python.exe' : '.local/knowledge-venv/bin/python';
const python = process.env.KNOWLEDGE_PYTHON || (existsSync(local) ? local : 'python');
const result = spawnSync(python, ['-X', 'utf8', 'scripts/extract-knowledge.py', ...process.argv.slice(2)], { stdio: 'inherit', windowsHide: true });
if (result.error) console.error('Không chạy được Python. Xem docs/knowledge-pipeline.md để cài môi trường offline.');
process.exitCode = result.status ?? 1;
