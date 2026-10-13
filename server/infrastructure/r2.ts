import "server-only";
import { S3Client } from "@aws-sdk/client-s3";

/**
 * Cấu hình Cloudflare R2.
 *
 * R2 dùng API tương thích S3 với:
 *  - endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
 *  - region : "auto" (bắt buộc dùng đúng chữ "auto")
 *
 * Xem: https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/
 */

export const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
export const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
export const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
export const R2_BUCKET = process.env.R2_BUCKET;

// URL công khai của bucket (r2.dev hoặc custom domain) — không có "/" ở cuối
export const R2_PUBLIC_BASE_URL = (process.env.R2_PUBLIC_BASE_URL ?? "").replace(/\/+$/, "");

export function isR2Configured(): boolean {
  return Boolean(
    R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET && R2_PUBLIC_BASE_URL
  );
}

let cachedClient: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!isR2Configured()) {
    throw new Error(
      "R2 chưa được cấu hình. Kiểm tra các biến R2 trong .env.local (xem docs/r2-images.md)."
    );
  }
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: "auto",
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return cachedClient;
}

