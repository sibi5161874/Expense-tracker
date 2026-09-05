import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>Pro</Badge>);
    expect(screen.getByText("Pro")).toBeInTheDocument();
  });

  it("applies the destructive variant's classes", () => {
    render(<Badge variant="destructive">Overdue</Badge>);
    expect(screen.getByText("Overdue")).toHaveClass("text-destructive");
  });

  it("defaults to the default variant when none is given", () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText("Default")).toHaveClass("bg-primary");
  });
});
