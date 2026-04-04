'use client';

import { useState, useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { Column, Card, PRIORITY_CONFIG } from '@/types';
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
  CommandGroup,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface SearchModalProps {
  columns: Column[];
  onSelectCard: (card: Card, columnId: string) => void;
  onClose: () => void;
}

export default function SearchModal({ columns, onSelectCard, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const found: { card: Card; columnId: string; columnTitle: string }[] = [];
    for (const col of columns) {
      for (const card of col.cards) {
        if (
          card.title.toLowerCase().includes(q) ||
          card.description.toLowerCase().includes(q) ||
          card.labels.some(l => l.name.toLowerCase().includes(q))
        ) {
          found.push({ card, columnId: col.id, columnTitle: col.title });
        }
      }
    }
    return found;
  }, [query, columns]);

  return (
    <CommandDialog
      open={true}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title="Search Cards"
      description="Search across all cards, labels, and descriptions"
      className={cn(
        'max-w-lg bg-canvas dark:bg-dark-card',
        'border-ink/10 dark:border-dark-border',
        'shadow-2xl'
      )}
    >
      <Command
        shouldFilter={false}
        className="bg-canvas dark:bg-dark-card"
      >
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search cards, labels, descriptions..."
        />
        <CommandList className="max-h-80">
          {query && results.length === 0 && (
            <CommandEmpty className="text-muted">
              No cards found for &ldquo;{query}&rdquo;
            </CommandEmpty>
          )}

          {!query && (
            <div className="p-6 text-center">
              <p className="text-xs text-faint">Start typing to search across all cards</p>
            </div>
          )}

          {results.length > 0 && (
            <CommandGroup>
              {results.map(({ card, columnId, columnTitle }) => (
                <CommandItem
                  key={card.id}
                  value={card.id}
                  onSelect={() => { onSelectCard(card, columnId); onClose(); }}
                  className="flex items-start gap-3 p-3 rounded-card"
                >
                  <span
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ background: PRIORITY_CONFIG[card.priority].color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{card.title}</p>
                    <p className="text-xs text-muted truncate mt-0.5">
                      {card.description || 'No description'}
                    </p>
                  </div>
                  <span className="text-[10px] text-faint flex items-center gap-1 whitespace-nowrap ml-auto">
                    {columnTitle} <ArrowRight size={10} />
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
