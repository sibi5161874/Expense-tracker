/**
 * Centralized structured logging — server *and* client, four levels: logError, logWarn,
 * logInfo, logDebug. Every level writes a structured JSON line via `console.*`, so output
 * stays machine-parseable by whatever your host already captures stdout/stderr with (Vercel,
 * Railway, etc. all do this without setup).
 *
 * No APM forwarding (Sentry or otherwise) is wired up. An earlier version of this file
 * dynamically imported `@sentry/nextjs` behind an env var, but the official integration
 * (source maps, release tracking, performance tracing, `sentry.*.config.*`) was never
 * finished — a bare `captureException` call gives false confidence that errors are being
 * caught in production when nothing is actually configured. Removed rather than left
 * half-wired; re-add properly (via `npx @sentry/wizard`, not by hand) once there's a real
 * Sentry project to point it at.
 */

function logStructured(level: string, context: string, fields: Record<string, unknown>) {
  const line = JSON.stringify({ level, context, timestamp: new Date().toISOString(), ...fields });
  // eslint-disable-next-line no-console -- this IS the logging implementation
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else if (level === 'info') console.info(line);
  else console.debug(line);
}

export function logError(context: string, error: unknown, meta?: Record<string, unknown>) {
  const details =
    error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };

  logStructured('error', context, { ...details, ...meta });
}

/** For a real problem that was handled/recovered from — not fatal, but worth knowing happened
 * (a fallback kicked in, a non-critical write failed). */
export function logWarn(context: string, message: string, meta?: Record<string, unknown>) {
  logStructured('warn', context, { message, ...meta });
}

/** Routine operational signal — a background job ran, a cache was populated. */
export function logInfo(context: string, message: string, meta?: Record<string, unknown>) {
  logStructured('info', context, { message, ...meta });
}

/** Verbose detail useful when actively debugging something, not routine operation. Kept as a
 * distinct level rather than folded into logInfo so a later switch to filter dev-only debug
 * output by level is a one-line change. */
export function logDebug(context: string, message: string, meta?: Record<string, unknown>) {
  logStructured('debug', context, { message, ...meta });
}
