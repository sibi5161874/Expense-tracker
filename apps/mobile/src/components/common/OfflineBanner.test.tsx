import type { ReactElement } from "react";
import { render, screen, act } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { OfflineBanner } from "./OfflineBanner";
import * as networkHooks from "@/hooks/useNetworkStatus";

const mockInitialMetrics = {
  insets: { top: 44, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 375, height: 812 },
};

function renderWithTheme(ui: ReactElement) {
  return render(
    <SafeAreaProvider initialMetrics={mockInitialMetrics}>
      <ThemeProvider>{ui}</ThemeProvider>
    </SafeAreaProvider>
  );
}

describe("OfflineBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when device is online on cold launch", async () => {
    jest.spyOn(networkHooks, "useNetworkStatus").mockReturnValue(true);

    await renderWithTheme(<OfflineBanner />);

    expect(screen.queryByText(/Offline • Changes will sync automatically/i)).toBeNull();
    expect(screen.queryByText(/Connected • Synced/i)).toBeNull();
  });

  it("renders the offline notice when network is offline", async () => {
    jest.spyOn(networkHooks, "useNetworkStatus").mockReturnValue(false);

    await renderWithTheme(<OfflineBanner />);

    expect(
      screen.getByText("Offline • Changes will sync automatically")
    ).toBeOnTheScreen();
  });

  it("renders 'Connected • Synced' temporarily upon reconnecting", async () => {
    const spy = jest.spyOn(networkHooks, "useNetworkStatus");
    spy.mockReturnValue(false);

    const { rerender } = await renderWithTheme(<OfflineBanner />);
    expect(
      screen.getByText("Offline • Changes will sync automatically")
    ).toBeOnTheScreen();

    // Transition back to online
    spy.mockReturnValue(true);
    await act(async () => {
      rerender(
        <SafeAreaProvider initialMetrics={mockInitialMetrics}>
          <ThemeProvider>
            <OfflineBanner />
          </ThemeProvider>
        </SafeAreaProvider>
      );
    });

    expect(await screen.findByText("Connected • Synced")).toBeOnTheScreen();
  });
});
