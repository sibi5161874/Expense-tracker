import * as XLSX from "xlsx";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

export interface ExcelSheet {
  name: string;
  rows: Record<string, string | number>[];
}

/**
 * Mirrors apps/web/src/lib/exportToExcel.ts's ExcelSheet contract, but writes with the
 * `xlsx` package (already installed for mobile) instead of ExcelJS + a browser download —
 * there's no `Blob`/`<a download>` on a phone, so the workbook is base64-encoded, written to
 * a local file via expo-file-system, then handed to the OS share sheet via expo-sharing.
 */
export async function exportReportToExcel(filename: string, sheets: ExcelSheet[]) {
  const workbook = XLSX.utils.book_new();

  for (const sheet of sheets) {
    if (sheet.rows.length === 0) continue;
    const worksheet = XLSX.utils.json_to_sheet(sheet.rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name.slice(0, 31));
  }

  const base64 = XLSX.write(workbook, { type: "base64", bookType: "xlsx" }) as string;
  const uri = `${FileSystem.cacheDirectory}${filename}.xlsx`;
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: "base64" as FileSystem.EncodingType });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing isn't available on this device.");
  }
  await Sharing.shareAsync(uri, {
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    dialogTitle: filename,
    UTI: "org.openxmlformats.spreadsheetml.sheet",
  });
}
