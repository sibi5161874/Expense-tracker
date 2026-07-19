import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Matches apps/web's QueryProvider so the same data doesn't get treated
            // as stale-and-refetched at different rates depending on platform.
            // refetchOnWindowFocus has no effect on React Native without wiring
            // focusManager to AppState — kept here only for parity/documentation.
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
