'use client';

import { Card, Column, TeamMember, PRIORITY_CONFIG } from '@/types';
import { cn } from '@/lib/utils';
import { Target, ChevronDown, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import IconMap from './IconMap';

interface NextActionsProps {
  columns: Column[];
  members: TeamMember[];
  onSetNextAction: (memberId: string, cardId: string | null) => void;
  onCardClick: (card: Card, columnId: string) => void;
}

const PRIORITY_WEIGHT: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

// Done columns are typically the last column or named "Done"
function isDoneColumn(col: Column): boolean {
  return col.title.toLowerCase().includes('done');
}

function calculateNextAction(
  memberId: string,
  columns: Column[],
): { card: Card; columnId: string } | null {
  const candidates: { card: Card; columnId: string; score: number }[] = [];

  for (const col of columns) {
    if (isDoneColumn(col)) continue;
    for (const card of col.cards) {
      if (card.archived || card.assignee !== memberId) continue;
      const priorityScore = PRIORITY_WEIGHT[card.priority] || 1;
      // Lower hours = higher urgency. No hours = treat as medium (4h)
      const hours = card.estimatedHours || 4;
      // Score: higher priority and lower hours = higher score
      const score = priorityScore * 10 + (1 / hours);
      candidates.push({ card, columnId: col.id, score });
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  return { card: candidates[0].card, columnId: candidates[0].columnId };
}

export default function NextActions({ columns, members, onSetNextAction, onCardClick }: NextActionsProps) {
  const [selectingFor, setSelectingFor] = useState<string | null>(null);

  const activeMembers = members.filter(m => m.id !== 'm2'); // exclude "Unassigned"
  const allCards = columns.flatMap(col =>
    col.cards.filter(c => !c.archived).map(c => ({ card: c, columnId: col.id }))
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Target size={14} className="text-accent" />
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">Next Actions</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {activeMembers.map(member => {
          // Manual override or auto-calculated
          const manualCard = member.nextActionCardId
            ? allCards.find(c => c.card.id === member.nextActionCardId)
            : null;
          const auto = calculateNextAction(member.id, columns);
          const next = manualCard || auto;
          const isManual = !!manualCard;

          return (
            <div
              key={member.id}
              className="flex-shrink-0 w-64 rounded-lg border border-border bg-card p-3 space-y-2"
            >
              {/* Member header */}
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: member.color }}
                >
                  {member.initials}
                </div>
                <span className="text-sm font-medium truncate">{member.name}</span>
                {isManual && (
                  <Badge variant="outline" className="text-[9px] ml-auto">pinned</Badge>
                )}
              </div>

              {next ? (
                <div
                  className="cursor-pointer group"
                  onClick={() => onCardClick(next.card, next.columnId)}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Badge
                      variant="secondary"
                      className="h-auto px-1 py-0 text-[9px] font-medium gap-0.5"
                      style={{ color: PRIORITY_CONFIG[next.card.priority].color }}
                    >
                      <IconMap name={PRIORITY_CONFIG[next.card.priority].icon} size={9} />
                      {PRIORITY_CONFIG[next.card.priority].label}
                    </Badge>
                    {next.card.estimatedHours && (
                      <span className="text-[9px] text-muted-foreground">{next.card.estimatedHours}h</span>
                    )}
                    <span className="text-[9px] text-muted-foreground ml-auto">
                      {columns.find(c => c.id === next.columnId)?.title}
                    </span>
                  </div>
                  <p className="text-xs font-medium group-hover:text-accent transition-colors line-clamp-2">
                    {next.card.title}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No tasks assigned</p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1">
                {selectingFor === member.id ? (
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">Pick a card:</span>
                      <Button variant="ghost" size="icon-xs" onClick={() => setSelectingFor(null)}>
                        <X size={12} />
                      </Button>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-0.5">
                      {allCards
                        .filter(c => c.card.assignee === member.id && !isDoneColumn(columns.find(col => col.id === c.columnId)!))
                        .map(({ card, columnId }) => (
                          <button
                            key={card.id}
                            onClick={() => {
                              onSetNextAction(member.id, card.id);
                              setSelectingFor(null);
                            }}
                            className={cn(
                              'w-full text-left text-[11px] px-2 py-1 rounded hover:bg-muted transition-colors truncate',
                              card.id === member.nextActionCardId && 'bg-accent/10 text-accent'
                            )}
                          >
                            {card.title}
                          </button>
                        ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-[10px] text-muted-foreground"
                      onClick={() => setSelectingFor(member.id)}
                    >
                      <ChevronDown size={10} /> Change
                    </Button>
                    {isManual && (
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-[10px] text-muted-foreground"
                        onClick={() => onSetNextAction(member.id, null)}
                      >
                        Auto
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
