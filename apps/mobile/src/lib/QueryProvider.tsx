import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, onlineManager, focusManager } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { AppState, type AppStateStatus } from "react-native";
import { registerOfflineMutationDefaults } from "@/lib/mutationDefaults";

// React Query's `onlineManager` defaults to browser `online`/`offline` events, which don't
// exist in React Native — without this, the app never learns connectivity changed, so
// paused mutations never resume and nothing ever refetches on reconnect.
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(state.isConnected === true && state.isInternetReachable !== false);
  });
});

// Same gap for `focusManager` (drives refetchOnWindowFocus) — RN's equivalent is AppState.
function onAppStateChange(status: AppStateStatus) {
  focusManager.setFocused(status === "active");
}

// Bump this when a query's cached *shape* changes incompatibly (e.g. a hook starts
// selecting different fields) so stale persisted data is discarded instead of rehydrated
// into code that no longer expects that shape. Increment, don't reset to the same value.
const PERSIST_CACHE_BUSTER = "v1";

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "money-manager-query-cache",
  throttleTime: 1_000,
});

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            // Queries resolve from cache first when offline instead of erroring outright —
            // the whole point of persisting the cache is that a cold, offline launch still
            // shows the last-known data rather than a blank error screen.
            networkMode: "offlineFirst",
          },
          mutations: {
            // A create/update/delete made while offline is queued (paused) instead of
            // failing immediately, and resumes automatically once onlineManager reports
            // back online. Survives a full force-quit for the entities registered in
            // mutationDefaults.ts (Transactions, Investment Log, Goals, Cashbook); other
            // entities' offline writes still resume within the same app session, just not
            // across a cold restart, until they're added there too.
            networkMode: "offlineFirst",
          },
        },
      })
  );

  useEffect(() => {
    registerOfflineMutationDefaults(queryClient);
  }, [queryClient]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", onAppStateChange);
    return () => subscription.remove();
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        buster: PERSIST_CACHE_BUSTER,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }}
      onSuccess={() => {
        // A mutation with no registered default (see mutationDefaults.ts) that got orphaned
        // by a cold restart has no mutationFn to resume with and rejects — .catch() here so
        // that one unresumable write doesn't stop every other paused write, or the refetch
        // below, from happening.
        //
        // Pull-sync: don't just trust the rehydrated cache forever — refetch everything
        // that's actually stale (per its own staleTime) as soon as we're back online, so
        // changes made on another device while this one was offline aren't missed.
        queryClient
          .resumePausedMutations()
          .catch(() => {})
          .then(() => queryClient.invalidateQueries());
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
