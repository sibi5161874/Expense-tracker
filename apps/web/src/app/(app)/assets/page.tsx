'use client';

import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { useFixedDeposits, useGoldAssets, useLoanLiabilities } from '@/hooks/useAssets';
import { FixedDepositForm } from '@/components/FixedDepositForm';
import { GoldForm } from '@/components/GoldForm';
import { LoanForm } from '@/components/LoanForm';
import { FixedDepositCard } from '@/components/assets/FixedDepositCard';
import { GoldCard } from '@/components/assets/GoldCard';
import { LoanCard } from '@/components/assets/LoanCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';
import type { FixedDeposit, GoldAsset, LoanLiability } from '@repo/shared/types';

type AssetTab = 'fd' | 'gold' | 'loans';

export default function AssetsPage() {
  const [activeTab, setActiveTab] = useState<AssetTab>('fd');
  const [showForm, setShowForm] = useState(false);
  const [editingFd, setEditingFd] = useState<FixedDeposit | null>(null);
  const [editingGold, setEditingGold] = useState<GoldAsset | null>(null);
  const [editingLoan, setEditingLoan] = useState<LoanLiability | null>(null);

  const { data: fixedDeposits, isLoading: fdLoading, error: fdError, deleteFixedDeposit } = useFixedDeposits();
  const { data: goldHoldings, isLoading: goldLoading, error: goldError, deleteGold } = useGoldAssets();
  const { data: loans, isLoading: loansLoading, error: loansError, deleteLoanLiability } = useLoanLiabilities();

  const isLoading = fdLoading || goldLoading || loansLoading;
  const error = fdError || goldError || loansError;
  const addLabel = activeTab === 'fd' ? 'Fixed Deposit' : activeTab === 'gold' ? 'Gold' : 'Loan';

  const handleDeleteFd = useCallback((id: string) => deleteFixedDeposit(id), [deleteFixedDeposit]);
  const handleDeleteGold = useCallback((id: string) => deleteGold(id), [deleteGold]);
  const handleDeleteLoan = useCallback((id: string) => deleteLoanLiability(id), [deleteLoanLiability]);

  function closeForm() {
    setShowForm(false);
    setEditingFd(null);
    setEditingGold(null);
    setEditingLoan(null);
  }

  return (
    <div>
      <PageHeader
        title="Assets"
        description="Fixed deposits, gold, and other liabilities."
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="size-4" />
            Add {addLabel}
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState label="Loading assets..." />
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AssetTab)}>
          <TabsList>
            <TabsTrigger value="fd">Fixed Deposits</TabsTrigger>
            <TabsTrigger value="gold">Gold</TabsTrigger>
            <TabsTrigger value="loans">Loans & Liabilities</TabsTrigger>
          </TabsList>

          <TabsContent value="fd" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {fixedDeposits?.map((fd) => (
                <FixedDepositCard key={fd.id} fd={fd} onEdit={setEditingFd} onDelete={handleDeleteFd} />
              ))}
              {fixedDeposits?.length === 0 && (
                <div className="text-muted-foreground col-span-full rounded-2xl border border-dashed p-12 text-center">
                  No fixed deposits found. Add your first FD to get started.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="gold" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {goldHoldings?.map((gold) => (
                <GoldCard key={gold.id} gold={gold} onEdit={setEditingGold} onDelete={handleDeleteGold} />
              ))}
              {goldHoldings?.length === 0 && (
                <div className="text-muted-foreground col-span-full rounded-2xl border border-dashed p-12 text-center">
                  No gold holdings found. Add your first gold asset to get started.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="loans" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {loans?.map((loan) => (
                <LoanCard key={loan.id} loan={loan} onEdit={setEditingLoan} onDelete={handleDeleteLoan} />
              ))}
              {loans?.length === 0 && (
                <div className="text-muted-foreground col-span-full rounded-2xl border border-dashed p-12 text-center">
                  No loans or liabilities found. Add your first loan to get started.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {(showForm && activeTab === 'fd') || editingFd ? (
        <FixedDepositForm
          onSuccess={closeForm}
          onCancel={closeForm}
          editing={
            editingFd
              ? {
                  id: editingFd.id,
                  bank: editingFd.bank,
                  principal: editingFd.principal,
                  maturity_value: editingFd.maturity_value,
                  maturity_date: editingFd.maturity_date,
                  rate_pct: editingFd.rate_pct,
                  withdrawn: editingFd.withdrawn,
                }
              : undefined
          }
        />
      ) : null}

      {(showForm && activeTab === 'gold') || editingGold ? (
        <GoldForm
          onSuccess={closeForm}
          onCancel={closeForm}
          editing={
            editingGold
              ? {
                  id: editingGold.id,
                  description: editingGold.description,
                  grams: editingGold.grams,
                  rate_per_gram: editingGold.rate_per_gram,
                  purchase_value: editingGold.purchase_value,
                }
              : undefined
          }
        />
      ) : null}

      {(showForm && activeTab === 'loans') || editingLoan ? (
        <LoanForm
          onSuccess={closeForm}
          onCancel={closeForm}
          editing={
            editingLoan
              ? {
                  id: editingLoan.id,
                  lender: editingLoan.lender,
                  outstanding: editingLoan.outstanding,
                  emi: editingLoan.emi ?? undefined,
                  interest_rate_pct: editingLoan.interest_rate_pct ?? undefined,
                  months_left: editingLoan.months_left ?? undefined,
                  notes: editingLoan.notes ?? undefined,
                }
              : undefined
          }
        />
      ) : null}
    </div>
  );
}
