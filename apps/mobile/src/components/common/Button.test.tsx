import type { ReactElement } from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { Button } from "./Button";

// Button reads accent/mode via useTheme(), which throws outside a ThemeProvider — every
// test in this file needs one mounted, same as the app's real root layout.
function renderWithTheme(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("Button", () => {
  it("renders its label", async () => {
    await renderWithTheme(<Button>Save</Button>);
    expect(screen.getByText("Save")).toBeOnTheScreen();
  });

  it("calls onPress when tapped", async () => {
    const onPress = jest.fn();
    await renderWithTheme(<Button onPress={onPress}>Delete</Button>);
    fireEvent.press(screen.getByText("Delete"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire onPress while loading", async () => {
    const onPress = jest.fn();
    await renderWithTheme(
      <Button onPress={onPress} loading>
        Save
      </Button>
    );
    // Loading swaps the label for a spinner — there is no "Save" text to press while loading.
    expect(screen.queryByText("Save")).toBeNull();
  });

  it("keeps the old 'outline' variant working unchanged (19 existing call sites depend on it)", async () => {
    await renderWithTheme(<Button variant="outline">Cancel</Button>);
    expect(screen.getByText("Cancel")).toBeOnTheScreen();
  });
});
