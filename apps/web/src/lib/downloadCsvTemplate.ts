import { toCsv } from '@repo/shared/utils';

export function downloadCsvTemplate(filename: string, columns: readonly string[], exampleRow: string[]) {
  const csv = toCsv([[...columns], exampleRow]);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
