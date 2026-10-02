import { createResilientFetcher } from '@/lib/fetchWithRetry';
import { coinGeckoIdForSymbol, extractCoinGeckoPrice } from '@repo/shared/logic';

const COINGECKO_PRICE_URL = 'https://api.coingecko.com/api/v3/simple/price';

/** Own independent breaker, like Yahoo's and AMFI's — CoinGecko being down says nothing about them. */
const fetchCoinGeckoResilient = createResilientFetcher({ label: 'CoinGecko' });

/**
 * USD spot price from CoinGecko — the fallback for a Crypto holding Yahoo couldn't price. USD on
 * purpose: Yahoo's `BTC-USD` quote is USD, so the two sources are interchangeable for the same
 * holding instead of one silently switching the holding's currency. Null for a symbol outside the
 * known-coin map or a response with no usable price.
 */
export async function fetchCoinGeckoUsdPrice(symbol: string): Promise<number | null> {
  const id = coinGeckoIdForSymbol(symbol);
  if (!id) return null;

  const res = await fetchCoinGeckoResilient(`${COINGECKO_PRICE_URL}?ids=${id}&vs_currencies=usd`, symbol);
  return extractCoinGeckoPrice(await res.json(), id);
}
