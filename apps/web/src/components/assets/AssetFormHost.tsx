'use client';

import { FixedDepositForm } from '@/components/FixedDepositForm';
import { GoldForm } from '@/components/GoldForm';
import { LoanForm } from '@/components/LoanForm';
import { EpfForm } from '@/components/EpfForm';
import { NpsForm } from '@/components/NpsForm';
import { SsyForm } from '@/components/SsyForm';
import { SgbForm } from '@/components/SgbForm';
import { UlipForm } from '@/components/UlipForm';
import { RealEstateForm } from '@/components/RealEstateForm';
import { PpfForm } from '@/components/PpfForm';
import { RecurringDepositForm } from '@/components/RecurringDepositForm';
import { NscForm } from '@/components/NscForm';
import { VehicleForm } from '@/components/VehicleForm';
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

export type AssetTab =
  | 'fd'
  | 'gold'
  | 'loans'
  | 'epf'
  | 'nps'
  | 'ssy'
  | 'sgb'
  | 'ulip'
  | 'realestate'
  | 'ppf'
  | 'rd'
  | 'nsc'
  | 'vehicles';

/** The row currently being edited, per asset type — at most one is ever non-null. */
export interface AssetEditingState {
  fd: FixedDeposit | null;
  gold: GoldAsset | null;
  loans: LoanLiability | null;
  epf: EpfAsset | null;
  nps: NpsAsset | null;
  ssy: SsyAsset | null;
  sgb: SgbAsset | null;
  ulip: UlipAsset | null;
  realestate: RealEstateAsset | null;
  ppf: PpfAsset | null;
  rd: RecurringDepositAsset | null;
  nsc: NscAsset | null;
  vehicles: VehicleAsset | null;
}

interface AssetFormHostProps {
  activeTab: AssetTab;
  showForm: boolean;
  editing: AssetEditingState;
  onClose: () => void;
}

/**
 * Renders whichever asset form is currently open — either "add" (the add button
 * was pressed on this tab) or "edit" (a card's edit button set that type's
 * editing row).
 *
 * Each asset type needs its own DB-row → form-input mapping (nullable columns
 * become optional fields, and the form only takes the editable subset), so this
 * is a deliberate switch rather than something generic: the mappings genuinely
 * differ per type and hiding that behind a cast would trade real type safety for
 * cosmetic brevity. Keeping it here rather than inline on the page keeps the
 * page component focused on layout and data-fetching.
 */
export function AssetFormHost({ activeTab, showForm, editing, onClose }: AssetFormHostProps) {
  const isOpen = (tab: AssetTab) => showForm && activeTab === tab;
  const formProps = { onSuccess: onClose, onCancel: onClose };

  if (isOpen('fd') || editing.fd) {
    const row = editing.fd;
    return (
      <FixedDepositForm
        {...formProps}
        editing={
          row
            ? {
                id: row.id,
                bank: row.bank,
                principal: row.principal,
                maturity_value: row.maturity_value,
                maturity_date: row.maturity_date,
                rate_pct: row.rate_pct,
                withdrawn: row.withdrawn,
              }
            : undefined
        }
      />
    );
  }

  if (isOpen('gold') || editing.gold) {
    const row = editing.gold;
    return (
      <GoldForm
        {...formProps}
        editing={
          row
            ? {
                id: row.id,
                description: row.description,
                grams: row.grams,
                rate_per_gram: row.rate_per_gram,
                purchase_value: row.purchase_value,
              }
            : undefined
        }
      />
    );
  }

  if (isOpen('loans') || editing.loans) {
    const row = editing.loans;
    return (
      <LoanForm
        {...formProps}
        editing={
          row
            ? {
                id: row.id,
                lender: row.lender,
                outstanding: row.outstanding,
                emi: row.emi ?? undefined,
                interest_rate_pct: row.interest_rate_pct ?? undefined,
                months_left: row.months_left ?? undefined,
                notes: row.notes ?? undefined,
              }
            : undefined
        }
      />
    );
  }

  if (isOpen('epf') || editing.epf) {
    const row = editing.epf;
    return (
      <EpfForm
        {...formProps}
        editing={
          row
            ? {
                id: row.id,
                employer_name: row.employer_name,
                current_balance: row.current_balance,
                monthly_contribution: row.monthly_contribution,
                uan_number: row.uan_number ?? undefined,
              }
            : undefined
        }
      />
    );
  }

  if (isOpen('nps') || editing.nps) {
    const row = editing.nps;
    return (
      <NpsForm
        {...formProps}
        editing={
          row ? { id: row.id, pran_number: row.pran_number, current_value: row.current_value, tier: row.tier } : undefined
        }
      />
    );
  }

  if (isOpen('ssy') || editing.ssy) {
    const row = editing.ssy;
    return (
      <SsyForm
        {...formProps}
        editing={
          row
            ? {
                id: row.id,
                account_holder_name: row.account_holder_name,
                account_number: row.account_number,
                current_balance: row.current_balance,
                opening_date: row.opening_date,
              }
            : undefined
        }
      />
    );
  }

  if (isOpen('sgb') || editing.sgb) {
    const row = editing.sgb;
    return (
      <SgbForm
        {...formProps}
        editing={
          row
            ? {
                id: row.id,
                units_held: row.units_held,
                issue_price: row.issue_price,
                issue_date: row.issue_date,
                rate_per_gram: row.rate_per_gram,
              }
            : undefined
        }
      />
    );
  }

  if (isOpen('ulip') || editing.ulip) {
    const row = editing.ulip;
    return (
      <UlipForm
        {...formProps}
        editing={
          row
            ? {
                id: row.id,
                insurer: row.insurer,
                policy_number: row.policy_number,
                sum_assured: row.sum_assured,
                current_fund_value: row.current_fund_value,
                premium_amount: row.premium_amount,
                premium_frequency: row.premium_frequency,
                maturity_date: row.maturity_date,
              }
            : undefined
        }
      />
    );
  }

  if (isOpen('realestate') || editing.realestate) {
    const row = editing.realestate;
    return (
      <RealEstateForm
        {...formProps}
        editing={
          row
            ? {
                id: row.id,
                description: row.description,
                property_type: row.property_type,
                location: row.location ?? undefined,
                purchase_value: row.purchase_value,
                current_value: row.current_value,
                purchase_date: row.purchase_date,
              }
            : undefined
        }
      />
    );
  }

  if (isOpen('ppf') || editing.ppf) {
    const row = editing.ppf;
    return (
      <PpfForm
        {...formProps}
        editing={
          row
            ? {
                id: row.id,
                account_number: row.account_number,
                current_balance: row.current_balance,
                annual_contribution: row.annual_contribution,
                opening_date: row.opening_date,
              }
            : undefined
        }
      />
    );
  }

  if (isOpen('rd') || editing.rd) {
    const row = editing.rd;
    return (
      <RecurringDepositForm
        {...formProps}
        editing={
          row
            ? {
                id: row.id,
                bank: row.bank,
                monthly_installment: row.monthly_installment,
                rate_pct: row.rate_pct,
                start_date: row.start_date,
                maturity_date: row.maturity_date,
                maturity_value: row.maturity_value,
              }
            : undefined
        }
      />
    );
  }

  if (isOpen('nsc') || editing.nsc) {
    const row = editing.nsc;
    return (
      <NscForm
        {...formProps}
        editing={
          row
            ? {
                id: row.id,
                certificate_number: row.certificate_number,
                purchase_value: row.purchase_value,
                maturity_value: row.maturity_value,
                rate_pct: row.rate_pct,
                purchase_date: row.purchase_date,
                maturity_date: row.maturity_date,
              }
            : undefined
        }
      />
    );
  }

  if (isOpen('vehicles') || editing.vehicles) {
    const row = editing.vehicles;
    return (
      <VehicleForm
        {...formProps}
        editing={
          row
            ? {
                id: row.id,
                description: row.description,
                vehicle_type: row.vehicle_type,
                registration_number: row.registration_number ?? undefined,
                purchase_value: row.purchase_value,
                current_value: row.current_value,
                purchase_date: row.purchase_date,
              }
            : undefined
        }
      />
    );
  }

  return null;
}
