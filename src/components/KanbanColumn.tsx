'use client';

import { useState } from 'react';
import { Column, Card as CardType, TeamMember } from '@/types';
import { cn } from '@/lib/utils';
import KanbanCard from './KanbanCard';
import { Droppable } from '@hello-pangea/dnd';
import { Plus, MoreHorizontal, Trash2, Edit3 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface KanbanColumnProps {
  column: Column;
  members: TeamMember[];
  filteredCards: CardType[];
  onAddCard: (columnId: string, card: CardType) => void;
  onCardClick: (card: CardType, columnId: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onRenameColumn: (columnId: string, name: string) => void;
}

export default function KanbanColumn({
  column, members, filteredCards, onAddCard, onCardClick, onDeleteColumn, onRenameColumn
}: KanbanColumnProps) {
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);

  function handleAddCard() {
    if (!newCardTitle.trim()) return;
    const card: CardType = {
      id: uuidv4(),
      title: newCardTitle.trim(),
      description: '',
      labels: [],
      assignee: 'm2',
      dueDate: null,
      priority: 'medium',
      checklist: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archived: false,
      attachments: [],
    };
    onAddCard(column.id, card);
    setNewCardTitle('');
    setShowAddCard(false);
  }

  const count = filteredCards.length;

  return (
    <div className="flex-shrink-0 w-72 flex flex-col max-h-full">
      {/* Column header */}
      <div className="flex items-center justify-between px-2 pb-3">
        <div className="flex items-center gap-2">
          {editing ? (
            <Input
              autoFocus
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={() => { onRenameColumn(column.id, editTitle); setEditing(false); }}
              onKeyDown={e => e.key === 'Enter' && (onRenameColumn(column.id, editTitle), setEditing(false))}
              className="h-6 text-sm font-semibold bg-transparent border-b border-brass rounded-none px-0 focus-visible:ring-0 focus-visible:border-brass"
            />
          ) : (
            <h3
              className="text-xs font-semibold uppercase tracking-[0.15em] text-muted cursor-pointer hover:text-ink dark:hover:text-canvas transition-colors"
              onDoubleClick={() => setEditing(true)}
            >
              {column.title}
            </h3>
          )}
          <Badge
            variant="secondary"
            className="h-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-ink/10 dark:bg-dark-border text-muted"
          >
            {count}
          </Badge>
          {column.limit && count > column.limit && (
            <Badge
              variant="destructive"
              className="h-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            >
              Over limit
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setShowAddCard(!showAddCard)}
            className="text-muted hover:text-ink dark:hover:text-canvas hover:bg-ink/10 dark:hover:bg-dark-border"
          >
            <Plus size={16} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted hover:text-ink dark:hover:text-canvas hover:bg-ink/10 dark:hover:bg-dark-border"
                >
                  <MoreHorizontal size={16} />
                </Button>
              }
            />
            <DropdownMenuContent align="end" side="bottom" sideOffset={4}>
              <DropdownMenuItem
                onClick={() => setEditing(true)}
                className="text-xs gap-2"
              >
                <Edit3 size={12} /> Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => { if (confirm('Delete this column and all its cards?')) onDeleteColumn(column.id); }}
                className="text-xs gap-2"
              >
                <Trash2 size={12} /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Add card form */}
      {showAddCard && (
        <div className="px-1 pb-2 animate-fade-in">
          <Card className="gap-0 py-0 ring-ink/10 dark:ring-dark-border bg-white dark:bg-dark-card">
            <CardContent className="p-2 space-y-2">
              <Input
                autoFocus
                value={newCardTitle}
                onChange={e => setNewCardTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddCard();
                  if (e.key === 'Escape') { setShowAddCard(false); setNewCardTitle(''); }
                }}
                placeholder="Card title..."
                className="h-7 text-sm border-0 bg-transparent px-0 focus-visible:ring-0"
              />
              <div className="flex gap-1.5">
                <Button
                  size="xs"
                  onClick={handleAddCard}
                  className="bg-ink text-canvas dark:bg-canvas dark:text-ink hover:opacity-80"
                >
                  Add
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => { setShowAddCard(false); setNewCardTitle(''); }}
                  className="text-muted hover:text-ink dark:hover:text-canvas"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cards */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 overflow-y-auto kanban-column space-y-2 px-1 pb-2 rounded-card min-h-[60px] transition-colors duration-200',
              snapshot.isDraggingOver && 'bg-brass/10 dark:bg-brass/5'
            )}
          >
            {filteredCards.map((card, index) => (
              <KanbanCard
                key={card.id}
                card={card}
                index={index}
                members={members}
                onClick={() => onCardClick(card, column.id)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
