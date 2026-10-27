import "server-only";
import type { GetObjectCommandOutput } from "@aws-sdk/client-s3";

export async function audioResponse(request: Request, read: (range?: string) => Promise<Pick<GetObjectCommandOutput, "Body" | "ContentLength" | "ContentRange">>) {
  const range = request.headers.get("range") || undefined;
  if (range && !/^bytes=(?:\d+-\d*|-\d+)$/.test(range)) return new Response(null, { status: 416 });
  try {
    const file = await read(range);
    if (!file.Body) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
    return new Response(new Uint8Array(await file.Body.transformToByteArray()), { status: file.ContentRange ? 206 : 200, headers: {
      "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=31536000, immutable", "Accept-Ranges": "bytes", "X-Content-Type-Options": "nosniff",
      ...(file.ContentLength !== undefined ? { "Content-Length": String(file.ContentLength) } : {}), ...(file.ContentRange ? { "Content-Range": file.ContentRange } : {}),
    } });
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    return new Response(null, { status: name === "InvalidRange" ? 416 : name === "NoSuchKey" ? 404 : 503, headers: { "Cache-Control": "no-store" } });
  }
}
