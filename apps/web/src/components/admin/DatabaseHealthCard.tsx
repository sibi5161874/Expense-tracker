import { useMemo } from 'react';
import { Database, AlertTriangle, CheckCircle, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DB_HEALTH_THRESHOLDS } from '@repo/shared/config';

interface DatabaseHealthCardProps {
  sizeBytes: number;
  limitBytes: number;
  percentageUsed: number;
}

export function DatabaseHealthCard({
  sizeBytes,
  limitBytes,
  percentageUsed,
}: DatabaseHealthCardProps) {
  const sizeMb = sizeBytes / (1024 * 1024);
  const limitMb = limitBytes / (1024 * 1024);

  const status = useMemo(() => {
    if (percentageUsed >= DB_HEALTH_THRESHOLDS.CRITICAL_PCT) {
      return {
        label: 'Critical',
        variant: 'destructive' as const,
        icon: Flame,
        colorClass: 'text-destructive',
        progressClass: 'bg-destructive',
        desc: 'Database capacity is approaching the 500 MB free-tier cap. Run VACUUM FULL or archive old records immediately.',
      };
    }
    if (percentageUsed >= DB_HEALTH_THRESHOLDS.WARNING_PCT) {
      return {
        label: 'Warning',
        variant: 'secondary' as const,
        icon: AlertTriangle,
        colorClass: 'text-amber-500 dark:text-amber-400',
        progressClass: 'bg-amber-500',
        desc: 'Database is above 70% capacity. Monitor growth and verify nightly archival jobs are running.',
      };
    }
    return {
      label: 'Healthy',
      variant: 'default' as const,
      icon: CheckCircle,
      colorClass: 'text-emerald-500 dark:text-emerald-400',
      progressClass: 'bg-emerald-500',
      desc: 'Storage usage is within safe limits for Supabase free-tier capacity.',
    };
  }, [percentageUsed]);

  const StatusIcon = status.icon;

  return (
    <Card className="rounded-2xl border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Database className="h-5 w-5 text-primary" />
            Database Storage Health
          </CardTitle>
          <CardDescription>
            Free-tier capacity tracker (500 MB read-only limit)
          </CardDescription>
        </div>
        <Badge variant={status.variant} className="flex items-center gap-1.5 px-3 py-1">
          <StatusIcon className="h-3.5 w-3.5" />
          {status.label}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-extrabold font-mono tracking-tight ${status.colorClass}`}>
              {percentageUsed.toFixed(1)}%
            </span>
            <span className="text-sm font-medium text-muted-foreground">used</span>
          </div>
          <div className="text-right font-mono text-sm">
            <span className="font-semibold text-foreground">{sizeMb.toFixed(1)} MB</span>
            <span className="text-muted-foreground"> / {limitMb.toFixed(0)} MB</span>
          </div>
        </div>

        <div className="relative w-full">
          <Progress value={Math.min(percentageUsed, 100)} className="h-3 rounded-full" />
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {status.desc}
        </p>
      </CardContent>
    </Card>
  );
}
