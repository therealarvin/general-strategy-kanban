'use client';

import { useState } from 'react';
import { Column, Card, TeamMember } from '@/types';
import KanbanCard from './KanbanCard';
import { Droppable } from '@hello-pangea/dnd';
import { Plus, MoreHorizontal, Trash2, Edit3 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface KanbanColumnProps {
  column: Column;
  members: TeamMember[];
  filteredCards: Card[];
  onAddCard: (columnId: string, card: Card) => void;
  onCardClick: (card: Card, columnId: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onRenameColumn: (columnId: string, name: string) => void;
}

export default function KanbanColumn({
  column, members, filteredCards, onAddCard, onCardClick, onDeleteColumn, onRenameColumn
}: KanbanColumnProps) {
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);

  function handleAddCard() {
    if (!newCardTitle.trim()) return;
    const card: Card = {
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
            <input
              autoFocus
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={() => { onRenameColumn(column.id, editTitle); setEditing(false); }}
              onKeyDown={e => e.key === 'Enter' && (onRenameColumn(column.id, editTitle), setEditing(false))}
              className="text-sm font-semibold bg-transparent border-b border-brass focus:outline-none"
            />
          ) : (
            <h3
              className="text-xs font-semibold uppercase tracking-[0.15em] text-muted cursor-pointer hover:text-ink dark:hover:text-canvas transition-colors"
              onDoubleClick={() => setEditing(true)}
            >
              {column.title}
            </h3>
          )}
          <span className="text-[10px] bg-ink/10 dark:bg-dark-border text-muted px-1.5 py-0.5 rounded-full font-medium">
            {count}
          </span>
          {column.limit && count > column.limit && (
            <span className="text-[10px] bg-red-100 dark:bg-red-950/30 text-red-500 px-1.5 py-0.5 rounded-full font-medium">
              Over limit
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 relative">
          <button
            onClick={() => setShowAddCard(!showAddCard)}
            className="p-1 rounded hover:bg-ink/10 dark:hover:bg-dark-border transition-colors text-muted hover:text-ink dark:hover:text-canvas"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded hover:bg-ink/10 dark:hover:bg-dark-border transition-colors text-muted hover:text-ink dark:hover:text-canvas"
          >
            <MoreHorizontal size={16} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 bg-canvas dark:bg-dark-card border border-ink/10 dark:border-dark-border rounded-card shadow-lg py-1 z-20 animate-scale-in min-w-[140px]">
              <button
                onClick={() => { setEditing(true); setShowMenu(false); }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-ink/5 dark:hover:bg-dark-border flex items-center gap-2"
              >
                <Edit3 size={12} /> Rename
              </button>
              <button
                onClick={() => { if (confirm('Delete this column and all its cards?')) onDeleteColumn(column.id); }}
                className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add card form */}
      {showAddCard && (
        <div className="px-1 pb-2 animate-fade-in">
          <div className="p-2 bg-white dark:bg-dark-card border border-ink/10 dark:border-dark-border rounded-card space-y-2">
            <input
              autoFocus
              value={newCardTitle}
              onChange={e => setNewCardTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddCard();
                if (e.key === 'Escape') { setShowAddCard(false); setNewCardTitle(''); }
              }}
              placeholder="Card title..."
              className="w-full text-sm bg-transparent focus:outline-none"
            />
            <div className="flex gap-1.5">
              <button
                onClick={handleAddCard}
                className="px-3 py-1 bg-ink text-canvas dark:bg-canvas dark:text-ink rounded text-xs font-medium hover:opacity-80 transition-opacity"
              >
                Add
              </button>
              <button
                onClick={() => { setShowAddCard(false); setNewCardTitle(''); }}
                className="px-3 py-1 text-xs text-muted hover:text-ink dark:hover:text-canvas transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cards */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 overflow-y-auto kanban-column space-y-2 px-1 pb-2 rounded-card min-h-[60px]
              transition-colors duration-200
              ${snapshot.isDraggingOver ? 'bg-brass/10 dark:bg-brass/5' : ''}
            `}
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
