'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { Search, Sparkles, Smile, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Theme } from 'emoji-picker-react';

// Lazy load full emoji-picker-react for Next.js SSR safety
const FullEmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => <div className="text-muted-foreground flex h-80 items-center justify-center text-xs">Loading emoji picker...</div>,
});

export const POPULAR_GOAL_EMOJIS = [
  { emoji: '🚗', name: 'Car / Automobile', category: 'Vehicles' },
  { emoji: '🏍️', name: 'Bike / Motorcycle', category: 'Vehicles' },
  { emoji: '🚙', name: 'SUV / Jeep', category: 'Vehicles' },
  { emoji: '🏎️', name: 'Sports Car', category: 'Vehicles' },
  { emoji: '🚲', name: 'Bicycle', category: 'Vehicles' },
  { emoji: '🛵', name: 'Scooter', category: 'Vehicles' },
  { emoji: '🏠', name: 'Home / House', category: 'Living' },
  { emoji: '🏡', name: 'Villa / Estate', category: 'Living' },
  { emoji: '🏢', name: 'Apartment / Flat', category: 'Living' },
  { emoji: '🛋️', name: 'Interior / Furniture', category: 'Living' },
  { emoji: '🏊', name: 'Pool / Luxury', category: 'Living' },
  { emoji: '✈️', name: 'Vacation / Travel', category: 'Travel' },
  { emoji: '🏖️', name: 'Beach / Holiday', category: 'Travel' },
  { emoji: '🏔️', name: 'Mountains / Trek', category: 'Travel' },
  { emoji: '🛳️', name: 'Cruise Trip', category: 'Travel' },
  { emoji: '🗼', name: 'World Tour / Paris', category: 'Travel' },
  { emoji: '⛺', name: 'Camping / Adventure', category: 'Travel' },
  { emoji: '💻', name: 'MacBook / Laptop', category: 'Tech' },
  { emoji: '📱', name: 'iPhone / Phone', category: 'Tech' },
  { emoji: '🖥️', name: 'Desktop PC / Setup', category: 'Tech' },
  { emoji: '⌚', name: 'Smartwatch / Apple Watch', category: 'Tech' },
  { emoji: '📷', name: 'Camera / Photography', category: 'Tech' },
  { emoji: '🎧', name: 'Headphones / Audio', category: 'Tech' },
  { emoji: '🎮', name: 'PlayStation / Gaming', category: 'Tech' },
  { emoji: '💍', name: 'Wedding / Ring', category: 'Life' },
  { emoji: '👶', name: 'Baby / Child', category: 'Life' },
  { emoji: '🎓', name: 'Higher Education / College', category: 'Education' },
  { emoji: '📚', name: 'Courses / Books', category: 'Education' },
  { emoji: '💰', name: 'Savings / Emergency Fund', category: 'Finance' },
  { emoji: '📈', name: 'Stocks / Trading', category: 'Finance' },
  { emoji: '🪙', name: 'Gold / Crypto', category: 'Finance' },
  { emoji: '🏦', name: 'Retirement Fund', category: 'Finance' },
  { emoji: '💎', name: 'Jewelry / Luxury', category: 'Finance' },
  { emoji: '🏥', name: 'Healthcare / Medical', category: 'Health' },
  { emoji: '🏋️', name: 'Fitness / Gym', category: 'Health' },
  { emoji: '🎁', name: 'Gift / Celebration', category: 'Life' },
  { emoji: '🐕', name: 'Pet / Dog', category: 'Life' },
];

const CATEGORIES = ['All', 'Vehicles', 'Living', 'Travel', 'Tech', 'Finance', 'Life', 'Education', 'Health'];

interface GoalEmojiPickerProps {
  selectedEmoji: string | null;
  onSelect: (emoji: string) => void;
}

export function GoalEmojiPicker({ selectedEmoji, onSelect }: GoalEmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFullPicker, setShowFullPicker] = useState(false);
  const { resolvedTheme } = useTheme();

  const filteredEmojis = useMemo(() => {
    return POPULAR_GOAL_EMOJIS.filter((item) => {
      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch =
        !search.trim() ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.emoji.includes(search.trim());
      return matchesCat && matchesSearch;
    });
  }, [search, selectedCategory]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        className="bg-card hover:bg-accent border-input flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors"
        title="Pick Goal Icon / Emoji"
      >
        {selectedEmoji ? (
          <span className="text-lg leading-none">{selectedEmoji}</span>
        ) : (
          <Smile className="text-muted-foreground size-4" />
        )}
        <span className="text-xs font-medium">{selectedEmoji ? 'Change' : 'Icon'}</span>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-3 sm:w-[380px]" align="start" sideOffset={6}>
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Sparkles className="text-primary size-3.5" />
              <span>Choose Goal Icon</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant={showFullPicker ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowFullPicker(!showFullPicker)}
              >
                {showFullPicker ? 'Quick Icons' : 'All Emojis'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => setOpen(false)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </div>

          {showFullPicker ? (
            <div className="h-[320px] overflow-hidden rounded-lg">
              <FullEmojiPicker
                theme={(resolvedTheme === 'dark' ? 'dark' : 'light') as Theme}
                width="100%"
                height="100%"
                lazyLoadEmojis
                onEmojiClick={(emojiData) => {
                  onSelect(emojiData.emoji);
                  setOpen(false);
                }}
              />
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                <Input
                  placeholder="Search icons (car, home, flight, macbook, wedding)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 text-xs"
                  autoFocus
                />
              </div>

              <div className="flex gap-1 overflow-x-auto pb-1 text-xs scrollbar-none">
                {CATEGORIES.map((cat) => (
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

              <div className="grid max-h-[200px] grid-cols-6 gap-1.5 overflow-y-auto pr-1">
                {filteredEmojis.map((item) => (
                  <button
                    key={`${item.emoji}-${item.name}`}
                    type="button"
                    onClick={() => {
                      onSelect(item.emoji);
                      setOpen(false);
                    }}
                    title={item.name}
                    className={cn(
                      'hover:bg-accent flex flex-col items-center justify-center rounded-lg p-2 text-xl transition-transform hover:scale-110 active:scale-95',
                      selectedEmoji === item.emoji && 'bg-primary/20 ring-primary/40 ring-1'
                    )}
                  >
                    {item.emoji}
                  </button>
                ))}
                {filteredEmojis.length === 0 && (
                  <div className="text-muted-foreground col-span-6 py-6 text-center text-xs">
                    No icon found for &ldquo;{search}&rdquo;. Try clicking &quot;All Emojis&quot; above.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
