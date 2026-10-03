import { useState } from 'react';
import { Image, ImageSourcePropType } from 'react-native';
import { Landmark } from 'lucide-react-native';
import { useThemeColor } from '@/lib/colors';

const LOCAL_LOGOS: Record<string, ImageSourcePropType> = {
  // Banks
  HDFC: require('../../../assets/institutions/HDFC_back.jpg'),
  SBI: require('../../../assets/institutions/State_Bank_Of_india.png'),
  ICICI: require('../../../assets/institutions/ICIC_bank.jpg'),
  AXIS: require('../../../assets/institutions/Axis_bank.png'),
  KOTAK: require('../../../assets/institutions/Kotack_bank.png'),
  IDFC: require('../../../assets/institutions/IDFC.png'),
  DOHA: require('../../../assets/institutions/Doha_bank.png'),
  // Brokers
  ZERODHA: require('../../../assets/institutions/Zerodha.png'),
  UPSTOX: require('../../../assets/institutions/Upstocks.png'),
  GROWW: require('../../../assets/institutions/Groww.jpg'),
  INDMONEY: require('../../../assets/institutions/Ind_money.png'),
  ICICI_DIRECT: require('../../../assets/institutions/ICIC_direct.jpg'),
  CDSL: require('../../../assets/institutions/CDSL.png'),
  ANGEL_ONE: require('../../../assets/institutions/Angelone.png'),
  MSTOCK: require('../../../assets/institutions/M_Stocks.png'),
  FIVEPAISA: require('../../../assets/institutions/5_Paisa.jpg'),
  TICKERTAPE: require('../../../assets/institutions/Ticker_tape.jpg'),
  MFCENTRAL: require('../../../assets/institutions/MF_central.jpg'),
  KOTAK_NEO: require('../../../assets/institutions/Kotak_Neo.png'),
};

function getLocalLogo(identifier?: string): ImageSourcePropType | undefined {
  if (!identifier) return undefined;
  const upper = identifier.trim().toUpperCase();
  if (LOCAL_LOGOS[upper]) return LOCAL_LOGOS[upper];

  const lower = identifier.trim().toLowerCase();
  if (lower.includes('zerodha')) return LOCAL_LOGOS.ZERODHA;
  if (lower.includes('groww')) return LOCAL_LOGOS.GROWW;
  if (lower.includes('upstox') || lower.includes('upstocks')) return LOCAL_LOGOS.UPSTOX;
  if (lower.includes('angel') || lower.includes('angelone')) return LOCAL_LOGOS.ANGEL_ONE;
  if (lower.includes('indmoney') || lower.includes('ind money')) return LOCAL_LOGOS.INDMONEY;
  if (lower.includes('icici direct') || lower.includes('icicidirect')) return LOCAL_LOGOS.ICICI_DIRECT;
  if (lower.includes('hdfc')) return LOCAL_LOGOS.HDFC;
  if (lower.includes('sbi') || lower.includes('state bank')) return LOCAL_LOGOS.SBI;
  if (lower.includes('icici')) return LOCAL_LOGOS.ICICI;
  if (lower.includes('axis')) return LOCAL_LOGOS.AXIS;
  if (lower.includes('kotak neo')) return LOCAL_LOGOS.KOTAK_NEO;
  if (lower.includes('kotak')) return LOCAL_LOGOS.KOTAK;
  if (lower.includes('idfc')) return LOCAL_LOGOS.IDFC;
  if (lower.includes('doha')) return LOCAL_LOGOS.DOHA;
  if (lower.includes('5paisa') || lower.includes('fivepaisa')) return LOCAL_LOGOS.FIVEPAISA;
  if (lower.includes('tickertape')) return LOCAL_LOGOS.TICKERTAPE;
  if (lower.includes('mfcentral') || lower.includes('mf central')) return LOCAL_LOGOS.MFCENTRAL;
  if (lower.includes('mstock') || lower.includes('m.stock')) return LOCAL_LOGOS.MSTOCK;
  if (lower.includes('cdsl')) return LOCAL_LOGOS.CDSL;

  return undefined;
}

interface InstitutionLogoProps {
  /** Institution ID (e.g., 'ZERODHA', 'HDFC') */
  institutionId?: string;
  /** Name/Label for heuristic logo lookup */
  name?: string;
  /** The institution's own web domain (Institution.domain), when confidently known. */
  domain?: string;
  size?: number;
}

/**
 * A small logo for a bank/broker in import pickers and transaction rows.
 * Renders bundled local image assets first, then falls back to Google's favicon service,
 * and finally to a Landmark icon.
 */
export function InstitutionLogo({ institutionId, name, domain, size = 18 }: InstitutionLogoProps) {
  const [failed, setFailed] = useState(false);
  const mutedForeground = useThemeColor('mutedForeground');

  const localSource = getLocalLogo(institutionId) ?? getLocalLogo(name);
  if (localSource) {
    return (
      <Image
        source={localSource}
        style={{ width: size, height: size, borderRadius: 4 }}
        resizeMode="contain"
      />
    );
  }

  if (!domain || failed) {
    return <Landmark size={size} color={mutedForeground} />;
  }

  return (
    <Image
      source={{ uri: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64` }}
      style={{ width: size, height: size, borderRadius: 3 }}
      onError={() => setFailed(true)}
    />
  );
}
