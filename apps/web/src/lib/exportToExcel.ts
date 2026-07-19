import ExcelJS from 'exceljs';

export interface ExcelSheet {
  name: string;
  rows: Record<string, string | number>[];
}

/** Writes one or more tabular sheets to a .xlsx file and triggers a browser download. */
export async function exportToExcel(filename: string, sheets: ExcelSheet[]) {
  const workbook = new ExcelJS.Workbook();

  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name.slice(0, 31));
    const firstRow = sheet.rows[0];
    if (firstRow) {
      worksheet.columns = Object.keys(firstRow).map((key) => ({ header: key, key }));
      worksheet.addRows(sheet.rows);
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
