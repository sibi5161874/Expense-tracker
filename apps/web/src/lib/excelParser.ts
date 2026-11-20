/**
 * Utility to convert Excel (.xlsx / .xls) files into standard CSV text in the browser.
 * Powered by ExcelJS (lazy-loaded to avoid bundle bloat when only CSVs are used).
 */

const KNOWN_HEADER_KEYWORDS = [
  'date',
  'time',
  'symbol',
  'scrip',
  'instrument',
  'ticker',
  'type',
  'side',
  'action',
  'trade',
  'transaction',
  'order',
  'quantity',
  'qty',
  'units',
  'shares',
  'price',
  'rate',
  'nav',
  'amount',
  'debit',
  'credit',
  'balance',
  'narration',
  'particulars',
  'description',
  'status',
];

export async function isExcelFile(file: File): Promise<boolean> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    return true;
  }
  // Check magic bytes for ZIP (.xlsx) or OLE (.xls)
  try {
    const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    const isZip = head[0] === 0x50 && head[1] === 0x4b; // PK
    const isOle = head[0] === 0xd0 && head[1] === 0xcf && head[2] === 0x11 && head[3] === 0xe0;
    return isZip || isOle;
  } catch {
    return false;
  }
}

/**
 * Converts an Excel spreadsheet into CSV string.
 * Strips any leading metadata rows (e.g. bank title, account numbers) by locating
 * the primary header row with the highest number of recognized financial columns.
 */
export async function parseExcelToCsv(fileOrBuffer: File | ArrayBuffer): Promise<string> {
  const buffer =
    fileOrBuffer instanceof File ? await fileOrBuffer.arrayBuffer() : fileOrBuffer;

  // Lazy-load exceljs to keep the initial client bundle light
  const ExcelJSModule = await import('exceljs');
  const ExcelJS = ExcelJSModule.default || ExcelJSModule;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as ArrayBuffer);

  // Pick the first worksheet that contains rows
  const worksheet =
    workbook.worksheets.find((ws) => ws.rowCount > 0) || workbook.worksheets[0];
  if (!worksheet) return '';

  const rawRows: string[][] = [];

  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const values = row.values as unknown[];
    // ExcelJS row.values is 1-indexed (index 0 is undefined)
    const rowCells = Array.isArray(values) ? values.slice(1) : [];

    const cells = rowCells.map((cell) => {
      if (cell === null || cell === undefined) return '';

      if (cell instanceof Date) {
        // Format ISO Date YYYY-MM-DD
        return cell.toISOString().split('T')[0] ?? '';
      }

      if (typeof cell === 'object') {
        const obj = cell as Record<string, unknown>;
        if (obj.result !== undefined && obj.result !== null) {
          if (obj.result instanceof Date) {
            return obj.result.toISOString().split('T')[0] ?? '';
          }
          return String(obj.result);
        }
        if (obj.text !== undefined && obj.text !== null) {
          return String(obj.text);
        }
        if (Array.isArray(obj.richText)) {
          return obj.richText.map((t: { text?: string }) => t.text || '').join('');
        }
        return String(cell);
      }

      return String(cell);
    });

    // Skip empty lines
    if (cells.some((c) => c.trim().length > 0)) {
      rawRows.push(cells);
    }
  });

  if (rawRows.length === 0) return '';

  // Detect header row among the first 25 rows
  let headerRowIndex = 0;
  let maxScore = -1;

  const searchLimit = Math.min(rawRows.length, 25);
  for (let i = 0; i < searchLimit; i++) {
    const row = rawRows[i]!;
    const nonEmptyCount = row.filter((c) => c.trim().length > 0).length;
    if (nonEmptyCount < 2) continue;

    // Count how many cells in this row match known financial header terms
    let keywordHits = 0;
    for (const cell of row) {
      const norm = cell.trim().toLowerCase().replace(/[^a-z]/g, '');
      if (KNOWN_HEADER_KEYWORDS.some((kw) => norm.includes(kw))) {
        keywordHits++;
      }
    }

    const score = keywordHits * 10 + nonEmptyCount;
    if (score > maxScore) {
      maxScore = score;
      headerRowIndex = i;
    }
  }

  // Filter out any metadata rows before the detected header row
  const dataRows = rawRows.slice(headerRowIndex);

  // Normalize column count so all rows align with the header
  const headerColCount = dataRows[0]?.length ?? 0;

  const csvLines = dataRows.map((row) => {
    const padded = [...row];
    while (padded.length < headerColCount) padded.push('');

    return padded.map((cell) => {
      const str = cell.trim();
      // If cell contains commas, quotes, or newlines, escape quotes and wrap in quotes
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',');
  });

  return csvLines.join('\n');
}
