// Resize the supplied logo for browser and installed-app icons; preserve the original artwork.
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const source = 'public/images/logo_dauchansuky.jpg';
await sharp(source).resize(192, 192).png().toFile('public/pwa/icon-192.png');
// Maskable icons need their artwork inside the central safe area.
await sharp(source).resize(384, 384).extend({ top: 64, bottom: 64, left: 64, right: 64, background: '#ffffff' }).png().toFile('public/pwa/icon-512.png');
const png = await sharp(source).resize(64, 64).ensureAlpha().png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
header[6] = 64; header[7] = 64;
header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12);
header.writeUInt32LE(png.length, 14); header.writeUInt32LE(22, 18);
const ico = Buffer.concat([header, png]);
await Promise.all(['app/favicon.ico', 'public/favicon.ico'].map(file => writeFile(file, ico)));
console.log('Updated favicon and PWA icons from the supplied logo.');
