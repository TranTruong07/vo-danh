import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { buildGenerationPlan } from './knowledge/rebuild-generation-plan.mjs';

// Local editorial artifact only; never imports environment, DB or provider modules.
const manifest = JSON.parse(readFileSync('knowledge/new-source-manifest.json', 'utf8'));
const checksum = createHash('sha256').update(readFileSync('docs/source/Tong-hop-kien-thuc-moi.docx')).digest('hex');
if (checksum !== manifest.sourceSha256) throw Error('DOCX changed; review and extract before planning.');
const plan = buildGenerationPlan(manifest);
writeFileSync('knowledge/new-generation-plan.json', JSON.stringify(plan, null, 2) + '\n');
console.log(JSON.stringify({ counts: plan.counts, coverage: plan.coverage, batches: plan.batches.length, generationCalls: 0, databaseWrites: 0 }));
