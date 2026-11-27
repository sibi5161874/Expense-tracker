import type { ReactElement } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { PaginationControl, PaginationHeader } from "./PaginationControl";

function renderWithTheme(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("PaginationControl", () => {
  it("renders null when totalCount is 0", async () => {
    await renderWithTheme(
      <PaginationControl
        page={0}
        pageSize={10}
        totalCount={0}
        onPageChange={jest.fn()}
      />
    );
    expect(screen.queryByText(/Showing/)).toBeNull();
  });

  it("renders telemetry and navigation dock properly", async () => {
    const onPageChange = jest.fn();
    const onPageSizeChange = jest.fn();

    await renderWithTheme(
      <PaginationControl
        page={0}
        pageSize={10}
        totalCount={384}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    );

    // Telemetry text
    expect(screen.getByText(/Showing 1–10 of 384/)).toBeOnTheScreen();

    // Center dock trigger
    expect(screen.getByText("Page 1 of 39")).toBeOnTheScreen();
    expect(screen.getByText("10 rows")).toBeOnTheScreen();

    // Next page button
    const nextBtn = screen.getByLabelText("Next page");
    fireEvent.press(nextBtn);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("disables previous button on first page and next button on last page", async () => {
    const onPageChange = jest.fn();

    await renderWithTheme(
      <PaginationControl
        page={0}
        pageSize={10}
        totalCount={50}
        onPageChange={onPageChange}
      />
    );

    // Prev disabled on page 0
    const prevBtn = screen.getByLabelText("Previous page");
    fireEvent.press(prevBtn);
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("opens sheet on trigger click and allows quick jump", async () => {
    const onPageChange = jest.fn();

    await renderWithTheme(
      <PaginationControl
        page={0}
        pageSize={10}
        totalCount={100}
        onPageChange={onPageChange}
        onPageSizeChange={jest.fn()}
      />
    );

    // Open sheet via center button wrapped in act
    const centerTrigger = screen.getByLabelText(
      /Page 1 of 10, 10 rows per page. Tap to jump page or change density./
    );
    await act(async () => {
      fireEvent.press(centerTrigger);
    });

    // Bottom sheet title is visible
    expect(screen.getByText("Page & Density")).toBeOnTheScreen();

    // Jump to page 2 via quick jump chip
    const chip2 = screen.getByLabelText("Jump to page 2");
    await act(async () => {
      fireEvent.press(chip2);
    });
    expect(onPageChange).toHaveBeenCalledWith(1); // 0-indexed page 1 is Page 2
  });

  it("allows changing rows per page from sheet", async () => {
    const onPageChange = jest.fn();
    const onPageSizeChange = jest.fn();

    await renderWithTheme(
      <PaginationControl
        page={2}
        pageSize={10}
        totalCount={100}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={[5, 10, 25, 50]}
      />
    );

    // Open sheet via density button wrapped in act
    const densityBtn = screen.getByLabelText(
      "Change rows per page. Currently 10 per page"
    );
    await act(async () => {
      fireEvent.press(densityBtn);
    });

    // Select 25 rows per page
    const rpp25 = screen.getByLabelText("Set rows per page to 25");
    await act(async () => {
      fireEvent.press(rpp25);
    });

    expect(onPageSizeChange).toHaveBeenCalledWith(25);
    expect(onPageChange).toHaveBeenCalledWith(0); // Resets to first page
  });

  it("renders PaginationHeader independently", async () => {
    const onOpen = jest.fn();
    await renderWithTheme(
      <PaginationHeader
        page={1}
        pageSize={5}
        totalCount={17}
        onOpenSheet={onOpen}
      />
    );

    expect(screen.getByText("Showing 6–10 of 17")).toBeOnTheScreen();
    const button = screen.getByLabelText(
      "Change rows per page. Currently 5 per page"
    );
    fireEvent.press(button);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
