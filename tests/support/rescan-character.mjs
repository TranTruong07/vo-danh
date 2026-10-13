import { expect } from '@playwright/test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QRCodeSVG } from 'qrcode.react';
import sharp from 'sharp';

export async function rescanCharacter(page, url) {
  await expect(page.getByRole('button', { name: 'Thử câu khác về nhân vật này' })).toHaveCount(0);
  const previousUrl = page.url();
  await page.getByRole('button', { name: 'Quét nhân vật tiếp' }).click();
  const svg = renderToStaticMarkup(createElement(QRCodeSVG, { value: url, size: 600, marginSize: 4 }));
  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
  await page.getByLabel('Chọn ảnh QR', { exact: true }).setInputFiles({ name: 'rescan.png', mimeType: 'image/png', buffer });
  await expect(page).not.toHaveURL(previousUrl);
  await expect(page.getByRole('radio')).toHaveCount(4, { timeout: 25000 });
  await expect(page.getByRole('radio').first()).toBeEnabled();
}
