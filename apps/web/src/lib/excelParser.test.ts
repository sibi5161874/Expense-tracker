import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { parseExcelToCsv } from './excelParser';

describe('parseExcelToCsv', () => {
  it('converts an Excel workbook into clean CSV text', async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Trades');
    ws.addRow(['Date', 'Symbol', 'Type', 'Quantity', 'Price']);
    ws.addRow(['2026-03-05', 'RELIANCE', 'BUY', 10, 2900]);
    ws.addRow(['2026-03-06', 'TCS', 'SELL', 5, 3800]);

    const buffer = await wb.xlsx.writeBuffer();
    const csv = await parseExcelToCsv(buffer as ArrayBuffer);

    expect(csv).toContain('Date,Symbol,Type,Quantity,Price');
    expect(csv).toContain('2026-03-05,RELIANCE,BUY,10,2900');
    expect(csv).toContain('2026-03-06,TCS,SELL,5,3800');
  });

  it('skips leading metadata rows and starts from real header row', async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Statement');
    ws.addRow(['HDFC BANK STATEMENT']);
    ws.addRow(['Account Number: 123456789']);
    ws.addRow(['Txn Date', 'Description', 'Debit', 'Credit', 'Balance']);
    ws.addRow(['2026-01-01', 'Salary Credited', '', 150000, 250000]);

    const buffer = await wb.xlsx.writeBuffer();
    const csv = await parseExcelToCsv(buffer as ArrayBuffer);

    const lines = csv.split('\n');
    expect(lines[0]).toBe('Txn Date,Description,Debit,Credit,Balance');
    expect(lines[1]).toContain('Salary Credited');
  });

  it('handles quotes, commas and date objects properly', async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Data');
    ws.addRow(['Date', 'Narration', 'Amount']);
    ws.addRow([new Date('2026-04-10T00:00:00.000Z'), 'Payment to ABC, Ltd', 4500]);

    const buffer = await wb.xlsx.writeBuffer();
    const csv = await parseExcelToCsv(buffer as ArrayBuffer);

    expect(csv).toContain('"Payment to ABC, Ltd"');
    expect(csv).toContain('2026-04-10');
  });
});
