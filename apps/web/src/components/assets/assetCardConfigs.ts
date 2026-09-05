import {
  Landmark,
  Gem,
  HandCoins,
  Briefcase,
  PiggyBank,
  Heart,
  Coins,
  Umbrella,
  Home,
  ScrollText,
  CalendarClock,
  Car,
} from 'lucide-react';
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
import {
  calculateDaysLeft,
  calculateFixedDepositStatus,
  calculateGoldMetrics,
  calculateSgbMaturityDate,
  calculateSsyMaturityDate,
  calculateRealEstatePnl,
} from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { fixedDepositStatusTone } from '@/lib/badgeTones';
import type { AssetCardConfig, AssetCardField } from './AssetCard';

export const fixedDepositCardConfig: AssetCardConfig<FixedDeposit> = {
  icon: Landmark,
  getTitle: (fd) => fd.bank,
  getBadge: (fd) => {
    const status = calculateFixedDepositStatus(fd.maturity_date, fd.withdrawn);
    return { tone: fixedDepositStatusTone(status), label: status };
  },
  getFields: (fd) => [
    { label: 'Principal', value: formatINR(fd.principal), numeric: true },
    { label: 'Interest Rate', value: `${fd.rate_pct}%` },
    { label: 'Maturity Date', value: fd.maturity_date },
    { label: 'Days Left', value: String(calculateDaysLeft(fd.maturity_date)), numeric: true },
    { label: 'Maturity Value', value: formatINR(fd.maturity_value), numeric: true, span2: true },
  ],
  confirmTitle: 'Delete fixed deposit?',
};

export const goldCardConfig: AssetCardConfig<GoldAsset> = {
  icon: Gem,
  getTitle: (gold) => gold.description,
  getBadge: (gold) => {
    const { pnl } = calculateGoldMetrics(gold.grams, gold.rate_per_gram, gold.purchase_value);
    return { tone: pnl >= 0 ? 'success' : 'destructive', label: pnl >= 0 ? 'Profit' : 'Loss' };
  },
  getFields: (gold) => {
    const metrics = calculateGoldMetrics(gold.grams, gold.rate_per_gram, gold.purchase_value);
    return [
      { label: 'Grams', value: String(gold.grams), numeric: true },
      { label: 'Rate/gram', value: formatINR(gold.rate_per_gram), numeric: true },
      { label: 'Purchase Value', value: formatINR(gold.purchase_value), numeric: true },
      { label: 'Current Value', value: formatINR(metrics.currentValue), numeric: true },
      {
        label: 'P&L',
        value: formatINR(metrics.pnl),
        numeric: true,
        span2: true,
        tone: metrics.pnl >= 0 ? 'success' : 'destructive',
      },
    ];
  },
  confirmTitle: 'Delete gold holding?',
};

export const loanCardConfig: AssetCardConfig<LoanLiability> = {
  icon: HandCoins,
  getTitle: (loan) => loan.lender,
  getFields: (loan) => [
    { label: 'Outstanding', value: formatINR(loan.outstanding), numeric: true },
    { label: 'EMI', value: loan.emi != null ? formatINR(loan.emi) : '-', numeric: true },
    { label: 'Interest Rate', value: loan.interest_rate_pct != null ? `${loan.interest_rate_pct}%` : '-' },
    { label: 'Months Left', value: String(loan.months_left ?? '-'), numeric: true },
  ],
  confirmTitle: 'Delete loan?',
};

export const epfCardConfig: AssetCardConfig<EpfAsset> = {
  icon: Briefcase,
  getTitle: (epf) => epf.employer_name,
  getFields: (epf) => {
    const fields: AssetCardField[] = [
      { label: 'Current Balance', value: formatINR(epf.current_balance), numeric: true },
      { label: 'Monthly Contribution', value: formatINR(epf.monthly_contribution), numeric: true },
    ];
    if (epf.uan_number) fields.push({ label: 'UAN Number', value: epf.uan_number, span2: true });
    return fields;
  },
  confirmTitle: 'Delete EPF account?',
};

export const npsCardConfig: AssetCardConfig<NpsAsset> = {
  icon: PiggyBank,
  getTitle: (nps) => nps.pran_number,
  getBadge: (nps) => ({ tone: 'info', label: nps.tier }),
  getFields: (nps) => [{ label: 'Current Value', value: formatINR(nps.current_value), numeric: true }],
  confirmTitle: 'Delete NPS account?',
};

export const ssyCardConfig: AssetCardConfig<SsyAsset> = {
  icon: Heart,
  getTitle: (ssy) => ssy.account_holder_name,
  getBadge: (ssy) => {
    const maturityDate = calculateSsyMaturityDate(ssy.opening_date);
    const status = calculateFixedDepositStatus(maturityDate, false);
    return { tone: fixedDepositStatusTone(status), label: status };
  },
  getFields: (ssy) => {
    const maturityDate = calculateSsyMaturityDate(ssy.opening_date);
    return [
      { label: 'Current Balance', value: formatINR(ssy.current_balance), numeric: true },
      { label: 'Days Left', value: String(calculateDaysLeft(maturityDate)), numeric: true },
      { label: 'Account Number', value: ssy.account_number },
      { label: 'Maturity Date', value: maturityDate },
    ];
  },
  confirmTitle: 'Delete SSY account?',
};

export const sgbCardConfig: AssetCardConfig<SgbAsset> = {
  icon: Coins,
  getTitle: (sgb) => `${sgb.units_held}g SGB`,
  getBadge: (sgb) => {
    const maturityDate = calculateSgbMaturityDate(sgb.issue_date);
    const status = calculateFixedDepositStatus(maturityDate, false);
    return { tone: fixedDepositStatusTone(status), label: status };
  },
  getFields: (sgb) => {
    const maturityDate = calculateSgbMaturityDate(sgb.issue_date);
    const { currentValue, pnl } = calculateGoldMetrics(sgb.units_held, sgb.rate_per_gram, sgb.units_held * sgb.issue_price);
    return [
      { label: 'Current Value', value: formatINR(currentValue), numeric: true },
      { label: 'P&L', value: formatINR(pnl), numeric: true, tone: pnl >= 0 ? 'success' : 'destructive' },
      { label: 'Days Left', value: String(calculateDaysLeft(maturityDate)), numeric: true },
      { label: 'Maturity Date', value: maturityDate },
    ];
  },
  confirmTitle: 'Delete SGB holding?',
};

export const ulipCardConfig: AssetCardConfig<UlipAsset> = {
  icon: Umbrella,
  getTitle: (ulip) => ulip.insurer,
  getBadge: (ulip) => {
    const status = calculateFixedDepositStatus(ulip.maturity_date, false);
    return { tone: fixedDepositStatusTone(status), label: status };
  },
  getFields: (ulip) => [
    { label: 'Current Fund Value', value: formatINR(ulip.current_fund_value), numeric: true },
    { label: 'Sum Assured', value: formatINR(ulip.sum_assured), numeric: true },
    { label: 'Premium', value: `${formatINR(ulip.premium_amount)} / ${ulip.premium_frequency}`, numeric: true },
    { label: 'Days Left', value: String(calculateDaysLeft(ulip.maturity_date)), numeric: true },
    { label: 'Policy Number', value: ulip.policy_number, span2: true },
  ],
  confirmTitle: 'Delete ULIP policy?',
};

export const realEstateCardConfig: AssetCardConfig<RealEstateAsset> = {
  icon: Home,
  getTitle: (property) => property.description,
  getSubtitle: (property) =>
    `${property.property_type}${property.location ? ` · ${property.location}` : ''}`,
  getBadge: (property) => {
    const pnl = calculateRealEstatePnl(property.purchase_value, property.current_value);
    return { tone: pnl >= 0 ? 'success' : 'destructive', label: pnl >= 0 ? 'Profit' : 'Loss' };
  },
  getFields: (property) => {
    const pnl = calculateRealEstatePnl(property.purchase_value, property.current_value);
    return [
      { label: 'Purchase Value', value: formatINR(property.purchase_value), numeric: true },
      { label: 'Current Value', value: formatINR(property.current_value), numeric: true },
      {
        label: 'P&L',
        value: formatINR(pnl),
        numeric: true,
        span2: true,
        tone: pnl >= 0 ? 'success' : 'destructive',
      },
    ];
  },
  confirmTitle: 'Delete property?',
};

export const ppfCardConfig: AssetCardConfig<PpfAsset> = {
  icon: Landmark,
  getTitle: (ppf) => `PPF · ${ppf.account_number}`,
  getFields: (ppf) => [
    { label: 'Current Balance', value: formatINR(ppf.current_balance), numeric: true },
    { label: 'Annual Contribution', value: formatINR(ppf.annual_contribution), numeric: true },
    { label: 'Opening Date', value: ppf.opening_date, numeric: true, span2: true },
  ],
  confirmTitle: 'Delete PPF account?',
};

export const recurringDepositCardConfig: AssetCardConfig<RecurringDepositAsset> = {
  icon: CalendarClock,
  getTitle: (rd) => rd.bank,
  getBadge: (rd) => {
    const status = calculateFixedDepositStatus(rd.maturity_date, false);
    return { tone: fixedDepositStatusTone(status), label: status };
  },
  getFields: (rd) => [
    { label: 'Monthly Installment', value: formatINR(rd.monthly_installment), numeric: true },
    { label: 'Rate', value: `${rd.rate_pct}%`, numeric: true },
    { label: 'Maturity Value', value: formatINR(rd.maturity_value), numeric: true },
    { label: 'Maturity Date', value: rd.maturity_date, numeric: true },
  ],
  confirmTitle: 'Delete recurring deposit?',
};

export const nscCardConfig: AssetCardConfig<NscAsset> = {
  icon: ScrollText,
  getTitle: (nsc) => `NSC · ${nsc.certificate_number}`,
  getBadge: (nsc) => {
    const status = calculateFixedDepositStatus(nsc.maturity_date, false);
    return { tone: fixedDepositStatusTone(status), label: status };
  },
  getFields: (nsc) => [
    { label: 'Purchase Value', value: formatINR(nsc.purchase_value), numeric: true },
    { label: 'Maturity Value', value: formatINR(nsc.maturity_value), numeric: true },
    { label: 'Rate', value: `${nsc.rate_pct}%`, numeric: true },
    { label: 'Maturity Date', value: nsc.maturity_date, numeric: true },
  ],
  confirmTitle: 'Delete NSC certificate?',
};

export const vehicleCardConfig: AssetCardConfig<VehicleAsset> = {
  icon: Car,
  getTitle: (vehicle) => vehicle.description,
  getSubtitle: (vehicle) =>
    `${vehicle.vehicle_type}${vehicle.registration_number ? ` · ${vehicle.registration_number}` : ''}`,
  getBadge: (vehicle) => {
    const change = calculateRealEstatePnl(vehicle.purchase_value, vehicle.current_value);
    return { tone: change >= 0 ? 'success' : 'destructive', label: change >= 0 ? 'Appreciated' : 'Depreciated' };
  },
  getFields: (vehicle) => {
    const change = calculateRealEstatePnl(vehicle.purchase_value, vehicle.current_value);
    return [
      { label: 'Purchase Value', value: formatINR(vehicle.purchase_value), numeric: true },
      { label: 'Current Value', value: formatINR(vehicle.current_value), numeric: true },
      {
        label: 'Change',
        value: formatINR(change),
        numeric: true,
        span2: true,
        tone: change >= 0 ? 'success' : 'destructive',
      },
    ];
  },
  confirmTitle: 'Delete vehicle?',
};
