'use client';

import { useCallback, useState, type ReactNode } from 'react';
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
import { AssetCard } from '@/components/assets/AssetCard';
import {
  fixedDepositCardConfig,
  goldCardConfig,
  loanCardConfig,
  epfCardConfig,
  npsCardConfig,
  ssyCardConfig,
  sgbCardConfig,
  ulipCardConfig,
  realEstateCardConfig,
  ppfCardConfig,
  recurringDepositCardConfig,
  nscCardConfig,
  vehicleCardConfig,
} from '@/components/assets/assetCardConfigs';
import { AssetTabPanel } from '@/components/assets/AssetTabPanel';
import { AssetFormHost, type AssetTab, type AssetEditingState } from '@/components/assets/AssetFormHost';
import { ProLockedButton } from '@/components/shared/ProGate';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';

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

/** Every asset row shares an `id`, which is all AssetTabPanel/deletion need to stay generic here. */
interface AssetRow {
  id: string;
}

/**
 * One entry per asset type, each still carrying its own concretely-typed hook result and
 * `renderCard` closure — only the per-type boilerplate around them (state, delete callback,
 * JSX shell) is unified into this array and a single `.map()` below. `AssetFormHost` keeps
 * its own explicit per-type switch on purpose (see that file's docstring): the row → form-input
 * mapping genuinely differs per type, so genericizing it there would trade real type safety
 * for brevity. This array only replaces the *layout* duplication, not that mapping.
 */
interface AssetSection {
  tab: AssetTab;
  emptyMessage: string;
  items: AssetRow[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onDelete: (id: string) => void;
  renderCard: (row: AssetRow, onEdit: (row: AssetRow) => void) => ReactNode;
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
  const [editingRow, setEditingRow] = useState<{ tab: AssetTab; row: AssetRow } | null>(null);

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

  const sections: AssetSection[] = [
    {
      tab: 'fd',
      emptyMessage: 'No fixed deposits found. Add your first FD to get started.',
      items: fd.data,
      isLoading: fd.isLoading,
      error: fd.error,
      onDelete: fd.remove,
      renderCard: (row, onEdit) => (
        <AssetCard config={fixedDepositCardConfig} item={row as never} onEdit={() => onEdit(row)} onDelete={fd.remove} />
      ),
    },
    {
      tab: 'gold',
      emptyMessage: 'No gold holdings found. Add your first gold asset to get started.',
      items: gold.data,
      isLoading: gold.isLoading,
      error: gold.error,
      onDelete: gold.remove,
      renderCard: (row, onEdit) => (
        <AssetCard config={goldCardConfig} item={row as never} onEdit={() => onEdit(row)} onDelete={gold.remove} />
      ),
    },
    {
      tab: 'loans',
      emptyMessage: 'No loans or liabilities found. Add your first loan to get started.',
      items: loans.data,
      isLoading: loans.isLoading,
      error: loans.error,
      onDelete: loans.remove,
      renderCard: (row, onEdit) => (
        <AssetCard config={loanCardConfig} item={row as never} onEdit={() => onEdit(row)} onDelete={loans.remove} />
      ),
    },
    {
      tab: 'epf',
      emptyMessage: 'No EPF accounts found. Add your first EPF account to get started.',
      items: epf.data,
      isLoading: epf.isLoading,
      error: epf.error,
      onDelete: epf.remove,
      renderCard: (row, onEdit) => (
        <AssetCard config={epfCardConfig} item={row as never} onEdit={() => onEdit(row)} onDelete={epf.remove} />
      ),
    },
    {
      tab: 'nps',
      emptyMessage: 'No NPS accounts found. Add your first NPS account to get started.',
      items: nps.data,
      isLoading: nps.isLoading,
      error: nps.error,
      onDelete: nps.remove,
      renderCard: (row, onEdit) => (
        <AssetCard config={npsCardConfig} item={row as never} onEdit={() => onEdit(row)} onDelete={nps.remove} />
      ),
    },
    {
      tab: 'ssy',
      emptyMessage: 'No SSY accounts found. Add your first SSY account to get started.',
      items: ssy.data,
      isLoading: ssy.isLoading,
      error: ssy.error,
      onDelete: ssy.remove,
      renderCard: (row, onEdit) => (
        <AssetCard config={ssyCardConfig} item={row as never} onEdit={() => onEdit(row)} onDelete={ssy.remove} />
      ),
    },
    {
      tab: 'sgb',
      emptyMessage: 'No SGB holdings found. Add your first SGB holding to get started.',
      items: sgb.data,
      isLoading: sgb.isLoading,
      error: sgb.error,
      onDelete: sgb.remove,
      renderCard: (row, onEdit) => (
        <AssetCard config={sgbCardConfig} item={row as never} onEdit={() => onEdit(row)} onDelete={sgb.remove} />
      ),
    },
    {
      tab: 'ulip',
      emptyMessage: 'No ULIP policies found. Add your first ULIP policy to get started.',
      items: ulip.data,
      isLoading: ulip.isLoading,
      error: ulip.error,
      onDelete: ulip.remove,
      renderCard: (row, onEdit) => (
        <AssetCard config={ulipCardConfig} item={row as never} onEdit={() => onEdit(row)} onDelete={ulip.remove} />
      ),
    },
    {
      tab: 'realestate',
      emptyMessage: 'No real estate found. Add your first property to get started.',
      items: realEstate.data,
      isLoading: realEstate.isLoading,
      error: realEstate.error,
      onDelete: realEstate.remove,
      renderCard: (row, onEdit) => (
        <AssetCard
          config={realEstateCardConfig}
          item={row as never}
          onEdit={() => onEdit(row)}
          onDelete={realEstate.remove}
        />
      ),
    },
    {
      tab: 'ppf',
      emptyMessage: 'No PPF accounts found. Add your first PPF account to get started.',
      items: ppf.data,
      isLoading: ppf.isLoading,
      error: ppf.error,
      onDelete: ppf.remove,
      renderCard: (row, onEdit) => (
        <AssetCard config={ppfCardConfig} item={row as never} onEdit={() => onEdit(row)} onDelete={ppf.remove} />
      ),
    },
    {
      tab: 'rd',
      emptyMessage: 'No recurring deposits found. Add your first RD to get started.',
      items: rd.data,
      isLoading: rd.isLoading,
      error: rd.error,
      onDelete: rd.remove,
      renderCard: (row, onEdit) => (
        <AssetCard config={recurringDepositCardConfig} item={row as never} onEdit={() => onEdit(row)} onDelete={rd.remove} />
      ),
    },
    {
      tab: 'nsc',
      emptyMessage: 'No NSC certificates found. Add your first certificate to get started.',
      items: nsc.data,
      isLoading: nsc.isLoading,
      error: nsc.error,
      onDelete: nsc.remove,
      renderCard: (row, onEdit) => (
        <AssetCard config={nscCardConfig} item={row as never} onEdit={() => onEdit(row)} onDelete={nsc.remove} />
      ),
    },
    {
      tab: 'vehicles',
      emptyMessage: 'No vehicles found. Add your first vehicle to get started.',
      items: vehicles.data,
      isLoading: vehicles.isLoading,
      error: vehicles.error,
      onDelete: vehicles.remove,
      renderCard: (row, onEdit) => (
        <AssetCard config={vehicleCardConfig} item={row as never} onEdit={() => onEdit(row)} onDelete={vehicles.remove} />
      ),
    },
  ];

  const emptyEditing: AssetEditingState = {
    fd: null,
    gold: null,
    loans: null,
    epf: null,
    nps: null,
    ssy: null,
    sgb: null,
    ulip: null,
    realestate: null,
    ppf: null,
    rd: null,
    nsc: null,
    vehicles: null,
  };
  const editing: AssetEditingState = editingRow
    ? { ...emptyEditing, [editingRow.tab]: editingRow.row }
    : emptyEditing;

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingRow(null);
  }, []);

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
          {sections.map((section) => (
            <AssetTabPanel
              key={section.tab}
              value={section.tab}
              items={section.items}
              getKey={(row) => row.id}
              emptyMessage={section.emptyMessage}
              renderCard={(row) => section.renderCard(row, (r) => setEditingRow({ tab: section.tab, row: r }))}
            />
          ))}
        </Tabs>
      )}

      <AssetFormHost activeTab={activeTab} showForm={showForm} editing={editing} onClose={closeForm} />
    </div>
  );
}
