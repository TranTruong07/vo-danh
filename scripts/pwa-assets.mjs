import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

async function files(directory, prefix) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? files(path.join(directory, entry.name), `${prefix}/${entry.name}`)
    : /\.(js|css|woff2?|png|webp|svg|ico)$/.test(entry.name) ? [`${prefix}/${entry.name}`] : []))).flat();
}
const effects = ['/audio/winner-sound.mp3', '/audio/wrong-answer.mp3'];
const branding = ['/images/logo_dauchansuky.png', ...[1, 2, 3, 4].map(number => `/images/anh_slide${number}.png`), '/favicon.ico'];
// Fail the build if a required effect is missing, instead of publishing an incomplete pack.
await Promise.all([...effects, ...branding].map(url => readFile(`public${url}`)));
const assets = [...await files('.next/static', '/_next/static'), '/images/history-landscape.webp', '/pwa/icon-192.png', '/pwa/icon-512.png', '/offline', '/offline-home', ...effects, ...branding];
await writeFile('public/pwa-assets.json', JSON.stringify({ build: (await readFile('.next/BUILD_ID', 'utf8')).trim(), assets }));
console.log(`PWA: ${assets.length} public assets prepared.`);
