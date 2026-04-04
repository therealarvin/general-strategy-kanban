'use client';

import { Card as CardType, PRIORITY_CONFIG, TeamMember } from '@/types';
import { cn, isOverdue, isDueSoon, formatDate, getChecklistProgress } from '@/lib/utils';
import { Calendar, CheckSquare, MessageSquare, Clock, Paperclip } from 'lucide-react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import IconMap from './IconMap';

interface KanbanCardProps {
  card: CardType;
  index: number;
  members: TeamMember[];
  onClick: () => void;
}

export default function KanbanCard({ card, index, members, onClick }: KanbanCardProps) {
  const priority = PRIORITY_CONFIG[card.priority];
  const overdue = isOverdue(card.dueDate);
  const dueSoon = isDueSoon(card.dueDate);
  const checkProgress = getChecklistProgress(card);
  const assignees = (card.assignees || [])
    .filter(id => id !== 'm2')
    .map(id => members.find(m => m.id === id))
    .filter(Boolean) as TeamMember[];

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          size="sm"
          className={cn(
            'group cursor-pointer gap-0 py-0 transition-all duration-200',
            snapshot.isDragging
              ? 'shadow-lg scale-[1.02] ring-brass bg-background'
              : 'ring-border bg-card hover:ring-brass/50 hover:shadow-sm',
            card.archived && 'opacity-50'
          )}
        >
          <CardContent className="p-3">
            {/* Priority indicator */}
            <div className="flex items-center gap-1.5 mb-2">
              <Badge
                variant="ghost"
                className={cn(
                  'h-auto px-0 py-0 text-xs font-medium gap-1',
                  card.priority === 'urgent' && 'pulse-urgent'
                )}
                style={{ color: priority.color }}
              >
                <IconMap name={priority.icon} size={12} /> {priority.label}
              </Badge>
              {card.estimatedHours && (
                <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5 ml-auto">
                  <Clock size={10} /> {card.estimatedHours}h
                </span>
              )}
            </div>

            {/* Labels */}
            {card.labels.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {card.labels.map(label => (
                  <Badge
                    key={label.id}
                    className="h-1.5 w-8 rounded-full px-0 py-0 min-w-0"
                    style={{ background: label.color, borderColor: 'transparent' }}
                    title={label.name}
                  />
                ))}
              </div>
            )}

            {/* Title */}
            <h3 className="text-sm font-medium leading-snug mb-1.5">{card.title}</h3>

            {/* Description preview */}
            {card.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{card.description}</p>
            )}

            {/* Footer meta */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {/* Due date */}
              {card.dueDate && (
                <Badge
                  variant="secondary"
                  className={cn(
                    'h-auto px-1.5 py-0.5 text-[10px] font-medium gap-1',
                    overdue
                      ? 'bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                      : dueSoon
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Calendar size={10} />
                  {formatDate(card.dueDate)}
                </Badge>
              )}

              {/* Checklist */}
              {card.checklist.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    'flex items-center gap-1 text-[10px] font-medium',
                    checkProgress.percent === 100 ? 'text-green-600' : 'text-muted-foreground'
                  )}>
                    <CheckSquare size={10} />
                    {checkProgress.done}/{checkProgress.total}
                  </span>
                  <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        checkProgress.percent === 100 ? 'bg-green-500' : 'bg-accent'
                      )}
                      style={{ width: `${checkProgress.percent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Comments */}
              {card.comments.length > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <MessageSquare size={10} />
                  {card.comments.length}
                </span>
              )}

              {/* Attachments */}
              {card.attachments.length > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Paperclip size={10} />
                  {card.attachments.length}
                </span>
              )}

              {/* Assignee avatars */}
              {assignees.length > 0 && (
                <div className="ml-auto flex items-center flex-shrink-0">
                  {assignees.map((a, i) => (
                    <div
                      key={a.id}
                      className="w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-card"
                      style={{ background: a.color, marginLeft: i > 0 ? '-6px' : '0', zIndex: assignees.length - i }}
                      title={a.name}
                    >
                      <span className="text-[8px] text-white font-bold">{a.initials}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
}
