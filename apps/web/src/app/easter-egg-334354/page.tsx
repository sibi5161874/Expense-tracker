'use client';

import { useRef, useState, type DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface KanbanCard {
  id: string;
  title: string;
}

interface KanbanColumnData {
  id: string;
  title: string;
  cards: KanbanCard[];
}

const INITIAL_KANBAN: KanbanColumnData[] = [
  {
    id: 'todo',
    title: 'To Do',
    cards: [
      { id: 'c1', title: 'Design mockups' },
      { id: 'c2', title: 'Write tests' },
    ],
  },
  { id: 'inprogress', title: 'In Progress', cards: [{ id: 'c3', title: 'Fix bug #123' }] },
  { id: 'done', title: 'Done', cards: [{ id: 'c4', title: 'Deploy to prod' }] },
];

function KanbanBoard() {
  const [columns, setColumns] = useState(INITIAL_KANBAN);
  const dragRef = useRef<{ cardId: string; fromColumnId: string } | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  function moveCard(cardId: string, fromColumnId: string, toColumnId: string, toIndex: number) {
    setColumns((prev) => {
      const next = prev.map((col) => ({ ...col, cards: [...col.cards] }));
      const fromCol = next.find((c) => c.id === fromColumnId);
      const toCol = next.find((c) => c.id === toColumnId);
      if (!fromCol || !toCol) return prev;

      const cardIndex = fromCol.cards.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) return prev;
      const [card] = fromCol.cards.splice(cardIndex, 1);

      // Dropping back into its own column after removal shifts every later index down by
      // one, so the insert position has to account for that or the card lands one slot late.
      let insertIndex = toIndex;
      if (fromCol === toCol && cardIndex < insertIndex) insertIndex -= 1;
      toCol.cards.splice(insertIndex, 0, card);

      return next;
    });
  }

  function handleDropOnCard(e: DragEvent, columnId: string, targetIndex: number) {
    e.preventDefault();
    e.stopPropagation(); // Don't also let this bubble to the column's own onDrop below.
    const dragged = dragRef.current;
    dragRef.current = null;
    setDragOverCardId(null);
    setDragOverColumnId(null);
    if (!dragged) return;
    moveCard(dragged.cardId, dragged.fromColumnId, columnId, targetIndex);
  }

  function handleDropOnColumn(e: DragEvent, columnId: string) {
    e.preventDefault();
    const dragged = dragRef.current;
    dragRef.current = null;
    setDragOverColumnId(null);
    if (!dragged) return;
    const column = columns.find((c) => c.id === columnId);
    moveCard(dragged.cardId, dragged.fromColumnId, columnId, column?.cards.length ?? 0);
  }

  return (
    <div className="mt-10 text-left">
      <h2 className="text-lg font-semibold">Kanban Board</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Drag a card to another column, or drop it between cards to reorder.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {columns.map((column) => (
          <div
            key={column.id}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverColumnId(column.id);
            }}
            onDragLeave={() => setDragOverColumnId((prev) => (prev === column.id ? null : prev))}
            onDrop={(e) => handleDropOnColumn(e, column.id)}
            className={cn(
              'bg-card border-border/60 min-h-[160px] rounded-2xl border p-3 transition-colors',
              dragOverColumnId === column.id && 'border-primary bg-primary/5'
            )}
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold">{column.title}</h3>
              <span className="text-muted-foreground text-xs">{column.cards.length}</span>
            </div>

            <div className="mt-2 space-y-2">
              {column.cards.map((card, index) => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={(e) => {
                    dragRef.current = { cardId: card.id, fromColumnId: column.id };
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnd={() => {
                    dragRef.current = null;
                    setDragOverCardId(null);
                    setDragOverColumnId(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverCardId(card.id);
                  }}
                  onDrop={(e) => handleDropOnCard(e, column.id, index)}
                  className={cn(
                    'bg-background cursor-grab rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors active:cursor-grabbing',
                    dragOverCardId === card.id ? 'border-primary' : 'border-border/60'
                  )}
                >
                  {card.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Reached only via the hidden click sequence in Settings > Data & Privacy (see DataTab.tsx).
// Deliberately outside the (app) route group — no sidebar/navbar chrome, just this.
// Modeled on testautomationpractice.blogspot.com's "Alerts & Popups" section: real browser-
// native alert()/confirm()/prompt() dialogs, not custom modal components, so this is exactly
// what that site demonstrates but styled to match this app's buttons.
export default function EasterEggPage() {
  const router = useRouter();

  function handleBackgroundClick() {
    router.push('/dashboard');
  }

  return (
    <div className="bg-background min-h-screen" onClick={handleBackgroundClick}>
      <div className="mx-auto max-w-3xl px-4 py-16" onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Alerts &amp; Popups</h1>
          <p className="text-muted-foreground mt-1 text-sm">Click anywhere outside to go back.</p>

          <div className="mt-6 flex flex-col gap-3">
            <Button type="button" variant="outline" onClick={() => window.alert('This is a simple alert.')}>
              Simple Alert
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.confirm('Are you sure you want to confirm this?')}
            >
              Confirmation Alert
            </Button>
            <Button type="button" variant="outline" onClick={() => window.prompt('Please enter your name:')}>
              Prompt Alert
            </Button>
          </div>
        </div>

        <KanbanBoard />
      </div>
    </div>
  );
}
