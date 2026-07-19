import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuickStat {
  label: string;
  value: string | number;
}

export function QuickStatsCard({ stats }: { stats: QuickStat[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{stat.label}</span>
            <span className="font-mono font-medium tabular-nums">{stat.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
