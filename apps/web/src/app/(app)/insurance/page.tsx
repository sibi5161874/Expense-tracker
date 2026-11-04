'use client';

import { useState } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';
import { useInsurancePolicies } from '@/hooks/useInsurancePolicies';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { useTranslation } from '@/contexts/LocaleContext';
import { InsuranceForm } from '@/components/InsuranceForm';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';
import { EmptyState } from '@/components/shared/EmptyState';
import { calculateDaysUntilDue, calculatePremiumStatus } from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { premiumStatusTone } from '@/lib/badgeTones';
import { cn } from '@/lib/utils';
import type { InsurancePolicy } from '@repo/shared/types';

const HEAD = 'text-xs font-medium text-muted-foreground';
const HEAD_RIGHT = `${HEAD} text-right`;
const NUMERIC_CELL = 'text-right font-mono tabular-nums';

export default function InsurancePage() {
  const { data: policies, isLoading, error, deleteInsurancePolicy } = useInsurancePolicies();
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<InsurancePolicy | null>(null);

  const { t } = useTranslation();
  const { requestDelete, dialog } = useConfirmDelete(deleteInsurancePolicy, t('confirm.deletePolicy.title'), t('common.cannotBeUndone'));

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
          <Button onClick={() => setShowForm(true)} className="min-h-[44px]">
            <Plus className="size-4" />
            Add Policy
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState label="Loading insurance policies..." />
      ) : error ? (
        <ErrorState error={error} />
      ) : policies?.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Add your first policy"
          subtitle="Track term, health, motor, and other policies — coverage, premiums, and due dates in one place."
          action={
            <Button onClick={() => setShowForm(true)} className="min-h-[44px]">
              <Plus className="size-4" />
              Create Policy
            </Button>
          }
        />
      ) : (
        <>
          {/* Below `md:`, the 8-column table forces horizontal scrolling — a one-card-per-policy
              stack reads far better on a phone. */}
          <div className="space-y-2 md:hidden">
            {policies?.map((policy) => {
              const status = calculatePremiumStatus(policy.premium_due_date);
              const daysUntilDue = calculateDaysUntilDue(policy.premium_due_date);
              return (
                <div key={policy.id} className="bg-card space-y-2 rounded-2xl border border-border/60 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{policy.policy_type}</div>
                      <div className="text-muted-foreground text-xs">{policy.insurer}</div>
                    </div>
                    <StatusBadge tone={premiumStatusTone(status)}>{status}</StatusBadge>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                    <div className="space-y-0.5">
                      <div className="text-muted-foreground text-xs">Policy Number</div>
                      <div className="truncate">{policy.policy_number}</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-muted-foreground text-xs">Coverage</div>
                      <div>{formatINR(policy.coverage_amount)}</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-muted-foreground text-xs">Premium</div>
                      <div>{formatINR(policy.premium_amount)}</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-muted-foreground text-xs">Due Date</div>
                      <div className={cn(status === 'Overdue' && 'text-destructive')}>
                        {policy.premium_due_date}
                        <span className="text-muted-foreground ml-1 text-xs">
                          ({daysUntilDue >= 0 ? `${daysUntilDue}d` : `${Math.abs(daysUntilDue)}d overdue`})
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 border-t border-border/60 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-h-[44px] min-w-[44px] text-muted-foreground"
                      onClick={() => setEditingPolicy(policy)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-h-[44px] min-w-[44px] text-muted-foreground hover:text-destructive"
                      onClick={() => requestDelete(policy.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-border/60 hidden overflow-hidden rounded-2xl border md:block">
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
              </TableBody>
            </Table>
          </div>
        </>
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
