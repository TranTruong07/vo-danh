import "server-only";
import ExcelJS from "exceljs";
import { requireAdmin } from "./admin-auth";
import { exportOrderRows } from "@/server/repositories/orders";
import { orderFilter, orderStatuses } from "@/server/domain/order";
export async function exportOrders(status: string | undefined, q: string) {
  await requireAdmin();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Dấu Chân Sử Ký";
  const sheet = workbook.addWorksheet("Đơn hàng", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = [
    ["Mã đơn", 22], ["Ngày đặt (GMT+7)", 24], ["Khách hàng", 26], ["Email", 34], ["Điện thoại", 18], ["Địa chỉ", 50],
    ["Sản phẩm", 32], ["Số lượng", 12], ["Đơn giá (VND)", 20], ["Tổng tiền (VND)", 22],
    ["Phương thức", 16], ["Trạng thái", 26], ["Đã thanh toán lúc (GMT+7)", 28], ["Hoàn tất lúc (GMT+7)", 28], ["Ghi chú", 40],
  ].map(([header, width]) => ({ header: String(header), width: Number(width) }));
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF356BE8" } };
  sheet.getRow(1).height = 30;
  const date = (value?: Date) => value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "medium", timeZone: "Asia/Ho_Chi_Minh" }).format(value) : "";
  const cursor = await exportOrderRows(orderFilter(status), q);
  try {
    for await (const order of cursor) {
      // Plain strings remain text cells, including strings starting with '='; never formulas.
      sheet.addRow([String(order.orderCode), date(order.createdAt), order.name, order.email, order.phone, order.address,
        order.productName, order.quantity, order.unitPrice, order.total, order.paymentMethod === "cod" ? "COD" : "payOS",
        orderStatuses[order.status], date(order.paidAt), date(order.completedAt), order.note]);
    }
  } finally { await cursor.close(); }
  for (const column of [9, 10]) sheet.getColumn(column).numFmt = '#,##0" ₫"';
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, sheet.rowCount), column: 15 } };
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}
