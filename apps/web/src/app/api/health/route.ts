import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'ok';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && anonKey) {
    try {
      const client = createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      // Lightweight auth health ping
      const { error } = await client.auth.getSession();
      if (error) {
        dbStatus = 'degraded';
      }
    } catch {
      dbStatus = 'error';
    }
  } else {
    dbStatus = 'unconfigured';
  }

  const responseTimeMs = Date.now() - startTime;
  const isHealthy = dbStatus === 'ok' || dbStatus === 'unconfigured';

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(process.uptime()),
      response_time_ms: responseTimeMs,
      services: {
        web: 'ok',
        database: dbStatus,
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}
