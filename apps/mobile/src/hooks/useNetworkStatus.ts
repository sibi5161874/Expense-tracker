import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

/**
 * Single source of truth for "are we actually online" across the app — both the query
 * cache persister's reconnect logic and any screen that needs to gate a network-only
 * action (e.g. live price refresh) read from this instead of separately polling NetInfo.
 * `isConnected` alone can be true on a captive-portal Wi-Fi with no real internet, so we
 * also check `isInternetReachable` and treat `null` (still detecting) as "assume online"
 * rather than flashing an offline state on every cold start.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const reachable = state.isInternetReachable;
      setIsOnline(state.isConnected === true && reachable !== false);
    });
    return unsubscribe;
  }, []);

  return isOnline;
}

/** One-off check for gating a single action (e.g. a button press) rather than subscribing
 * to changes for the lifetime of a component. */
export async function checkIsOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected === true && state.isInternetReachable !== false;
}
