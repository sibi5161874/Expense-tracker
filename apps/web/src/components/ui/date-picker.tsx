"use client"

import * as React from "react"
import { format, parseISO } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
  /** ISO yyyy-MM-dd, matching what every date field in this app already stores/expects. */
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

/** Drop-in replacement for `<Input type="date">` — the browser's native date picker can't be
 * restyled to match the app's design, so this renders the same ISO string but through the
 * compact custom Calendar popover instead. */
export function DatePicker({ value, onChange, placeholder = "Pick a date", className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const selected = value ? parseISO(value) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-xl border border-input bg-transparent px-4 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50",
          !selected && "text-muted-foreground",
          className
        )}
      >
        <CalendarIcon className="text-muted-foreground size-4 shrink-0" />
        {selected ? format(selected, "PP") : placeholder}
      </PopoverTrigger>
      <PopoverContent align="start">
        <Calendar
          selected={selected}
          onSelect={(date) => {
            onChange(format(date, "yyyy-MM-dd"))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
