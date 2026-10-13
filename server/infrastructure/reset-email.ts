import "server-only";
import nodemailer from "nodemailer";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { AuthError } from "@/server/domain/auth";

export function resetMailConfiguration() {
  const preview = process.env.NODE_ENV !== "production" && process.env.MAIL_TRANSPORT === "preview";
  if (!preview && (!process.env.SMTP_HOST || !process.env.MAIL_FROM)) throw new AuthError("Chức năng gửi email chưa được cấu hình. Vui lòng thử lại sau.");
  const configuredUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!configuredUrl) throw new AuthError("Chức năng đặt lại mật khẩu chưa sẵn sàng.");
  const origin = new URL(configuredUrl);
  if (!["http:", "https:"].includes(origin.protocol) || (process.env.NODE_ENV === "production" && origin.protocol !== "https:")) throw new AuthError("Địa chỉ website gửi email chưa hợp lệ.");
  return { preview, origin: origin.origin };
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const config = resetMailConfiguration();
  const url = new URL("/", config.origin);
  url.searchParams.set("auth", "reset");
  url.searchParams.set("token", token);
  const subject = "Đặt lại mật khẩu Dấu Chân Sử Ký";
  const text = `Bạn đã yêu cầu đặt lại mật khẩu. Mở liên kết sau trong vòng 30 phút:\n\n${url.toString()}\n\nLiên kết chỉ dùng một lần. Nếu không phải bạn yêu cầu, hãy bỏ qua email này.`;
  if (config.preview) {
    const directory = join(process.cwd(), ".local", "mail");
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, `${Date.now()}-${randomUUID()}.json`), JSON.stringify({ to: email, subject, text }, null, 2), { mode: 0o600 });
    return;
  }
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    connectionTimeout: 10000, socketTimeout: 15000,
    disableFileAccess: true, disableUrlAccess: true,
  });
  await transport.sendMail({ from: process.env.MAIL_FROM, to: email, subject, text });
}
