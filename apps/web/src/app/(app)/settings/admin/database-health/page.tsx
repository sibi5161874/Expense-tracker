'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Table2, Archive, Zap, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { DatabaseHealthCard } from '@/components/admin/DatabaseHealthCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DbStatsResponse {
  database_size_bytes: number;
  database_limit_bytes: number;
  percentage_used: number;
  table_breakdown: Array<{
    table: string;
    size_bytes: number;
    rows: number;
    dead_tuples: number;
  }>;
  archive_runs: Array<{
    table: string;
    rows_moved: number;
    ran_at: string;
    duration_ms: number | null;
  }>;
  compression_status: Array<{
    table: string;
    column: string;
    compression: 'lz4' | 'pglz';
  }>;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function DatabaseHealthPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase();
  const isAuthorized = !!user?.email && (!adminEmail || user.email.toLowerCase() === adminEmail);

  useEffect(() => {
    if (!authLoading && (!user || (adminEmail && user.email?.toLowerCase() !== adminEmail))) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, adminEmail, router]);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<DbStatsResponse>({
    queryKey: ['admin', 'db-stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/db-stats');
      if (res.status === 403 || res.status === 401) {
        router.replace('/dashboard');
        throw new Error('Unauthorized');
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to fetch database health statistics');
      }
      return res.json();
    },
    enabled: isAuthorized && !authLoading,
    staleTime: 60_000,
  });

  if (authLoading || (isLoading && !data)) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 space-y-4">
        <PageHeader
          title="Database Health"
          description="Monitor free-tier 500 MB usage and archive activity."
        />
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-3 pt-6 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">
              {(error as Error)?.message || 'Failed to load database stats. Ensure you have admin permissions.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = data;

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Database Health & Optimization"
        description="Real-time storage capacity, dead-tuple bloat diagnostics, compression status, and archival history."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {stats && (
        <DatabaseHealthCard
          sizeBytes={stats.database_size_bytes}
          limitBytes={stats.database_limit_bytes}
          percentageUsed={stats.percentage_used}
        />
      )}

      {/* Table Storage & Bloat Breakdown */}
      <Card className="rounded-2xl border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Table2 className="h-4 w-4 text-primary" />
            Table Storage & Dead-Tuple Bloat Breakdown
          </CardTitle>
          <CardDescription>
            Tables with high dead tuples (exceeding 20%) should be scheduled for manual VACUUM FULL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-semibold">Table Name</TableHead>
                  <TableHead className="text-right font-semibold">Total Size</TableHead>
                  <TableHead className="text-right font-semibold">Live Rows</TableHead>
                  <TableHead className="text-right font-semibold">Dead Tuples</TableHead>
                  <TableHead className="text-right font-semibold">Bloat %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.table_breakdown.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No tables found in public schema.
                    </TableCell>
                  </TableRow>
                ) : (
                  stats?.table_breakdown.map((t) => {
                    const totalTup = t.rows + t.dead_tuples;
                    const bloatPct = totalTup > 0 ? (t.dead_tuples / totalTup) * 100 : 0;
                    return (
                      <TableRow key={t.table}>
                        <TableCell className="font-mono text-xs font-semibold text-foreground">
                          {t.table}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {formatBytes(t.size_bytes)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {t.rows.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {t.dead_tuples.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          <span
                            className={`font-semibold ${
                              bloatPct > 20
                                ? 'text-destructive'
                                : bloatPct > 10
                                ? 'text-amber-500'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {bloatPct.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Grid: Archive History & Compression Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Archive Runs History */}
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Archive className="h-4 w-4 text-primary" />
              Automated Archival History
            </CardTitle>
            <CardDescription>
              Nightly records older than 2 years moved to cold storage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="font-semibold">Table</TableHead>
                    <TableHead className="text-right font-semibold">Rows Moved</TableHead>
                    <TableHead className="text-right font-semibold">Duration</TableHead>
                    <TableHead className="text-right font-semibold">Ran At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.archive_runs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        No archive runs recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    stats?.archive_runs.map((r, idx) => (
                      <TableRow key={`${r.table}-${r.ran_at}-${idx}`}>
                        <TableCell className="font-mono text-xs font-medium">
                          {r.table}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-semibold text-emerald-500 dark:text-emerald-400">
                          +{r.rows_moved}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {r.duration_ms != null ? `${r.duration_ms} ms` : '—'}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {new Date(r.ran_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Compression Engine Status */}
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Zap className="h-4 w-4 text-primary" />
              Column Compression Status
            </CardTitle>
            <CardDescription>
              High-volume text columns configured with LZ4 compression algorithm.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="font-semibold">Target Table</TableHead>
                    <TableHead className="font-semibold">Column</TableHead>
                    <TableHead className="text-right font-semibold">Engine</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.compression_status.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                        No compression metadata found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    stats?.compression_status.map((c) => (
                      <TableRow key={`${c.table}-${c.column}`}>
                        <TableCell className="font-mono text-xs font-medium">
                          {c.table}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {c.column}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={c.compression === 'lz4' ? 'default' : 'secondary'}
                            className="font-mono text-[11px]"
                          >
                            {c.compression.toUpperCase()}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
