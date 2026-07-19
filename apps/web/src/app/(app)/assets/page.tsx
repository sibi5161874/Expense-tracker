'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import {
  useFixedDeposits,
  useGoldAssets,
  useLoanLiabilities,
  useEpfAccounts,
  useNpsAccounts,
  useSsyAccounts,
  useSgbHoldings,
  useUlipPolicies,
} from '@/hooks/useAssets';
import { FixedDepositForm } from '@/components/FixedDepositForm';
import { GoldForm } from '@/components/GoldForm';
import { LoanForm } from '@/components/LoanForm';
import { EpfForm } from '@/components/EpfForm';
import { NpsForm } from '@/components/NpsForm';
import { SsyForm } from '@/components/SsyForm';
import { SgbForm } from '@/components/SgbForm';
import { UlipForm } from '@/components/UlipForm';
import { FixedDepositCard } from '@/components/assets/FixedDepositCard';
import { GoldCard } from '@/components/assets/GoldCard';
import { LoanCard } from '@/components/assets/LoanCard';
import { EpfCard } from '@/components/assets/EpfCard';
import { NpsCard } from '@/components/assets/NpsCard';
import { SsyCard } from '@/components/assets/SsyCard';
import { SgbCard } from '@/components/assets/SgbCard';
import { UlipCard } from '@/components/assets/UlipCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';
import type {
  FixedDeposit,
  GoldAsset,
  LoanLiability,
  EpfAsset,
  NpsAsset,
  SsyAsset,
  SgbAsset,
  UlipAsset,
} from '@repo/shared/types';

type AssetTab = 'fd' | 'gold' | 'loans' | 'epf' | 'nps' | 'ssy' | 'sgb' | 'ulip';

const TAB_LABELS: Record<AssetTab, string> = {
  fd: 'Fixed Deposit',
  gold: 'Gold',
  loans: 'Loan',
  epf: 'EPF Account',
  nps: 'NPS Account',
  ssy: 'SSY Account',
  sgb: 'SGB Holding',
  ulip: 'ULIP Policy',
};

function isAssetTab(value: string | null): value is AssetTab {
  return !!value && value in TAB_LABELS;
}

export default function AssetsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<AssetTab>(() => {
    const tab = searchParams.get('tab');
    return isAssetTab(tab) ? tab : 'fd';
  });

  // Sidebar sub-nav links to /assets?tab=gold etc.; since that's a same-route navigation,
  // sync the tab on query changes rather than relying on the initial state alone.
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (isAssetTab(tab)) setActiveTab(tab);
  }, [searchParams]);

  const [showForm, setShowForm] = useState(false);
  const [editingFd, setEditingFd] = useState<FixedDeposit | null>(null);
  const [editingGold, setEditingGold] = useState<GoldAsset | null>(null);
  const [editingLoan, setEditingLoan] = useState<LoanLiability | null>(null);
  const [editingEpf, setEditingEpf] = useState<EpfAsset | null>(null);
  const [editingNps, setEditingNps] = useState<NpsAsset | null>(null);
  const [editingSsy, setEditingSsy] = useState<SsyAsset | null>(null);
  const [editingSgb, setEditingSgb] = useState<SgbAsset | null>(null);
  const [editingUlip, setEditingUlip] = useState<UlipAsset | null>(null);

  const { data: fixedDeposits, isLoading: fdLoading, error: fdError, deleteFixedDeposit } = useFixedDeposits();
  const { data: goldHoldings, isLoading: goldLoading, error: goldError, deleteGold } = useGoldAssets();
  const { data: loans, isLoading: loansLoading, error: loansError, deleteLoanLiability } = useLoanLiabilities();
  const { data: epfAccounts, isLoading: epfLoading, error: epfError, deleteEpfAccount } = useEpfAccounts();
  const { data: npsAccounts, isLoading: npsLoading, error: npsError, deleteNpsAccount } = useNpsAccounts();
  const { data: ssyAccounts, isLoading: ssyLoading, error: ssyError, deleteSsyAccount } = useSsyAccounts();
  const { data: sgbHoldings, isLoading: sgbLoading, error: sgbError, deleteSgbHolding } = useSgbHoldings();
  const { data: ulipPolicies, isLoading: ulipLoading, error: ulipError, deleteUlipPolicy } = useUlipPolicies();

  const isLoading =
    fdLoading || goldLoading || loansLoading || epfLoading || npsLoading || ssyLoading || sgbLoading || ulipLoading;
  const error = fdError || goldError || loansError || epfError || npsError || ssyError || sgbError || ulipError;
  const addLabel = TAB_LABELS[activeTab];

  const handleDeleteFd = useCallback((id: string) => deleteFixedDeposit(id), [deleteFixedDeposit]);
  const handleDeleteGold = useCallback((id: string) => deleteGold(id), [deleteGold]);
  const handleDeleteLoan = useCallback((id: string) => deleteLoanLiability(id), [deleteLoanLiability]);
  const handleDeleteEpf = useCallback((id: string) => deleteEpfAccount(id), [deleteEpfAccount]);
  const handleDeleteNps = useCallback((id: string) => deleteNpsAccount(id), [deleteNpsAccount]);
  const handleDeleteSsy = useCallback((id: string) => deleteSsyAccount(id), [deleteSsyAccount]);
  const handleDeleteSgb = useCallback((id: string) => deleteSgbHolding(id), [deleteSgbHolding]);
  const handleDeleteUlip = useCallback((id: string) => deleteUlipPolicy(id), [deleteUlipPolicy]);

  function closeForm() {
    setShowForm(false);
    setEditingFd(null);
    setEditingGold(null);
    setEditingLoan(null);
    setEditingEpf(null);
    setEditingNps(null);
    setEditingSsy(null);
    setEditingSgb(null);
    setEditingUlip(null);
  }

  return (
    <div>
      <PageHeader
        title="Assets"
        description="Fixed deposits, gold, retirement accounts, and other holdings."
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
          {/* No visible TabsList — navigation between asset types happens via the sidebar's
              Assets sub-links now, so a redundant in-page tab bar would just duplicate it. */}
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

          <TabsContent value="epf" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {epfAccounts?.map((epf) => (
                <EpfCard key={epf.id} epf={epf} onEdit={setEditingEpf} onDelete={handleDeleteEpf} />
              ))}
              {epfAccounts?.length === 0 && (
                <div className="text-muted-foreground col-span-full rounded-2xl border border-dashed p-12 text-center">
                  No EPF accounts found. Add your first EPF account to get started.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="nps" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {npsAccounts?.map((nps) => (
                <NpsCard key={nps.id} nps={nps} onEdit={setEditingNps} onDelete={handleDeleteNps} />
              ))}
              {npsAccounts?.length === 0 && (
                <div className="text-muted-foreground col-span-full rounded-2xl border border-dashed p-12 text-center">
                  No NPS accounts found. Add your first NPS account to get started.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ssy" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ssyAccounts?.map((ssy) => (
                <SsyCard key={ssy.id} ssy={ssy} onEdit={setEditingSsy} onDelete={handleDeleteSsy} />
              ))}
              {ssyAccounts?.length === 0 && (
                <div className="text-muted-foreground col-span-full rounded-2xl border border-dashed p-12 text-center">
                  No SSY accounts found. Add your first SSY account to get started.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sgb" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sgbHoldings?.map((sgb) => (
                <SgbCard key={sgb.id} sgb={sgb} onEdit={setEditingSgb} onDelete={handleDeleteSgb} />
              ))}
              {sgbHoldings?.length === 0 && (
                <div className="text-muted-foreground col-span-full rounded-2xl border border-dashed p-12 text-center">
                  No SGB holdings found. Add your first SGB holding to get started.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ulip" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ulipPolicies?.map((ulip) => (
                <UlipCard key={ulip.id} ulip={ulip} onEdit={setEditingUlip} onDelete={handleDeleteUlip} />
              ))}
              {ulipPolicies?.length === 0 && (
                <div className="text-muted-foreground col-span-full rounded-2xl border border-dashed p-12 text-center">
                  No ULIP policies found. Add your first ULIP policy to get started.
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

      {(showForm && activeTab === 'epf') || editingEpf ? (
        <EpfForm
          onSuccess={closeForm}
          onCancel={closeForm}
          editing={
            editingEpf
              ? {
                  id: editingEpf.id,
                  employer_name: editingEpf.employer_name,
                  current_balance: editingEpf.current_balance,
                  monthly_contribution: editingEpf.monthly_contribution,
                  uan_number: editingEpf.uan_number ?? undefined,
                }
              : undefined
          }
        />
      ) : null}

      {(showForm && activeTab === 'nps') || editingNps ? (
        <NpsForm
          onSuccess={closeForm}
          onCancel={closeForm}
          editing={
            editingNps
              ? {
                  id: editingNps.id,
                  pran_number: editingNps.pran_number,
                  current_value: editingNps.current_value,
                  tier: editingNps.tier,
                }
              : undefined
          }
        />
      ) : null}

      {(showForm && activeTab === 'ssy') || editingSsy ? (
        <SsyForm
          onSuccess={closeForm}
          onCancel={closeForm}
          editing={
            editingSsy
              ? {
                  id: editingSsy.id,
                  account_holder_name: editingSsy.account_holder_name,
                  account_number: editingSsy.account_number,
                  current_balance: editingSsy.current_balance,
                  opening_date: editingSsy.opening_date,
                }
              : undefined
          }
        />
      ) : null}

      {(showForm && activeTab === 'sgb') || editingSgb ? (
        <SgbForm
          onSuccess={closeForm}
          onCancel={closeForm}
          editing={
            editingSgb
              ? {
                  id: editingSgb.id,
                  units_held: editingSgb.units_held,
                  issue_price: editingSgb.issue_price,
                  issue_date: editingSgb.issue_date,
                  rate_per_gram: editingSgb.rate_per_gram,
                }
              : undefined
          }
        />
      ) : null}

      {(showForm && activeTab === 'ulip') || editingUlip ? (
        <UlipForm
          onSuccess={closeForm}
          onCancel={closeForm}
          editing={
            editingUlip
              ? {
                  id: editingUlip.id,
                  insurer: editingUlip.insurer,
                  policy_number: editingUlip.policy_number,
                  sum_assured: editingUlip.sum_assured,
                  current_fund_value: editingUlip.current_fund_value,
                  premium_amount: editingUlip.premium_amount,
                  premium_frequency: editingUlip.premium_frequency,
                  maturity_date: editingUlip.maturity_date,
                }
              : undefined
          }
        />
      ) : null}
    </div>
  );
}
