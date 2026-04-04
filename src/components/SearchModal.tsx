'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { Column, Card, PRIORITY_CONFIG } from '@/types';

interface SearchModalProps {
  columns: Column[];
  onSelectCard: (card: Card, columnId: string) => void;
  onClose: () => void;
}

export default function SearchModal({ columns, onSelectCard, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results: { card: Card; columnId: string; columnTitle: string }[] = [];
  if (query.trim()) {
    const q = query.toLowerCase();
    for (const col of columns) {
      for (const card of col.cards) {
        if (
          card.title.toLowerCase().includes(q) ||
          card.description.toLowerCase().includes(q) ||
          card.labels.some(l => l.name.toLowerCase().includes(q))
        ) {
          results.push({ card, columnId: col.id, columnTitle: col.title });
        }
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 modal-backdrop bg-ink/30 dark:bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-canvas dark:bg-dark-card rounded-card border border-ink/10 dark:border-dark-border shadow-2xl animate-scale-in overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-ink/10 dark:border-dark-border">
          <Search size={18} className="text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search cards, labels, descriptions..."
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
          <kbd className="text-[10px] text-faint bg-ink/5 dark:bg-dark-border px-1.5 py-0.5 rounded">ESC</kbd>
        </div>

        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto p-2">
            {results.map(({ card, columnId, columnTitle }) => (
              <button
                key={card.id}
                onClick={() => { onSelectCard(card, columnId); onClose(); }}
                className="w-full text-left p-3 rounded-card hover:bg-ink/5 dark:hover:bg-dark-border transition-colors flex items-start gap-3"
              >
                <span
                  className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: PRIORITY_CONFIG[card.priority].color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{card.title}</p>
                  <p className="text-xs text-muted truncate mt-0.5">{card.description || 'No description'}</p>
                </div>
                <span className="text-[10px] text-faint flex items-center gap-1 whitespace-nowrap">
                  {columnTitle} <ArrowRight size={10} />
                </span>
              </button>
            ))}
          </div>
        )}

        {query && results.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm text-muted">No cards found for &ldquo;{query}&rdquo;</p>
          </div>
        )}

        {!query && (
          <div className="p-6 text-center">
            <p className="text-xs text-faint">Start typing to search across all cards</p>
          </div>
        )}
      </div>
    </div>
  );
}
