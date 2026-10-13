import "server-only";
import ExcelJS from "exceljs";
import { GameError } from "@/server/domain/character";
import { normalizeQuestion, validateCharacterQuestion } from "@/server/domain/character-question";
import { QUESTION_IMPORT_HEADERS, QUESTION_IMPORT_MAX_ROWS, type QuestionImportRow } from "@/server/domain/question-import";

// XLSX is a ZIP archive. Bound decompressed size before ExcelJS allocates it.
function checkArchive(buffer: Buffer) {
  let end = -1;
  for (let offset = buffer.length - 22; offset >= Math.max(0, buffer.length - 65557); offset--) {
    if (buffer.readUInt32LE(offset) === 0x06054b50 && offset + 22 + buffer.readUInt16LE(offset + 20) === buffer.length) { end = offset; break; }
  }
  if (end < 0) throw new GameError("File Excel không hợp lệ. Hãy lưu lại dưới định dạng .xlsx.");
  const entries = buffer.readUInt16LE(end + 10);
  let offset = buffer.readUInt32LE(end + 16);
  let expanded = 0;
  if (entries > 1000 || buffer.readUInt16LE(end + 4) || buffer.readUInt16LE(end + 6)) throw new GameError("File Excel quá phức tạp. Hãy dùng file mẫu.");
  for (let index = 0; index < entries; index++) {
    if (offset + 46 > end || buffer.readUInt32LE(offset) !== 0x02014b50) throw new GameError("File Excel bị hỏng hoặc không được hỗ trợ.");
    expanded += buffer.readUInt32LE(offset + 24);
    if (expanded > 20 * 1024 * 1024) throw new GameError("Dữ liệu giải nén quá lớn. Hãy chia nhỏ file Excel.");
    offset += 46 + buffer.readUInt16LE(offset + 28) + buffer.readUInt16LE(offset + 30) + buffer.readUInt16LE(offset + 32);
  }
  if (offset !== end) throw new GameError("File Excel không đúng định dạng được hỗ trợ.");
}

function textCell(cell: ExcelJS.Cell): string {
  const value = cell.value;
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value).normalize("NFC").trim();
  if (typeof value === "object" && "richText" in value) return value.richText.map(item => item.text).join("").normalize("NFC").trim();
  throw new GameError(`Ô ${cell.address}: chỉ nhập văn bản hoặc số, không dùng công thức, liên kết hay ngày tháng.`);
}

export async function readQuestionWorkbook(buffer: Buffer, characterId: string): Promise<QuestionImportRow[]> {
  checkArchive(buffer);
  const workbook = new ExcelJS.Workbook();
  try { await workbook.xlsx.load(Uint8Array.from(buffer).buffer); }
  catch { throw new GameError("Không thể đọc file Excel. Hãy dùng file .xlsx theo mẫu, không đặt mật khẩu."); }
  const sheet = workbook.getWorksheet("Câu hỏi");
  if (!sheet) throw new GameError('Thiếu trang tính “Câu hỏi”. Vui lòng tải file mẫu và giữ nguyên tên trang tính.');
  if (sheet.rowCount > QUESTION_IMPORT_MAX_ROWS + 1 || sheet.columnCount > QUESTION_IMPORT_HEADERS.length) throw new GameError(`File chỉ được có tối đa ${QUESTION_IMPORT_MAX_ROWS} dòng câu hỏi và 8 cột theo mẫu. Hãy xóa các hàng/cột thừa.`);
  QUESTION_IMPORT_HEADERS.forEach((header, index) => {
    if (normalizeQuestion(textCell(sheet.getRow(1).getCell(index + 1))) !== normalizeQuestion(header)) throw new GameError(`Cột ${index + 1} phải có tiêu đề “${header}”. Vui lòng giữ nguyên dòng tiêu đề của file mẫu.`);
  });
  const rows: QuestionImportRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    let question = "";
    try {
      const cells = QUESTION_IMPORT_HEADERS.map((_, index) => textCell(row.getCell(index + 1)));
      if (cells.every(value => !value)) return;
      question = cells[0];
      if (question.startsWith("[MẪU]")) throw new GameError("Đây là dòng minh họa. Hãy thay bằng câu hỏi của nhân vật hoặc xóa dòng này.");
      const correct = cells[5].toUpperCase();
      const data = validateCharacterQuestion({ characterId, question, answers: cells.slice(1, 5), correctIndex: /^[ABCD]$/.test(correct) ? "ABCD".indexOf(correct) : -1, correctFeedback: cells[6], incorrectFeedback: cells[7] });
      rows.push({ row: rowNumber, question, data, status: "ready", message: "Sẵn sàng nhập" });
    } catch (error) {
      rows.push({ row: rowNumber, question: question.slice(0, 500), status: "invalid", message: error instanceof GameError ? error.message : "Dữ liệu dòng không hợp lệ." });
    }
  });
  if (!rows.length) throw new GameError("File chưa có câu hỏi. Hãy điền dữ liệu từ dòng 2.");
  return rows;
}

export async function createQuestionTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Dấu Chân Sử Ký";
  const sheet = workbook.addWorksheet("Câu hỏi", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = QUESTION_IMPORT_HEADERS.map((header, index) => ({ header, width: index === 0 ? 55 : index >= 6 ? 55 : index === 5 ? 18 : 25 }));
  sheet.addRow(["[MẪU] Ngô Quyền đánh thắng quân Nam Hán trên con sông nào?", "Sông Bạch Đằng", "Sông Hồng", "Sông Mã", "Sông Lam", "A", "Chính xác! Đó là sông Bạch Đằng.", "Chưa đúng rồi. Đáp án đúng là sông Bạch Đằng."]);
  sheet.eachRow((row, index) => {
    row.height = index === 1 ? 34 : 76;
    row.eachCell(cell => {
      cell.font = { name: "Arial", size: 11, color: { argb: index === 1 ? "FFFFFFFF" : "FF23436A" }, bold: index === 1 };
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: index === 1 ? "FF356BE8" : "FFF0F5FF" } };
    });
  });
  sheet.autoFilter = "A1:H2";
  // Validate only the sample row so blank formatted rows don't inflate the upload.
  sheet.getCell("F2").dataValidation = { type: "list", allowBlank: false, formulae: ['"A,B,C,D"'], showErrorMessage: true, errorTitle: "Đáp án đúng", error: "Chọn A, B, C hoặc D." };
  const help = workbook.addWorksheet("Hướng dẫn");
  help.columns = [{ width: 28 }, { width: 110 }];
  const notes = [
    ["NHẬP CÂU HỎI TỪ EXCEL", "Mỗi file nhập cho một nhân vật được chọn trên website."],
    ["1. Chuẩn bị", "Điền dữ liệu ở trang Câu hỏi; giữ nguyên 8 tiêu đề. Thay hoặc xóa dòng [MẪU] trước khi nhập."],
    ["2. Nội dung", "Câu hỏi: 10–500 ký tự. Đủ 4 đáp án khác nhau, mỗi đáp án 1–250 ký tự."],
    ["3. Đáp án đúng", "Nhập một chữ A, B, C hoặc D. Phản hồi đúng và sai đều bắt buộc, tối đa 1.200 ký tự mỗi ô."],
    ["4. Tải lên", "Chọn nhân vật, tải file .xlsx (tối đa 2 MB, 500 dòng), kiểm tra kết quả rồi bấm Nhập câu hỏi hợp lệ."],
    ["5. Trùng lặp", "Bỏ qua câu trùng trong cùng file hoặc đã có ở nhân vật đã chọn. Không phân biệt chữ hoa/thường, khoảng trắng và dạng mã hóa dấu."],
    ["6. Lưu ý", "Dòng lỗi và trùng không được nhập. Chỉ dùng văn bản/số, không dùng công thức. Không thay đổi các câu hỏi đã có."],
  ];
  notes.forEach((values, index) => {
    const row = help.addRow(values); row.height = index === 0 ? 38 : 58;
    row.eachCell(cell => {
      cell.font = { name: "Arial", size: 11, bold: index === 0 || cell.col === "A", color: { argb: index === 0 ? "FFFFFFFF" : "FF23436A" } };
      cell.alignment = { wrapText: true, vertical: "middle" };
      if (index === 0) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF356BE8" } };
    });
  });
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}
