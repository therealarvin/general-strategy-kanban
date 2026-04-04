'use client';

import { Card, Column, TeamMember, PRIORITY_CONFIG } from '@/types';
import { cn } from '@/lib/utils';
import { Target, ChevronDown, ChevronRight, X, GitBranch } from 'lucide-react';
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

function isDoneColumn(col: Column): boolean {
  return col.title.toLowerCase().includes('done');
}

function isCardCompleted(cardId: string, columns: Column[]): boolean {
  for (const col of columns) {
    if (!isDoneColumn(col)) continue;
    if (col.cards.some(c => c.id === cardId)) return true;
  }
  return false;
}

function isBlocked(card: Card, columns: Column[]): boolean {
  if (!card.dependencies || card.dependencies.length === 0) return false;
  return card.dependencies.some(depId => !isCardCompleted(depId, columns));
}

function countDependents(cardId: string, allCards: Card[]): number {
  return allCards.filter(c => c.dependencies?.includes(cardId)).length;
}

function calculateNextAction(
  memberId: string,
  columns: Column[],
): { card: Card; columnId: string; blocked: boolean } | null {
  const allCards = columns.flatMap(col => col.cards);
  const candidates: { card: Card; columnId: string; score: number; blocked: boolean }[] = [];

  for (const col of columns) {
    if (isDoneColumn(col)) continue;
    for (const card of col.cards) {
      if (card.archived || card.assignee !== memberId) continue;

      const blocked = isBlocked(card, columns);
      if (blocked) continue; // Skip blocked cards entirely

      const priorityScore = PRIORITY_WEIGHT[card.priority] || 1;
      // Hours factor: quick tasks get a significant boost
      // 0.1h → 10/(0.6) = 16.7, 1h → 10/1.5 = 6.7, 25h → 10/25.5 = 0.4
      const hoursFactor = card.estimatedHours ? (10 / (card.estimatedHours + 0.5)) : 0;
      // Dependents factor: tasks that unblock others get a boost
      const dependents = countDependents(card.id, allCards);
      const dependentsFactor = dependents * 3;
      // Final score
      const score = priorityScore * 2 + hoursFactor + dependentsFactor;

      candidates.push({ card, columnId: col.id, score, blocked });
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
}

export default function NextActions({ columns, members, onSetNextAction, onCardClick }: NextActionsProps) {
  const [selectingFor, setSelectingFor] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const activeMembers = members.filter(m => m.id !== 'm2');
  const allCards = columns.flatMap(col =>
    col.cards.filter(c => !c.archived).map(c => ({ card: c, columnId: col.id }))
  );

  return (
    <div className="space-y-2">
      <button
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight size={14} className="text-accent" /> : <ChevronDown size={14} className="text-accent" />}
        <Target size={14} className="text-accent" />
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">Next Actions</span>
      </button>
      {!collapsed && (
      <div className="flex gap-3 overflow-x-auto pb-1">
        {activeMembers.map(member => {
          const manualCard = member.nextActionCardId
            ? allCards.find(c => c.card.id === member.nextActionCardId)
            : null;
          // Check if manual pick is blocked
          const manualBlocked = manualCard ? isBlocked(manualCard.card, columns) : false;
          const auto = calculateNextAction(member.id, columns);
          const next = (manualCard && !manualBlocked) ? { card: manualCard.card, columnId: manualCard.columnId, blocked: false } : auto;
          const isManual = !!(manualCard && !manualBlocked);
          const dependents = next ? countDependents(next.card.id, columns.flatMap(c => c.cards)) : 0;

          return (
            <div
              key={member.id}
              className="flex-shrink-0 w-64 rounded-lg border border-border bg-card p-3 space-y-2"
            >
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
                    {dependents > 0 && (
                      <span className="text-[9px] text-accent flex items-center gap-0.5" title={`${dependents} task${dependents > 1 ? 's' : ''} depend on this`}>
                        <GitBranch size={9} /> {dependents}
                      </span>
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
                        .map(({ card }) => {
                          const blocked = isBlocked(card, columns);
                          return (
                            <button
                              key={card.id}
                              onClick={() => {
                                onSetNextAction(member.id, card.id);
                                setSelectingFor(null);
                              }}
                              disabled={blocked}
                              className={cn(
                                'w-full text-left text-[11px] px-2 py-1 rounded truncate',
                                blocked ? 'opacity-40 cursor-not-allowed line-through' : 'hover:bg-muted transition-colors',
                                card.id === member.nextActionCardId && 'bg-accent/10 text-accent'
                              )}
                            >
                              {card.title}
                              {blocked && ' (blocked)'}
                            </button>
                          );
                        })}
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
      )}
    </div>
  );
}
