'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useInsurancePolicies } from '@/hooks/useInsurancePolicies';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { InsuranceForm } from '@/components/InsuranceForm';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';
import { calculateDaysUntilDue, calculatePremiumStatus } from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { premiumStatusTone } from '@/lib/badgeTones';
import { cn } from '@/lib/utils';
import type { InsurancePolicy } from '@repo/shared/types';

const HEAD = 'text-xs font-semibold tracking-wide text-muted-foreground uppercase';
const HEAD_RIGHT = `${HEAD} text-right`;
const NUMERIC_CELL = 'text-right font-mono tabular-nums';

export default function InsurancePage() {
  const { data: policies, isLoading, error, deleteInsurancePolicy } = useInsurancePolicies();
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<InsurancePolicy | null>(null);

  const { requestDelete, dialog } = useConfirmDelete(deleteInsurancePolicy, 'Delete policy?', "This can't be undone.");

  function closeForm() {
    setShowForm(false);
    setEditingPolicy(null);
  }

  return (
    <div>
      <PageHeader
        title="Insurance"
        description="Term, health, motor, and other policies — coverage, premiums, and due dates."
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="size-4" />
            Add Policy
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState label="Loading insurance policies..." />
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        <div className="border-border/60 overflow-hidden rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={HEAD}>Type</TableHead>
                <TableHead className={HEAD}>Insurer</TableHead>
                <TableHead className={HEAD}>Policy Number</TableHead>
                <TableHead className={HEAD_RIGHT}>Coverage</TableHead>
                <TableHead className={HEAD_RIGHT}>Premium</TableHead>
                <TableHead className={HEAD}>Due Date</TableHead>
                <TableHead className={HEAD}>Status</TableHead>
                <TableHead className={HEAD_RIGHT}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="[&_tr:nth-child(even)]:bg-muted/40">
              {policies?.map((policy) => {
                const status = calculatePremiumStatus(policy.premium_due_date);
                const daysUntilDue = calculateDaysUntilDue(policy.premium_due_date);
                return (
                  <TableRow key={policy.id} className="hover:bg-accent/40 border-border/60">
                    <TableCell className="font-medium">{policy.policy_type}</TableCell>
                    <TableCell>{policy.insurer}</TableCell>
                    <TableCell className="text-muted-foreground">{policy.policy_number}</TableCell>
                    <TableCell className={NUMERIC_CELL}>{formatINR(policy.coverage_amount)}</TableCell>
                    <TableCell className={NUMERIC_CELL}>{formatINR(policy.premium_amount)}</TableCell>
                    <TableCell>
                      <span className={cn(status === 'Overdue' && 'text-destructive')}>
                        {policy.premium_due_date}
                        <span className="text-muted-foreground ml-1.5 text-xs">
                          ({daysUntilDue >= 0 ? `${daysUntilDue}d` : `${Math.abs(daysUntilDue)}d overdue`})
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={premiumStatusTone(status)}>{status}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground"
                          onClick={() => setEditingPolicy(policy)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => requestDelete(policy.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {policies?.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={8} className="text-muted-foreground h-32 text-center">
                    No insurance policies found. Add your first policy to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {(showForm || editingPolicy) && (
        <InsuranceForm
          onSuccess={closeForm}
          onCancel={closeForm}
          editing={
            editingPolicy
              ? {
                  id: editingPolicy.id,
                  policy_type: editingPolicy.policy_type,
                  insurer: editingPolicy.insurer,
                  policy_number: editingPolicy.policy_number,
                  coverage_amount: editingPolicy.coverage_amount,
                  premium_amount: editingPolicy.premium_amount,
                  premium_due_date: editingPolicy.premium_due_date,
                  nominee: editingPolicy.nominee ?? undefined,
                }
              : undefined
          }
        />
      )}
      {dialog}
    </div>
  );
}
