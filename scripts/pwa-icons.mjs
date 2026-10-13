import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

await mkdir('public/pwa', { recursive: true });
const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#981f25"/><rect x="104" y="92" width="304" height="328" rx="12" fill="none" stroke="#f5e5b9" stroke-width="8"/><path d="M142 142h96v196h-96zM274 142h96v196h-96zM256 142v220M194 378h124" fill="none" stroke="#f5e5b9" stroke-width="12"/><path d="m256 198 13 34 36 12-36 13-13 35-13-35-35-13 35-12z" fill="#f5e5b9"/></svg>`);
for (const size of [192, 512]) await sharp(svg).resize(size, size).png().toFile(`public/pwa/icon-${size}.png`);
