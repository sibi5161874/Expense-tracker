interface QuickStat {
  label: string;
  value: string | number;
}

export function QuickStatsCard({ stats }: { stats: QuickStat[] }) {
  return (
    <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold">Quick stats</h2>
      <div className="space-y-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{stat.label}</span>
            <span className="font-medium tabular-nums">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
