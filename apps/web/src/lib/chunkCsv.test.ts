import { describe, expect, it } from 'vitest';
import { chunkCsv } from './chunkCsv';

describe('chunkCsv', () => {
  const header = 'date,amount,notes';

  it('returns the whole csv as one chunk when under the chunk size', () => {
    const csv = [header, '2026-01-01,100,a', '2026-01-02,200,b'].join('\r\n');
    expect(chunkCsv(csv, 10)).toEqual([csv]);
  });

  it('splits into multiple chunks, each carrying the header row', () => {
    const rows = Array.from({ length: 5 }, (_, i) => `2026-01-0${i + 1},${i},row${i}`);
    const csv = [header, ...rows].join('\r\n');

    const chunks = chunkCsv(csv, 2);

    expect(chunks).toHaveLength(3);
    for (const chunk of chunks) {
      expect(chunk.split('\r\n')[0]).toBe(header);
    }
    // 2 + 2 + 1 data rows across the 3 chunks.
    expect(chunks[0]!.split('\r\n')).toHaveLength(3);
    expect(chunks[1]!.split('\r\n')).toHaveLength(3);
    expect(chunks[2]!.split('\r\n')).toHaveLength(2);
  });

  it('drops blank trailing lines rather than treating them as a data row', () => {
    const csv = [header, '2026-01-01,100,a', ''].join('\r\n');
    const chunks = chunkCsv(csv, 10);
    expect(chunks[0]!.split('\r\n')).toHaveLength(2);
  });

  it('returns the csv unchanged when there are no data rows at all', () => {
    expect(chunkCsv(header, 10)).toEqual([header]);
  });
});
