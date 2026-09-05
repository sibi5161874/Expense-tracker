/**
 * Splits a CSV's data rows into chunks of at most `chunkSize` rows, each with the header row
 * repeated so every chunk is independently a valid, importable CSV on its own.
 *
 * Exists so a large import can be committed as several smaller sequential requests instead of
 * one big one — the real fix for "a huge file risks the serverless function's own execution
 * timeout" on a platform (Vercel Hobby) where a cron-polled background job queue wouldn't
 * actually help: cron there only runs once a day at minimum, so a queued job would sit for up
 * to 24h, worse than today's synchronous-but-immediate import. Chunking needs no new
 * infrastructure and keeps every request within one function invocation's time budget.
 *
 * A side effect worth keeping: each chunk is its own independent commit against the DB, so a
 * failure partway through a large import doesn't roll back the chunks that already succeeded —
 * "resume from the failed chunk" falls out of this for free, not as extra code.
 */
export function chunkCsv(csv: string, chunkSize: number): string[] {
  const lines = csv.split(/\r\n|\n/);
  const header = lines[0];
  if (header === undefined) return [csv];

  const dataLines = lines.slice(1).filter((line) => line.length > 0);
  if (dataLines.length === 0) return [csv];

  const chunks: string[] = [];
  for (let i = 0; i < dataLines.length; i += chunkSize) {
    chunks.push([header, ...dataLines.slice(i, i + chunkSize)].join('\r\n'));
  }
  return chunks;
}
