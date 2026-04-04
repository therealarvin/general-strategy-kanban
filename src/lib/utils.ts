import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Card, Column } from '@/types';
import { formatDistanceToNow, format, isAfter, isBefore, addDays } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy');
}

export function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
}

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return isBefore(new Date(dueDate), new Date());
}

export function isDueSoon(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const now = new Date();
  return isAfter(due, now) && isBefore(due, addDays(now, 3));
}

export function getChecklistProgress(card: Card): { done: number; total: number; percent: number } {
  const total = card.checklist.length;
  const done = card.checklist.filter(item => item.completed).length;
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export function getBoardStats(columns: Column[]) {
  const allCards = columns.flatMap(col => col.cards.filter(c => !c.archived));
  const totalCards = allCards.length;
  const byPriority = {
    urgent: allCards.filter(c => c.priority === 'urgent').length,
    high: allCards.filter(c => c.priority === 'high').length,
    medium: allCards.filter(c => c.priority === 'medium').length,
    low: allCards.filter(c => c.priority === 'low').length,
  };
  const overdue = allCards.filter(c => isOverdue(c.dueDate)).length;
  const dueSoon = allCards.filter(c => isDueSoon(c.dueDate)).length;
  const byColumn = columns.map(col => ({
    name: col.title,
    count: col.cards.filter(c => !c.archived).length,
  }));
  const totalChecklist = allCards.reduce((sum, c) => sum + c.checklist.length, 0);
  const doneChecklist = allCards.reduce((sum, c) => sum + c.checklist.filter(i => i.completed).length, 0);

  return { totalCards, byPriority, overdue, dueSoon, byColumn, totalChecklist, doneChecklist };
}

export function filterCards(cards: Card[], filters: {
  search?: string;
  priority?: string;
  label?: string;
  assignee?: string;
  showArchived?: boolean;
}): Card[] {
  return cards.filter(card => {
    if (!filters.showArchived && card.archived) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!card.title.toLowerCase().includes(q) && !card.description.toLowerCase().includes(q)) return false;
    }
    if (filters.priority && card.priority !== filters.priority) return false;
    if (filters.label && !card.labels.some(l => l.id === filters.label)) return false;
    if (filters.assignee && card.assignee !== filters.assignee) return false;
    return true;
  });
}

export function exportBoardAsJSON(board: object): void {
  const blob = new Blob([JSON.stringify(board, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gs-kanban-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
