/**
 * Centralized server-side error logging. Structured `console.error` today, so
 * output is machine-parseable by whatever your host already captures
 * stdout/stderr with (Vercel, Railway, etc. all do this without setup).
 *
 * Every server-side catch block should funnel through here instead of a bare
 * `console.error`, so wiring a real monitoring service (Sentry and similar)
 * later is a one-file change: replace the body of `logError`, not every call
 * site. Not done in this pass because it needs an account/DSN only you can
 * create — same category of manual step as the Razorpay setup.
 */
export function logError(context: string, error: unknown, meta?: Record<string, unknown>) {
  const details =
    error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };

  console.error(
    JSON.stringify({
      level: 'error',
      context,
      timestamp: new Date().toISOString(),
      ...details,
      ...meta,
    })
  );
}
