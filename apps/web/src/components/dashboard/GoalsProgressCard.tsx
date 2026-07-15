import { calculateProgressPct } from "@repo/shared/logic";
import { Progress } from "@/components/ui/progress";
import type { Goal } from "@repo/shared/types";

export function GoalsProgressCard({ goals }: { goals: Goal[] }) {
  return (
    <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold">Goals in progress</h2>
      {goals.length === 0 ? (
        <p className="text-muted-foreground text-sm">No goals yet.</p>
      ) : (
        <div className="space-y-4">
          {goals.slice(0, 4).map((goal) => {
            const progressPct = calculateProgressPct(goal.saved_amount, goal.target_amount);
            return (
              <div key={goal.id}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium">{goal.goal_name}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {(progressPct * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={Math.min(progressPct * 100, 100)} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
