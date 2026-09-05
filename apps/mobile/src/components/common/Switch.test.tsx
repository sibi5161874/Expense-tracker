import type { ReactElement } from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { Switch } from "./Switch";

function renderWithTheme(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("Switch", () => {
  it("reports its accessibility state as checked when on", async () => {
    await renderWithTheme(<Switch value onValueChange={() => {}} />);
    expect(screen.getByRole("switch")).toHaveProp("accessibilityState", expect.objectContaining({ checked: true }));
  });

  it("calls onValueChange with the flipped value on press", async () => {
    const onValueChange = jest.fn();
    await renderWithTheme(<Switch value={false} onValueChange={onValueChange} />);
    fireEvent.press(screen.getByRole("switch"));
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it("does not call onValueChange when disabled", async () => {
    const onValueChange = jest.fn();
    await renderWithTheme(<Switch value={false} onValueChange={onValueChange} disabled />);
    fireEvent.press(screen.getByRole("switch"));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
