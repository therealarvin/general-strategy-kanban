'use client';

import { Card, PRIORITY_CONFIG, TeamMember } from '@/types';
import { isOverdue, isDueSoon, formatDate, getChecklistProgress } from '@/lib/utils';
import { Calendar, CheckSquare, MessageSquare, Clock, Paperclip } from 'lucide-react';
import { Draggable } from '@hello-pangea/dnd';
import IconMap from './IconMap';

interface KanbanCardProps {
  card: Card;
  index: number;
  members: TeamMember[];
  onClick: () => void;
}

export default function KanbanCard({ card, index, members, onClick }: KanbanCardProps) {
  const priority = PRIORITY_CONFIG[card.priority];
  const overdue = isOverdue(card.dueDate);
  const dueSoon = isDueSoon(card.dueDate);
  const checkProgress = getChecklistProgress(card);
  const assignee = members.find(m => m.id === card.assignee);

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`
            group p-3 rounded-card border cursor-pointer
            transition-all duration-200
            ${snapshot.isDragging
              ? 'shadow-lg scale-[1.02] border-brass bg-canvas dark:bg-dark-card'
              : 'border-ink/10 dark:border-dark-border bg-white dark:bg-dark-card hover:border-brass/50 hover:shadow-sm'
            }
            ${card.archived ? 'opacity-50' : ''}
          `}
        >
          {/* Priority indicator */}
          <div className="flex items-center gap-1.5 mb-2">
            <span
              className={`text-xs font-medium ${card.priority === 'urgent' ? 'pulse-urgent' : ''}`}
              style={{ color: priority.color }}
            >
              <IconMap name={priority.icon} size={12} /> {priority.label}
            </span>
            {card.estimatedHours && (
              <span className="text-[10px] text-faint flex items-center gap-0.5 ml-auto">
                <Clock size={10} /> {card.estimatedHours}h
              </span>
            )}
          </div>

          {/* Labels */}
          {card.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {card.labels.map(label => (
                <span
                  key={label.id}
                  className="h-1.5 w-8 rounded-full"
                  style={{ background: label.color }}
                  title={label.name}
                />
              ))}
            </div>
          )}

          {/* Title */}
          <h3 className="text-sm font-medium leading-snug mb-1.5">{card.title}</h3>

          {/* Description preview */}
          {card.description && (
            <p className="text-xs text-muted line-clamp-2 mb-2">{card.description}</p>
          )}

          {/* Footer meta */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Due date */}
            {card.dueDate && (
              <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                overdue ? 'bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                : dueSoon ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400'
                : 'bg-ink/5 text-muted dark:bg-dark-border'
              }`}>
                <Calendar size={10} />
                {formatDate(card.dueDate)}
              </span>
            )}

            {/* Checklist */}
            {card.checklist.length > 0 && (
              <span className={`flex items-center gap-1 text-[10px] font-medium ${
                checkProgress.percent === 100 ? 'text-green-600' : 'text-muted'
              }`}>
                <CheckSquare size={10} />
                {checkProgress.done}/{checkProgress.total}
              </span>
            )}

            {/* Comments */}
            {card.comments.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-muted">
                <MessageSquare size={10} />
                {card.comments.length}
              </span>
            )}

            {/* Attachments */}
            {card.attachments.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-muted">
                <Paperclip size={10} />
                {card.attachments.length}
              </span>
            )}

            {/* Assignee avatar */}
            {assignee && assignee.id !== 'm2' && (
              <div
                className="ml-auto w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: assignee.color }}
                title={assignee.name}
              >
                <span className="text-[8px] text-white font-bold">{assignee.initials}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
