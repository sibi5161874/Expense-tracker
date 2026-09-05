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
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

interface CalendarProps {
  /** Selected date, or undefined for none. */
  selected?: Date
  onSelect: (date: Date) => void
  className?: string
}

/**
 * Compact single-month picker — Monday-first grid, circular selected/today marks. Built on
 * date-fns (already a dependency) rather than a heavier picker library, since this only ever
 * needs single-date selection with month navigation, not ranges or multi-month layouts.
 */
export function Calendar({ selected, onSelect, className }: CalendarProps) {
  const [month, setMonth] = React.useState(() => selected ?? new Date())

  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  return (
    <div className={cn("w-64 space-y-2", className)}>
      <div className="flex items-center justify-between px-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setMonth((m) => subMonths(m, 1))}
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-semibold">{format(month, "MMMM yyyy")}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setMonth((m) => addMonths(m, 1))}
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

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
    </div>
  );
}
