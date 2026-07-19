'use client';

import { useMemo } from 'react';
import { useFixedDeposits, useLoanLiabilities } from '@/hooks/useAssets';
import { useInsurancePolicies } from '@/hooks/useInsurancePolicies';
import {
  calculateDaysLeft,
  calculateDaysUntilDue,
  calculateFixedDepositStatus,
  calculatePremiumStatus,
} from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { ReportContainer } from '@/components/shared/ReportContainer';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DataTable, type DataTableColumn, type DataTableFilter } from '@/components/shared/DataTable';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';
import { fixedDepositStatusTone, premiumStatusTone } from '@/lib/badgeTones';
import type { FixedDeposit, InsurancePolicy, LoanLiability } from '@repo/shared/types';

export function AssetMaturityCalendarReport() {
  const { data: fds, isLoading: fdsLoading, error: fdsError } = useFixedDeposits();
  const { data: liabilities, isLoading: liabilitiesLoading, error: liabilitiesError } = useLoanLiabilities();
  const { data: policies, isLoading: policiesLoading, error: policiesError } = useInsurancePolicies();

  const sortedFds = useMemo(
    () => (fds ? [...fds].filter((fd) => !fd.withdrawn).sort((a, b) => a.maturity_date.localeCompare(b.maturity_date)) : []),
    [fds]
  );
  const sortedPolicies = useMemo(
    () => (policies ? [...policies].sort((a, b) => a.premium_due_date.localeCompare(b.premium_due_date)) : []),
    [policies]
  );

  if (fdsLoading || liabilitiesLoading || policiesLoading) return <LoadingState label="Loading report..." />;
  if (fdsError) return <ErrorState error={fdsError} />;
  if (liabilitiesError) return <ErrorState error={liabilitiesError} />;
  if (policiesError) return <ErrorState error={policiesError} />;

  const fdColumns: DataTableColumn<FixedDeposit>[] = [
    { id: 'bank', header: 'Bank', cell: (fd) => <span className="font-medium">{fd.bank}</span> },
    { id: 'maturityDate', header: 'Maturity Date', cell: (fd) => fd.maturity_date, sortValue: (fd) => fd.maturity_date },
    {
      id: 'daysLeft',
      header: 'Days Left',
      className: 'text-right',
      cell: (fd) => calculateDaysLeft(fd.maturity_date),
      sortValue: (fd) => calculateDaysLeft(fd.maturity_date),
    },
    { id: 'maturityValue', header: 'Maturity Value', className: 'text-right', cell: (fd) => formatINR(fd.maturity_value) },
    {
      id: 'status',
      header: 'Status',
      cell: (fd) => {
        const status = calculateFixedDepositStatus(fd.maturity_date, fd.withdrawn);
        return <StatusBadge tone={fixedDepositStatusTone(status)}>{status}</StatusBadge>;
      },
    },
  ];

  const policyColumns: DataTableColumn<InsurancePolicy>[] = [
    { id: 'insurer', header: 'Insurer', cell: (p) => <span className="font-medium">{p.insurer}</span> },
    { id: 'type', header: 'Type', cell: (p) => p.policy_type },
    { id: 'dueDate', header: 'Due Date', cell: (p) => p.premium_due_date, sortValue: (p) => p.premium_due_date },
    {
      id: 'daysUntilDue',
      header: 'Days Until Due',
      className: 'text-right',
      cell: (p) => calculateDaysUntilDue(p.premium_due_date),
      sortValue: (p) => calculateDaysUntilDue(p.premium_due_date),
    },
    { id: 'premiumAmount', header: 'Premium Amount', className: 'text-right', cell: (p) => formatINR(p.premium_amount) },
    {
      id: 'status',
      header: 'Status',
      cell: (p) => {
        const status = calculatePremiumStatus(p.premium_due_date);
        return <StatusBadge tone={premiumStatusTone(status)}>{status}</StatusBadge>;
      },
    },
  ];

  const policyStatuses = Array.from(new Set(sortedPolicies.map((p) => calculatePremiumStatus(p.premium_due_date))));
  const policyFilters: DataTableFilter<InsurancePolicy>[] = [
    {
      id: 'status',
      label: 'Status',
      options: policyStatuses.map((s) => ({ label: s, value: s })),
      getValue: (p) => calculatePremiumStatus(p.premium_due_date),
    },
  ];

  const liabilityColumns: DataTableColumn<LoanLiability>[] = [
    { id: 'lender', header: 'Lender', cell: (l) => <span className="font-medium">{l.lender}</span> },
    { id: 'outstanding', header: 'Outstanding', className: 'text-right', cell: (l) => formatINR(l.outstanding), sortValue: (l) => l.outstanding },
    { id: 'monthsLeft', header: 'Months Left', className: 'text-right', cell: (l) => l.months_left ?? '-' },
  ];

  return (
    <ReportContainer
      title="Asset Maturity Calendar"
      description="Fixed deposits and insurance premiums sorted by date. Loans show months remaining — the schema doesn't track a specific EMI due date, so a true calendar view isn't possible for those yet."
      excelSheets={[
        {
          name: 'FD Maturities',
          rows: sortedFds.map((fd) => ({
            Bank: fd.bank,
            'Maturity Date': fd.maturity_date,
            'Days Left': calculateDaysLeft(fd.maturity_date),
            'Maturity Value': fd.maturity_value,
          })),
        },
        {
          name: 'Insurance Premiums',
          rows: sortedPolicies.map((p) => ({
            Insurer: p.insurer,
            'Policy Type': p.policy_type,
            'Premium Due Date': p.premium_due_date,
            'Days Until Due': calculateDaysUntilDue(p.premium_due_date),
            'Premium Amount': p.premium_amount,
          })),
        },
        {
          name: 'Open Liabilities',
          rows: (liabilities ?? []).map((l) => ({
            Lender: l.lender,
            Outstanding: l.outstanding,
            'Months Left': l.months_left ?? '',
          })),
        },
      ]}
    >
      <div>
        <h2 className="mb-3 text-sm font-semibold">Fixed Deposit Maturities</h2>
        <DataTable
          data={sortedFds}
          columns={fdColumns}
          getRowId={(fd) => fd.id}
          searchPlaceholder="Search bank…"
          searchableText={(fd) => fd.bank}
          emptyMessage="No active fixed deposits."
        />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">Insurance Premium Due Dates</h2>
        <DataTable
          data={sortedPolicies}
          columns={policyColumns}
          getRowId={(p) => p.id}
          searchPlaceholder="Search insurer…"
          searchableText={(p) => `${p.insurer} ${p.policy_type}`}
          filters={policyFilters}
          emptyMessage="No insurance policies found."
        />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">Open Liabilities</h2>
        <DataTable
          data={liabilities ?? []}
          columns={liabilityColumns}
          getRowId={(l) => l.id}
          searchPlaceholder="Search lender…"
          searchableText={(l) => l.lender}
          emptyMessage="No open liabilities."
        />
      </div>
    </ReportContainer>
  );
}
