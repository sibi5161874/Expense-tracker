'use client';

import { useCallback, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { useEntitlements } from '@/hooks/useEntitlements';
import { canAddAsset } from '@repo/shared/logic';
import {
  useFixedDeposits,
  useGoldAssets,
  useLoanLiabilities,
  useEpfAccounts,
  useNpsAccounts,
  useSsyAccounts,
  useSgbHoldings,
  useUlipPolicies,
  useRealEstateAssets,
  usePpfAccounts,
  useRecurringDeposits,
  useNscCertificates,
  useVehicles,
} from '@/hooks/useAssets';
import { FixedDepositCard } from '@/components/assets/FixedDepositCard';
import { GoldCard } from '@/components/assets/GoldCard';
import { LoanCard } from '@/components/assets/LoanCard';
import { EpfCard } from '@/components/assets/EpfCard';
import { NpsCard } from '@/components/assets/NpsCard';
import { SsyCard } from '@/components/assets/SsyCard';
import { SgbCard } from '@/components/assets/SgbCard';
import { UlipCard } from '@/components/assets/UlipCard';
import { RealEstateCard } from '@/components/assets/RealEstateCard';
import { PpfCard } from '@/components/assets/PpfCard';
import { RecurringDepositCard } from '@/components/assets/RecurringDepositCard';
import { NscCard } from '@/components/assets/NscCard';
import { VehicleCard } from '@/components/assets/VehicleCard';
import { AssetTabPanel } from '@/components/assets/AssetTabPanel';
import { AssetFormHost, type AssetTab, type AssetEditingState } from '@/components/assets/AssetFormHost';
import { ProLockedButton } from '@/components/shared/ProGate';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
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
  RealEstateAsset,
  PpfAsset,
  RecurringDepositAsset,
  NscAsset,
  VehicleAsset,
} from '@repo/shared/types';

const TAB_LABELS: Record<AssetTab, string> = {
  fd: 'Fixed Deposit',
  gold: 'Gold',
  loans: 'Loan',
  epf: 'EPF Account',
  nps: 'NPS Account',
  ssy: 'SSY Account',
  sgb: 'SGB Holding',
  ulip: 'ULIP Policy',
  realestate: 'Real Estate',
  ppf: 'PPF Account',
  rd: 'Recurring Deposit',
  nsc: 'NSC Certificate',
  vehicles: 'Vehicle',
};

function isAssetTab(value: string | null): value is AssetTab {
  return !!value && value in TAB_LABELS;
}

export default function AssetsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { tier } = useEntitlements();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<AssetTab>(() => (isAssetTab(urlTab) ? urlTab : 'fd'));

  // Sidebar sub-nav links to /assets?tab=gold etc., a same-route navigation local state alone
  // won't pick up. React's documented "adjusting state when a prop changes" pattern —
  // comparing during render and calling setState conditionally — instead of an effect, so
  // switching tabs doesn't cost an extra render + paint round trip. Only fires when the URL
  // names a tab that differs from what's showing, so it can't fight a same-render click.
  if (isAssetTab(urlTab) && urlTab !== activeTab) {
    setActiveTab(urlTab);
  }

  const [showForm, setShowForm] = useState(false);
  const [editingFd, setEditingFd] = useState<FixedDeposit | null>(null);
  const [editingGold, setEditingGold] = useState<GoldAsset | null>(null);
  const [editingLoan, setEditingLoan] = useState<LoanLiability | null>(null);
  const [editingEpf, setEditingEpf] = useState<EpfAsset | null>(null);
  const [editingNps, setEditingNps] = useState<NpsAsset | null>(null);
  const [editingSsy, setEditingSsy] = useState<SsyAsset | null>(null);
  const [editingSgb, setEditingSgb] = useState<SgbAsset | null>(null);
  const [editingUlip, setEditingUlip] = useState<UlipAsset | null>(null);
  const [editingRealEstate, setEditingRealEstate] = useState<RealEstateAsset | null>(null);
  const [editingPpf, setEditingPpf] = useState<PpfAsset | null>(null);
  const [editingRd, setEditingRd] = useState<RecurringDepositAsset | null>(null);
  const [editingNsc, setEditingNsc] = useState<NscAsset | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<VehicleAsset | null>(null);

  const fd = useFixedDeposits();
  const gold = useGoldAssets();
  const loans = useLoanLiabilities();
  const epf = useEpfAccounts();
  const nps = useNpsAccounts();
  const ssy = useSsyAccounts();
  const sgb = useSgbHoldings();
  const ulip = useUlipPolicies();
  const realEstate = useRealEstateAssets();
  const ppf = usePpfAccounts();
  const rd = useRecurringDeposits();
  const nsc = useNscCertificates();
  const vehicles = useVehicles();

  const sources = [fd, gold, loans, epf, nps, ssy, sgb, ulip, realEstate, ppf, rd, nsc, vehicles];
  const isLoading = sources.some((s) => s.isLoading);
  const error = sources.find((s) => s.error)?.error ?? null;
  const addLabel = TAB_LABELS[activeTab];
  // Total across every asset class, per FREE_TIER_LIMITS.maxAssets — not per class,
  // otherwise a free user could hit the wall on a single asset type in a week.
  const totalAssetCount = sources.reduce((sum, s) => sum + (s.data?.length ?? 0), 0);
  const canAdd = canAddAsset(totalAssetCount, tier);

  function goToUpgrade() {
    toast.info(`You've reached the Free plan's asset limit. Start your Pro trial to add more.`);
    router.push('/settings?tab=billing');
  }

  const handleDeleteFd = useCallback((id: string) => fd.remove(id), [fd]);
  const handleDeleteGold = useCallback((id: string) => gold.remove(id), [gold]);
  const handleDeleteLoan = useCallback((id: string) => loans.remove(id), [loans]);
  const handleDeleteEpf = useCallback((id: string) => epf.remove(id), [epf]);
  const handleDeleteNps = useCallback((id: string) => nps.remove(id), [nps]);
  const handleDeleteSsy = useCallback((id: string) => ssy.remove(id), [ssy]);
  const handleDeleteSgb = useCallback((id: string) => sgb.remove(id), [sgb]);
  const handleDeleteUlip = useCallback((id: string) => ulip.remove(id), [ulip]);
  const handleDeleteRealEstate = useCallback((id: string) => realEstate.remove(id), [realEstate]);
  const handleDeletePpf = useCallback((id: string) => ppf.remove(id), [ppf]);
  const handleDeleteRd = useCallback((id: string) => rd.remove(id), [rd]);
  const handleDeleteNsc = useCallback((id: string) => nsc.remove(id), [nsc]);
  const handleDeleteVehicle = useCallback((id: string) => vehicles.remove(id), [vehicles]);

  const editing: AssetEditingState = {
    fd: editingFd,
    gold: editingGold,
    loans: editingLoan,
    epf: editingEpf,
    nps: editingNps,
    ssy: editingSsy,
    sgb: editingSgb,
    ulip: editingUlip,
    realestate: editingRealEstate,
    ppf: editingPpf,
    rd: editingRd,
    nsc: editingNsc,
    vehicles: editingVehicle,
  };

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
    setEditingRealEstate(null);
    setEditingPpf(null);
    setEditingRd(null);
    setEditingNsc(null);
    setEditingVehicle(null);
  }

  return (
    <div>
      <PageHeader
        title="Assets"
        description="Fixed deposits, gold, retirement accounts, and other holdings."
        action={
          canAdd ? (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="size-4" />
              Add {addLabel}
            </Button>
          ) : (
            <ProLockedButton label="Asset limit reached" onUpgradeClick={goToUpgrade} />
          )
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
          <AssetTabPanel
            value="fd"
            items={fd.data}
            getKey={(row) => row.id}
            emptyMessage="No fixed deposits found. Add your first FD to get started."
            renderCard={(row) => <FixedDepositCard fd={row} onEdit={setEditingFd} onDelete={handleDeleteFd} />}
          />

          <AssetTabPanel
            value="gold"
            items={gold.data}
            getKey={(row) => row.id}
            emptyMessage="No gold holdings found. Add your first gold asset to get started."
            renderCard={(row) => <GoldCard gold={row} onEdit={setEditingGold} onDelete={handleDeleteGold} />}
          />

          <AssetTabPanel
            value="loans"
            items={loans.data}
            getKey={(row) => row.id}
            emptyMessage="No loans or liabilities found. Add your first loan to get started."
            renderCard={(row) => <LoanCard loan={row} onEdit={setEditingLoan} onDelete={handleDeleteLoan} />}
          />

          <AssetTabPanel
            value="epf"
            items={epf.data}
            getKey={(row) => row.id}
            emptyMessage="No EPF accounts found. Add your first EPF account to get started."
            renderCard={(row) => <EpfCard epf={row} onEdit={setEditingEpf} onDelete={handleDeleteEpf} />}
          />

          <AssetTabPanel
            value="nps"
            items={nps.data}
            getKey={(row) => row.id}
            emptyMessage="No NPS accounts found. Add your first NPS account to get started."
            renderCard={(row) => <NpsCard nps={row} onEdit={setEditingNps} onDelete={handleDeleteNps} />}
          />

          <AssetTabPanel
            value="ssy"
            items={ssy.data}
            getKey={(row) => row.id}
            emptyMessage="No SSY accounts found. Add your first SSY account to get started."
            renderCard={(row) => <SsyCard ssy={row} onEdit={setEditingSsy} onDelete={handleDeleteSsy} />}
          />

          <AssetTabPanel
            value="sgb"
            items={sgb.data}
            getKey={(row) => row.id}
            emptyMessage="No SGB holdings found. Add your first SGB holding to get started."
            renderCard={(row) => <SgbCard sgb={row} onEdit={setEditingSgb} onDelete={handleDeleteSgb} />}
          />

          <AssetTabPanel
            value="ulip"
            items={ulip.data}
            getKey={(row) => row.id}
            emptyMessage="No ULIP policies found. Add your first ULIP policy to get started."
            renderCard={(row) => <UlipCard ulip={row} onEdit={setEditingUlip} onDelete={handleDeleteUlip} />}
          />

          <AssetTabPanel
            value="realestate"
            items={realEstate.data}
            getKey={(row) => row.id}
            emptyMessage="No real estate found. Add your first property to get started."
            renderCard={(row) => (
              <RealEstateCard property={row} onEdit={setEditingRealEstate} onDelete={handleDeleteRealEstate} />
            )}
          />

          <AssetTabPanel
            value="ppf"
            items={ppf.data}
            getKey={(row) => row.id}
            emptyMessage="No PPF accounts found. Add your first PPF account to get started."
            renderCard={(row) => <PpfCard ppf={row} onEdit={setEditingPpf} onDelete={handleDeletePpf} />}
          />

          <AssetTabPanel
            value="rd"
            items={rd.data}
            getKey={(row) => row.id}
            emptyMessage="No recurring deposits found. Add your first RD to get started."
            renderCard={(row) => <RecurringDepositCard rd={row} onEdit={setEditingRd} onDelete={handleDeleteRd} />}
          />

          <AssetTabPanel
            value="nsc"
            items={nsc.data}
            getKey={(row) => row.id}
            emptyMessage="No NSC certificates found. Add your first certificate to get started."
            renderCard={(row) => <NscCard nsc={row} onEdit={setEditingNsc} onDelete={handleDeleteNsc} />}
          />

          <AssetTabPanel
            value="vehicles"
            items={vehicles.data}
            getKey={(row) => row.id}
            emptyMessage="No vehicles found. Add your first vehicle to get started."
            renderCard={(row) => (
              <VehicleCard vehicle={row} onEdit={setEditingVehicle} onDelete={handleDeleteVehicle} />
            )}
          />
        </Tabs>
      )}

      <AssetFormHost activeTab={activeTab} showForm={showForm} editing={editing} onClose={closeForm} />
    </div>
  );
}
