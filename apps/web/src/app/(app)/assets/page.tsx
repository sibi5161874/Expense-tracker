'use client';

import { useCallback, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { useEntitlements } from '@/hooks/useEntitlements';
import { canAddAsset } from '@repo/shared/logic';
import { useAssetSections } from '@/hooks/useAssetSections';
import { AssetTabPanel } from '@/components/assets/AssetTabPanel';
import { AssetFormHost, type AssetTab, type AssetEditingState } from '@/components/assets/AssetFormHost';
import { ProLockedButton } from '@/components/shared/ProGate';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  crypto: 'Crypto Asset',
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
  const [editingRow, setEditingRow] = useState<{ tab: AssetTab; row: { id: string } } | null>(null);

  const { sections, isLoading, error, totalAssetCount } = useAssetSections();
  const addLabel = TAB_LABELS[activeTab];
  // Total across every asset class, per FREE_TIER_LIMITS.maxAssets — not per class,
  // otherwise a free user could hit the wall on a single asset type in a week.
  const canAdd = canAddAsset(totalAssetCount, tier);

  function goToUpgrade() {
    toast.info(`You've reached the Free plan's asset limit. Start your Pro trial to add more.`);
    router.push('/settings?tab=billing');
  }

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
    crypto: null,
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
            <Button onClick={() => setShowForm(true)} className="min-h-[44px]">
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
          {/* Desktop navigates between asset types via the sidebar's Assets sub-links, so no
              in-page TabsList is shown there (`md:hidden` below) — a redundant tab bar would
              just duplicate it. Mobile has no sidebar at all (issue #21), so it needs its own
              switcher; horizontally scrollable since there can be more asset classes than fit
              one screen width. */}
          <TabsList className="mb-2 flex w-full justify-start overflow-x-auto md:hidden">
            {sections.map((section) => (
              <TabsTrigger key={section.tab} value={section.tab} className="shrink-0">
                {TAB_LABELS[section.tab]}
              </TabsTrigger>
            ))}
          </TabsList>
          {sections.map((section) => (
            <AssetTabPanel
              key={section.tab}
              value={section.tab}
              items={section.items}
              getKey={(row) => row.id}
              emptyMessage={section.emptyMessage}
              onAdd={canAdd ? () => setShowForm(true) : goToUpgrade}
              addLabel={TAB_LABELS[section.tab]}
              renderCard={(row) => section.renderCard(row, (r) => setEditingRow({ tab: section.tab, row: r }))}
            />
          ))}
        </Tabs>
      )}

      <AssetFormHost activeTab={activeTab} showForm={showForm} editing={editing} onClose={closeForm} />
    </div>
  );
}
