import type { ReactNode } from 'react';
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
  useCryptoAssets,
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
  cryptoCardConfig,
} from '@/components/assets/assetCardConfigs';
import type { AssetTab } from '@/components/assets/AssetFormHost';

/** Every asset row shares an `id`, which is all AssetTabPanel/deletion need to stay generic here. */
export interface AssetRow {
  id: string;
}

/**
 * One entry per asset type, each still carrying its own concretely-typed hook result and
 * `renderCard` closure — only the per-type boilerplate around them (state, delete callback,
 * JSX shell) is unified into this array and a single `.map()` in assets/page.tsx. AssetFormHost
 * keeps its own explicit per-type switch on purpose (see that file's docstring): the row →
 * form-input mapping genuinely differs per type, so genericizing it there would trade real
 * type safety for brevity. This array only replaces the *layout* duplication, not that mapping.
 */
export interface AssetSection {
  tab: AssetTab;
  emptyMessage: string;
  items: AssetRow[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onDelete: (id: string) => void;
  renderCard: (row: AssetRow, onEdit: (row: AssetRow) => void) => ReactNode;
}

/**
 * Fetches and shapes every asset type's data into assets/page.tsx's `AssetSection[]` — split
 * out of that page so the 14 hook calls + section-building (the actual data plumbing) are
 * independently readable/testable from the tab/form/dialog JSX that consumes them.
 */
export function useAssetSections() {
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
  const crypto = useCryptoAssets();

  const sources = [fd, gold, loans, epf, nps, ssy, sgb, ulip, realEstate, ppf, rd, nsc, vehicles, crypto];
  const isLoading = sources.some((s) => s.isLoading);
  const error = sources.find((s) => s.error)?.error ?? null;
  // Total across every asset class, per FREE_TIER_LIMITS.maxAssets — not per class,
  // otherwise a free user could hit the wall on a single asset type in a week.
  const totalAssetCount = sources.reduce((sum, s) => sum + (s.data?.length ?? 0), 0);

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
    {
      tab: 'crypto',
      emptyMessage: 'No crypto assets found. Add your first crypto holding to get started.',
      items: crypto.data,
      isLoading: crypto.isLoading,
      error: crypto.error,
      onDelete: crypto.remove,
      renderCard: (row, onEdit) => (
        <AssetCard config={cryptoCardConfig} item={row as never} onEdit={() => onEdit(row)} onDelete={crypto.remove} />
      ),
    },
  ];

  return { sections, isLoading, error, totalAssetCount };
}
