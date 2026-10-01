"use client"

import * as React from "react"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  setMonth,
  setYear,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => format(new Date(2000, i, 1), "MMM"))
const YEARS_PER_PAGE = 12

interface CalendarProps {
  /** Selected date, or undefined for none. */
  selected?: Date
  onSelect: (date: Date) => void
  className?: string
}

type View = "days" | "months" | "years"

/**
 * Compact single-month picker — Monday-first grid, circular selected/today marks. Built on
 * date-fns (already a dependency) rather than a heavier picker library, since this only ever
 * needs single-date selection with month navigation, not ranges or multi-month layouts.
 *
 * The header label is clickable, cycling day-grid -> month-grid -> year-grid, so jumping to
 * a date far from today (e.g. a 10-year-old fixed deposit) doesn't take dozens of clicks.
 */
export function Calendar({ selected, onSelect, className }: CalendarProps) {
  const [month, setMonthState] = React.useState(() => selected ?? new Date())
  const [view, setView] = React.useState<View>("days")
  const [yearPageStart, setYearPageStart] = React.useState(
    () => Math.floor((selected ?? new Date()).getFullYear() / YEARS_PER_PAGE) * YEARS_PER_PAGE
  )

  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  return (
    <div className={cn("w-64 space-y-2", className)}>
      <div className="flex items-center justify-between px-1">
        {view === "days" ? (
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => setMonthState((m) => subMonths(m, 1))} aria-label="Previous month">
            <ChevronLeft className="size-4" />
          </Button>
        ) : view === "years" ? (
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => setYearPageStart((y) => y - YEARS_PER_PAGE)} aria-label="Previous years">
            <ChevronLeft className="size-4" />
          </Button>
        ) : (
          <span className="size-8" />
        )}

        <button
          type="button"
          onClick={() => setView((v) => (v === "days" ? "months" : v === "months" ? "years" : "days"))}
          className="rounded-md px-2 py-1 text-sm font-semibold hover:bg-accent"
        >
          {view === "years" ? `${yearPageStart} – ${yearPageStart + YEARS_PER_PAGE - 1}` : format(month, "MMMM yyyy")}
        </button>

        {view === "days" ? (
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => setMonthState((m) => addMonths(m, 1))} aria-label="Next month">
            <ChevronRight className="size-4" />
          </Button>
        ) : view === "years" ? (
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => setYearPageStart((y) => y + YEARS_PER_PAGE)} aria-label="Next years">
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <span className="size-8" />
        )}
      </div>

      {view === "days" && (
        <div className="grid grid-cols-7 gap-y-1">
          {WEEKDAYS.map((day) => (
            <span key={day} className="text-muted-foreground text-center text-[0.65rem] font-medium">
              {day}
            </span>
          ))}
          {days.map((day) => {
            const inMonth = isSameMonth(day, month);
            const isSelected = selected && isSameDay(day, selected);
            const today = isToday(day);
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onSelect(day)}
                className={cn(
                  "mx-auto flex size-7 items-center justify-center rounded-full text-xs transition-colors",
                  inMonth ? "text-foreground" : "text-muted-foreground/40",
                  !isSelected && "hover:bg-accent",
                  isSelected && "bg-primary text-primary-foreground font-semibold",
                  !isSelected && today && "text-primary font-semibold"
                )}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      )}

      {view === "months" && (
        <div className="grid grid-cols-3 gap-2 py-1">
          {MONTH_LABELS.map((label, i) => {
            const isCurrent = month.getMonth() === i;
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setMonthState((m) => setMonth(m, i));
                  setView("days");
                }}
                className={cn(
                  "rounded-lg py-2 text-xs font-medium transition-colors hover:bg-accent",
                  isCurrent ? "bg-primary text-primary-foreground font-semibold" : "text-foreground"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {view === "years" && (
        <div className="grid grid-cols-3 gap-2 py-1">
          {Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearPageStart + i).map((year) => {
            const isCurrent = month.getFullYear() === year;
            return (
              <button
                key={year}
                type="button"
                onClick={() => {
                  setMonthState((m) => setYear(m, year));
                  setView("months");
                }}
                className={cn(
                  "rounded-lg py-2 text-xs font-medium transition-colors hover:bg-accent",
                  isCurrent ? "bg-primary text-primary-foreground font-semibold" : "text-foreground"
                )}
              >
                {year}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
