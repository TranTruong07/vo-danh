import fs from "fs";
import path from "path";

let cachedContext: string | null = null;
let lastCacheTimestamp = 0;

// Đọc toàn bộ file PDF trong thư mục data/documents với cơ chế In-memory Cache
export async function loadDocumentsContext(): Promise<string> {
  const documentsDir = path.resolve(process.cwd(), "data", "documents");

  if (!fs.existsSync(documentsDir)) {
    console.warn(`[PDF Loader] Không tìm thấy thư mục: ${documentsDir}`);
    return "";
  }

  const allEntries = fs.readdirSync(documentsDir);
  const pdfFiles = allEntries.filter((file) => file.toLowerCase().endsWith(".pdf"));

  if (pdfFiles.length === 0) {
    cachedContext = "";
    return "";
  }

  // Tính toán thời điểm sửa đổi mới nhất (mtime) của các file PDF
  let currentMaxMtime = 0;
  for (const file of pdfFiles) {
    const filePath = path.join(documentsDir, file);
    try {
      const stats = fs.statSync(filePath);
      if (stats.mtimeMs > currentMaxMtime) {
        currentMaxMtime = stats.mtimeMs;
      }
    } catch (err) {
      console.warn(`[PDF Loader] Không thể lấy stat của ${file}:`, err);
    }
  }

  // Nếu đã có cache và file không bị chỉnh sửa -> Tái sử dụng ngay lập tức (0ms)
  if (cachedContext !== null && currentMaxMtime === lastCacheTimestamp) {
    return cachedContext;
  }

  console.log(`[PDF Loader] Cache miss hoặc dữ liệu thay đổi. Đang đọc lại ${pdfFiles.length} file PDF...`);
  let aggregatedText = "";

  for (const file of pdfFiles) {
    const filePath = path.join(documentsDir, file);
    try {
      const dataBuffer = fs.readFileSync(filePath);
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdf = require("pdf-parse");
      const data = await pdf(dataBuffer);
      console.log(`[PDF Loader] Đọc file "${file}" thành công, độ dài: ${data.text?.length || 0} ký tự`);
      aggregatedText += `\n--- START DOCUMENT: ${file} ---\n${data.text || ""}\n--- END DOCUMENT: ${file} ---\n`;
    } catch (err) {
      console.error(`[PDF Loader] Lỗi đọc file PDF ${file}:`, err);
    }
  }

  cachedContext = aggregatedText;
  lastCacheTimestamp = currentMaxMtime;
  return aggregatedText;
}

