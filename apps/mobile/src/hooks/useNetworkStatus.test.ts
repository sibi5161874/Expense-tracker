import { renderHook } from "@testing-library/react-native";
import NetInfo from "@react-native-community/netinfo";
import { useNetworkStatus, useNetworkDetails, checkIsOnline } from "./useNetworkStatus";

describe("useNetworkStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("defaults to online when NetInfo reports connected and reachable", async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: "wifi",
    });

    const { result } = await renderHook(() => useNetworkStatus());
    expect(result.current).toBe(true);
  });

  it("checkIsOnline resolves boolean correctly", async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
      isConnected: true,
      isInternetReachable: true,
      type: "wifi",
    });
    const isOnline = await checkIsOnline();
    expect(isOnline).toBe(true);

    (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
      isConnected: false,
      isInternetReachable: false,
      type: "none",
    });
    const isOffline = await checkIsOnline();
    expect(isOffline).toBe(false);
  });

  it("useNetworkDetails returns connection details", async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
      isConnected: true,
      isInternetReachable: true,
      type: "cellular",
    });

    const { result } = await renderHook(() => useNetworkDetails());
    expect(result.current.isOnline).toBe(true);
  });
});
