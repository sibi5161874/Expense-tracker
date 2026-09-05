import type { ReactElement } from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { Chip } from "./Chip";

function renderWithTheme(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("Chip", () => {
  it("renders its label", async () => {
    await renderWithTheme(<Chip label="1080p" selected={false} onPress={() => {}} />);
    expect(screen.getByText("1080p")).toBeOnTheScreen();
  });

  it("reports selected state for accessibility", async () => {
    await renderWithTheme(<Chip label="4K" selected onPress={() => {}} />);
    expect(screen.getByRole("button")).toHaveProp("accessibilityState", expect.objectContaining({ selected: true }));
  });

  it("calls onPress when tapped", async () => {
    const onPress = jest.fn();
    await renderWithTheme(<Chip label="60fps" selected={false} onPress={onPress} />);
    fireEvent.press(screen.getByText("60fps"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
