import { useEffect, useState } from "react";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

export interface NetworkDetails {
  isOnline: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
}

function resolveIsOnline(state: NetInfoState): boolean {
  return state.isConnected === true && state.isInternetReachable !== false;
}

/**
 * Single source of truth for "are we actually online" across the app — both the query
 * cache persister's reconnect logic and any screen that needs to gate a network-only
 * action (e.g. live price refresh) read from this instead of separately polling NetInfo.
 * `isConnected` alone can be true on a captive-portal Wi-Fi with no real internet, so we
 * also check `isInternetReachable` and treat `null` (still detecting) as "assume online"
 * rather than flashing an offline state on every cold start.
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    NetInfo.fetch().then((state) => {
      setIsOnline(resolveIsOnline(state));
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(resolveIsOnline(state));
    });
    return unsubscribe;
  }, []);

  return isOnline;
}

export function useNetworkDetails(): NetworkDetails {
  const [details, setDetails] = useState<NetworkDetails>({
    isOnline: true,
    isInternetReachable: null,
    connectionType: null,
  });

  useEffect(() => {
    NetInfo.fetch().then((state) => {
      setDetails({
        isOnline: resolveIsOnline(state),
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
      });
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      setDetails({
        isOnline: resolveIsOnline(state),
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
      });
    });
    return unsubscribe;
  }, []);

  return details;
}

/** One-off check for gating a single action (e.g. a button press) rather than subscribing
 * to changes for the lifetime of a component. */
export async function checkIsOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return resolveIsOnline(state);
}
