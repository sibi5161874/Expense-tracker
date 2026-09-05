import { render, screen } from "@testing-library/react-native";
import { StatusBadge } from "./Badge";

// @testing-library/react-native's render() is async — must be awaited before `screen`
// queries see the rendered tree.
describe("StatusBadge", () => {
  it("renders its label", async () => {
    await render(<StatusBadge tone="success">Achieved</StatusBadge>);
    expect(screen.getByText("Achieved")).toBeOnTheScreen();
  });

  it("renders a different tone without changing the label", async () => {
    await render(<StatusBadge tone="destructive">Overdue</StatusBadge>);
    expect(screen.getByText("Overdue")).toBeOnTheScreen();
  });
});
