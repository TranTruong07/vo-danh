// UI interaction checks with local synthetic fixtures. No login or production DB writes.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import { chromium } from '@playwright/test';
import { fixtureState, questionId } from './support/knowledge-admin-fixture.mjs';

const state = fixtureState(), raw = state.revisions[0];
const draft = { ...raw, _id: questionId, topicId: state.question.topicId, sectionId: 'I', createdAt: raw.createdAt.toISOString(), updatedAt: raw.updatedAt.toISOString() };
const detail = { id: questionId, preview: false, managementVersion: 0, publishedVersionId: null, selected: { revisionId: raw._id, draft }, revisions: [{ revisionId: raw._id, draft }], warnings: [{ questionId, code: 'TEST', message: 'Cảnh báo fixture để kiểm tra giao diện, không phải dữ liệu lịch sử.' }], validationErrors: [], audit: [] };
const list = { preview: true, items: Array.from({ length: 40 }, (_, i) => ({ id: `cmtt45-q${String(i + 1).padStart(3, '0')}`, question: `Câu hỏi kiểm thử số ${i + 1}`, aliases: [`Alias số ${i + 1}`], section: 'I', status: 'draft', version: 3, publishedVersionId: null })) };
const bundled = await build({ stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import Frame from './features/admin/admin-frame'; import List from './features/knowledge/knowledge-list'; import Detail from './features/knowledge/knowledge-detail'; const d=window.fixture; createRoot(document.getElementById('root')).render(<Frame email="reviewer@example.test">{d.mode==='list'?<List data={d.list} initialQuery=""/>:<Detail data={d.detail}/>}</Frame>);`, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, format: 'iife', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, plugins: [{ name: 'test-only-framework', setup(b) {
  b.onResolve({ filter: /^next\/(link|navigation)$/ }, a => ({ path: a.path, namespace: 'mock' }));
  b.onResolve({ filter: /^@\/actions\/admin$/ }, () => ({ path: 'actions', namespace: 'mock' }));
  b.onLoad({ filter: /.*/, namespace: 'mock' }, a => ({ loader: 'jsx', resolveDir: process.cwd(), contents: a.path === 'next/link' ? `import React from 'react'; export default function Link({children,...props}){return <a {...props}>{children}</a>}` : a.path === 'actions' ? 'export async function logoutAdmin(){}' : `export function usePathname(){return '/admin/knowledge'}; export function useRouter(){return {replace(){},refresh(){}}}` }));
  b.onResolve({ filter: /^@\// }, a => ({ path: path.resolve(a.path.slice(2) + '.ts') }));
} }] });
const js = bundled.outputFiles[0].text;
const css = readFileSync('app/admin/admin.css', 'utf8') + readFileSync('app/admin/knowledge/knowledge.css', 'utf8');
const server = createServer((req, res) => {
  if (req.url.startsWith('/api/')) { res.writeHead(500); res.end('Unexpected API request in test harness'); return; }
  const mode = req.url.includes('list') ? 'list' : 'detail';
  const data = { mode, list, detail: { ...detail, preview: req.url.includes('preview') } };
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font-family:Arial,sans-serif}*{box-sizing:border-box}${css}</style><body><div id="root"></div><script>window.fixture=${JSON.stringify(data).replaceAll('<', '\\u003c')}</script><script>${js.replaceAll('</script', '<\\/script')}</script></body></html>`);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const failures = []; page.on('pageerror', e => failures.push(e.message));
  await page.goto(`${base}/list`);
  await page.getByRole('heading', { name: 'Kho kiến thức', exact: true }).waitFor();
  assert.equal(await page.locator('.knowledge-list article').count(), 40);
  await page.getByRole('searchbox', { name: 'Tìm câu hỏi hoặc alias' }).fill('số 40');
  assert.equal(await page.locator('.knowledge-list article').count(), 1);
  await page.getByRole('searchbox', { name: 'Tìm câu hỏi hoặc alias' }).fill('');
  mkdirSync('.local/knowledge-ui', { recursive: true });
  await page.screenshot({ path: '.local/knowledge-ui/list-desktop.png' });
  await page.goto(`${base}/preview`);
  await page.getByText('Bản xem trước, chỉ đọc', { exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Phê duyệt revision 3', exact: true }).count(), 0);
  await page.goto(`${base}/detail`);
  await page.getByRole('button', { name: 'Phê duyệt revision 3', exact: true }).click();
  const dialog = page.getByRole('dialog'); await dialog.waitFor();
  const box = await dialog.boundingBox();
  assert.ok(Math.abs(box.x + box.width / 2 - 720) < 2 && Math.abs(box.y + box.height / 2 - 500) < 2, 'dialog is centered');
  const approve = page.getByRole('button', { name: 'Xác nhận phê duyệt', exact: true });
  assert.equal(await approve.isDisabled(), true);
  await page.getByRole('checkbox').check();
  await page.getByRole('textbox', { name: 'Ghi chú thao tác' }).fill('Fixture: đã đọc nội dung thử nghiệm.');
  let sent;
  await page.route('**/api/admin/knowledge/**', async route => { sent = route.request().postDataJSON(); await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ message: 'Dữ liệu đã thay đổi. Tải lại trang.' }) }); });
  await approve.click(); await page.getByRole('alert').waitFor();
  assert.equal(sent.action, 'approve'); assert.equal(sent.acknowledged, true); assert.equal(sent.reviewedBy, undefined);
  await page.screenshot({ path: '.local/knowledge-ui/confirm-desktop.png' });
  await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
  await page.getByRole('button', { name: 'Chỉnh sửa bằng revision mới' }).click();
  await page.getByRole('textbox', { name: 'Câu hỏi chuẩn', exact: true }).fill('Câu hỏi fixture đã chỉnh sửa?');
  await page.getByRole('button', { name: 'Lưu thành bản nháp mới' }).click();
  await page.getByRole('textbox', { name: 'Ghi chú thao tác' }).fill('Fixture chỉnh sửa.');
  await page.unroute('**/api/admin/knowledge/**');
  await page.route('**/api/admin/knowledge/**', async route => { sent = route.request().postDataJSON(); await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ revisionId: `${questionId}:v4`, managementVersion: 1 }) }); });
  await page.getByRole('button', { name: 'Xác nhận lưu thành revision mới' }).click();
  await page.getByRole('status').waitFor();
  assert.equal(sent.action, 'create_revision'); assert.equal(sent.content.canonicalQuestion, 'Câu hỏi fixture đã chỉnh sửa?'); assert.equal(sent.content.source, undefined);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/detail`);
  await page.getByRole('button', { name: 'Phê duyệt revision 3', exact: true }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: '.local/knowledge-ui/detail-mobile.png' });
  assert.deepEqual(failures, []);
  console.log('UI passed: 40-row preview/search, readonly preview, centered confirmation, review acknowledgement, 409 feedback, new-revision payload, mobile overflow and no browser errors. All API calls mocked; 0 production writes.');
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
