'use client';

import { useState, useMemo } from 'react';
import { Search, Sparkles, X, Target } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { GOAL_ICONS, GOAL_ICON_CATEGORIES, resolveGoalIcon } from '@/components/goals/goalIcons';

interface GoalIconPickerProps {
  selectedIcon: string | null;
  onSelect: (iconName: string) => void;
}

export function GoalIconPicker({ selectedIcon, onSelect }: GoalIconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredIcons = useMemo(() => {
    return GOAL_ICONS.filter((item) => {
      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = !search.trim() || item.label.toLowerCase().includes(search.trim().toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [search, selectedCategory]);

  // resolveGoalIcon looks up a stable component reference from a fixed Map (never constructs
  // one) — the compiler's static-components check can't verify that, so it's disabled below.
  const SelectedIcon = selectedIcon ? resolveGoalIcon(selectedIcon) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        className="bg-card hover:bg-accent border-input flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors"
        title="Pick Goal Icon"
      >
        {/* eslint-disable-next-line react-hooks/static-components -- SelectedIcon is a stable lookup from a fixed Map, not constructed per render */}
        {SelectedIcon ? <SelectedIcon className="text-primary size-4.5" /> : <Target className="text-muted-foreground size-4" />}
        <span className="text-xs font-medium">{selectedIcon ? 'Change' : 'Icon'}</span>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-3 sm:w-[380px]" align="start" sideOffset={6}>
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Sparkles className="text-primary size-3.5" />
              <span>Choose Goal Icon</span>
            </div>
            <Button type="button" variant="ghost" size="icon" className="size-6" onClick={() => setOpen(false)}>
              <X className="size-3.5" />
            </Button>
          </div>

          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              placeholder="Search icons (car, home, flight, laptop, wedding)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
              autoFocus
            />
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1 text-xs scrollbar-none">
            {GOAL_ICON_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'rounded-md px-2 py-0.5 whitespace-nowrap transition-colors',
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid max-h-[220px] grid-cols-6 gap-1.5 overflow-y-auto pr-1">
            {filteredIcons.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  onSelect(item.name);
                  setOpen(false);
                }}
                title={item.label}
                className={cn(
                  'hover:bg-accent flex flex-col items-center justify-center rounded-lg p-2.5 transition-transform motion-reduce:transition-none hover:scale-110 active:scale-95',
                  selectedIcon === item.name && 'bg-primary/20 ring-primary/40 ring-1'
                )}
              >
                <item.icon className="size-5" />
              </button>
            ))}
            {filteredIcons.length === 0 && (
              <div className="text-muted-foreground col-span-6 py-6 text-center text-xs">
                No icon found for &ldquo;{search}&rdquo;.
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
