import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

async function files(directory, prefix) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? files(path.join(directory, entry.name), `${prefix}/${entry.name}`)
    : /\.(js|css|woff2?|png|webp|svg|ico)$/.test(entry.name) ? [`${prefix}/${entry.name}`] : []))).flat();
}
const assets = [...await files('.next/static', '/_next/static'), '/images/history-landscape.webp', '/pwa/icon-192.png', '/pwa/icon-512.png', '/offline', '/offline-home'];
await writeFile('public/pwa-assets.json', JSON.stringify({ build: (await readFile('.next/BUILD_ID', 'utf8')).trim(), assets }));
console.log(`PWA: ${assets.length} public assets prepared.`);
