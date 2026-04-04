'use client';

import { useState } from 'react';
import {
  Calendar, Tag, User, CheckSquare, MessageSquare,
  Plus, Trash2, Archive, Clock, Flag, X, GitBranch
} from 'lucide-react';
import { Card, Label, DEFAULT_LABELS, PRIORITY_CONFIG, TeamMember, Column } from '@/types';
import { cn, formatRelativeTime, getChecklistProgress } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label as FormLabel } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface CardModalProps {
  card: Card;
  members: TeamMember[];
  columns: Column[];
  onUpdate: (card: Card) => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function CardModal({ card, members, columns, onUpdate, onDelete, onClose }: CardModalProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [newComment, setNewComment] = useState('');
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showDepPicker, setShowDepPicker] = useState(false);

  const checkProgress = getChecklistProgress(card);

  function updateField(updates: Partial<Card>) {
    onUpdate({ ...card, ...updates, updatedAt: new Date().toISOString() });
  }

  function toggleLabel(label: Label) {
    const has = card.labels.some(l => l.id === label.id);
    const labels = has ? card.labels.filter(l => l.id !== label.id) : [...card.labels, label];
    updateField({ labels });
  }

  function addCheckItem() {
    if (!newCheckItem.trim()) return;
    const checklist = [...card.checklist, { id: uuidv4(), text: newCheckItem.trim(), completed: false }];
    updateField({ checklist });
    setNewCheckItem('');
  }

  function toggleCheckItem(id: string) {
    const checklist = card.checklist.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    updateField({ checklist });
  }

  function removeCheckItem(id: string) {
    updateField({ checklist: card.checklist.filter(i => i.id !== id) });
  }

  function addComment() {
    if (!newComment.trim()) return;
    const comments = [...card.comments, {
      id: uuidv4(),
      author: 'Arvin',
      text: newComment.trim(),
      createdAt: new Date().toISOString(),
    }];
    updateField({ comments });
    setNewComment('');
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-2xl max-h-[85vh] overflow-y-auto bg-background border-border rounded-card p-0"
      >
        {/* Priority bar */}
        <div className="h-2 rounded-t-card" style={{ background: PRIORITY_CONFIG[card.priority].color }} />

        <div className="p-6 space-y-6">
          {/* Header: Title + Close */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="sr-only">{card.title}</DialogTitle>
              <DialogDescription className="sr-only">Edit card details</DialogDescription>
              {editingTitle ? (
                <Input
                  autoFocus
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onBlur={() => { updateField({ title }); setEditingTitle(false); }}
                  onKeyDown={e => e.key === 'Enter' && (updateField({ title }), setEditingTitle(false))}
                  className={cn(
                    "text-xl font-serif font-semibold bg-transparent border-b-2 border-brass",
                    "rounded-none border-x-0 border-t-0 px-0 h-auto focus-visible:ring-0 focus-visible:border-accent"
                  )}
                />
              ) : (
                <h2
                  className="text-xl font-serif font-semibold cursor-pointer hover:text-brass transition-colors"
                  onClick={() => setEditingTitle(true)}
                >
                  {card.title}
                </h2>
              )}
              <p className="text-xs text-muted-foreground/60 mt-1">Created {formatRelativeTime(card.createdAt)}</p>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X size={18} className="text-muted-foreground" />
            </Button>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-3">
            {/* Priority */}
            <div className="space-y-1">
              <FormLabel className={cn(
                "text-[10px] uppercase tracking-[0.2em] text-brass font-semibold",
                "flex items-center gap-1"
              )}>
                <Flag size={10} /> Priority
              </FormLabel>
              <Select value={card.priority} onValueChange={(val) => updateField({ priority: val as Card['priority'] })}>
                <SelectTrigger size="sm" className="text-sm bg-muted border-border focus-visible:border-accent focus-visible:ring-accent/50">
                  <SelectValue>{PRIORITY_CONFIG[card.priority]?.label || card.priority}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assignee */}
            <div className="space-y-1">
              <FormLabel className={cn(
                "text-[10px] uppercase tracking-[0.2em] text-brass font-semibold",
                "flex items-center gap-1"
              )}>
                <User size={10} /> Assignee
              </FormLabel>
              <Select value={card.assignee} onValueChange={(val) => { if (val) updateField({ assignee: val }); }}>
                <SelectTrigger size="sm" className="text-sm bg-muted border-border focus-visible:border-accent focus-visible:ring-accent/50">
                  <SelectValue>{members.find(m => m.id === card.assignee)?.name || card.assignee}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {members.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-1">
              <FormLabel className={cn(
                "text-[10px] uppercase tracking-[0.2em] text-brass font-semibold",
                "flex items-center gap-1"
              )}>
                <Calendar size={10} /> Due Date
              </FormLabel>
              <Input
                type="date"
                value={card.dueDate ? card.dueDate.slice(0, 10) : ''}
                onChange={e => updateField({ dueDate: e.target.value || null })}
                className="text-sm bg-muted border-border focus-visible:border-accent focus-visible:ring-accent/50 h-7 w-auto"
              />
            </div>

            {/* Estimated Hours */}
            <div className="space-y-1">
              <FormLabel className={cn(
                "text-[10px] uppercase tracking-[0.2em] text-brass font-semibold",
                "flex items-center gap-1"
              )}>
                <Clock size={10} /> Est. Hours
              </FormLabel>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={card.estimatedHours || ''}
                onChange={e => updateField({ estimatedHours: parseFloat(e.target.value) || undefined })}
                className="text-sm bg-muted border-border focus-visible:border-accent focus-visible:ring-accent/50 h-7 w-20"
              />
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Labels */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FormLabel className={cn(
                "text-[10px] uppercase tracking-[0.2em] text-brass font-semibold",
                "flex items-center gap-1"
              )}>
                <Tag size={10} /> Labels
              </FormLabel>
              <Button
                variant="link"
                size="xs"
                onClick={() => setShowLabelPicker(!showLabelPicker)}
                className="text-xs text-brass hover:text-foreground"
              >
                {showLabelPicker ? 'Done' : '+ Add'}
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {card.labels.map(label => (
                <Badge
                  key={label.id}
                  className="text-[11px] text-white border-transparent"
                  style={{ background: label.color }}
                >
                  {label.name}
                </Badge>
              ))}
              {card.labels.length === 0 && <span className="text-xs text-muted-foreground/60">No labels</span>}
            </div>
            {showLabelPicker && (
              <div className="flex flex-wrap gap-1.5 p-3 bg-muted rounded-card animate-fade-in">
                {DEFAULT_LABELS.map(label => {
                  const active = card.labels.some(l => l.id === label.id);
                  return (
                    <button
                      key={label.id}
                      onClick={() => toggleLabel(label)}
                      className={cn(
                        "px-2.5 py-1 rounded text-xs font-medium transition-all text-white",
                        active ? 'ring-2 ring-offset-1 ring-border' : 'opacity-60 hover:opacity-100'
                      )}
                      style={{ background: label.color }}
                    >
                      {label.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <Separator className="bg-border" />

          {/* Dependencies */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FormLabel className={cn(
                "text-[10px] uppercase tracking-[0.2em] text-brass font-semibold",
                "flex items-center gap-1"
              )}>
                <GitBranch size={10} /> Dependencies
              </FormLabel>
              <Button
                variant="link"
                size="xs"
                onClick={() => setShowDepPicker(!showDepPicker)}
                className="text-xs text-brass hover:text-foreground"
              >
                {showDepPicker ? 'Done' : '+ Add'}
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(card.dependencies || []).map(depId => {
                const depCard = columns.flatMap(c => c.cards).find(c => c.id === depId);
                if (!depCard) return null;
                const isDone = columns.some(c => c.title.toLowerCase().includes('done') && c.cards.some(cc => cc.id === depId));
                return (
                  <Badge
                    key={depId}
                    variant="secondary"
                    className={cn('text-[11px] gap-1', isDone && 'line-through opacity-60')}
                  >
                    {depCard.title}
                    <button
                      onClick={() => updateField({ dependencies: card.dependencies.filter(d => d !== depId) })}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X size={10} />
                    </button>
                  </Badge>
                );
              })}
              {(!card.dependencies || card.dependencies.length === 0) && !showDepPicker && (
                <span className="text-xs text-muted-foreground/60">No dependencies</span>
              )}
            </div>
            {showDepPicker && (
              <div className="flex flex-wrap gap-1.5 p-3 bg-muted rounded-card animate-fade-in max-h-40 overflow-y-auto">
                {columns.flatMap(col => col.cards).filter(c => c.id !== card.id && !card.dependencies?.includes(c.id)).map(c => (
                  <button
                    key={c.id}
                    onClick={() => updateField({ dependencies: [...(card.dependencies || []), c.id] })}
                    className="px-2.5 py-1 rounded text-xs font-medium transition-all bg-card border border-border hover:border-accent/50"
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Separator className="bg-border" />

          {/* Description */}
          <div className="space-y-2">
            <FormLabel className="text-[10px] uppercase tracking-[0.2em] text-brass font-semibold">
              Description
            </FormLabel>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              onBlur={() => updateField({ description })}
              rows={3}
              placeholder="Add a description..."
              className="text-sm bg-muted border-border focus-visible:border-accent focus-visible:ring-accent/50 resize-none"
            />
          </div>

          <Separator className="bg-border" />

          {/* Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FormLabel className={cn(
                "text-[10px] uppercase tracking-[0.2em] text-brass font-semibold",
                "flex items-center gap-1"
              )}>
                <CheckSquare size={10} /> Checklist
                {card.checklist.length > 0 && (
                  <span className="text-muted-foreground/60 ml-1">({checkProgress.done}/{checkProgress.total})</span>
                )}
              </FormLabel>
            </div>
            {card.checklist.length > 0 && (
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-brass transition-all duration-300 rounded-full"
                  style={{ width: `${checkProgress.percent}%` }}
                />
              </div>
            )}
            <div className="space-y-1">
              {card.checklist.map(item => (
                <div key={item.id} className="flex items-center gap-2 group">
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => toggleCheckItem(item.id)}
                    className={cn(
                      "data-checked:bg-brass data-checked:border-brass",
                      "border-border"
                    )}
                  />
                  <span className={cn("text-sm flex-1", item.completed && "line-through text-muted-foreground/60")}>
                    {item.text}
                  </span>
                  <button
                    onClick={() => removeCheckItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground/60 hover:text-red-500 transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newCheckItem}
                onChange={e => setNewCheckItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCheckItem()}
                placeholder="Add item..."
                className="flex-1 text-sm bg-muted border-border focus-visible:border-accent focus-visible:ring-accent/50 h-7"
              />
              <Button
                onClick={addCheckItem}
                size="sm"
                className="bg-primary text-primary-foreground hover:opacity-80"
              >
                <Plus size={14} />
              </Button>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Comments */}
          <div className="space-y-2">
            <FormLabel className={cn(
              "text-[10px] uppercase tracking-[0.2em] text-brass font-semibold",
              "flex items-center gap-1"
            )}>
              <MessageSquare size={10} /> Comments ({card.comments.length})
            </FormLabel>
            <div className="space-y-2">
              {card.comments.map(comment => (
                <div key={comment.id} className="p-3 bg-muted rounded-card animate-fade-in">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-full bg-brass flex items-center justify-center">
                      <span className="text-[9px] text-white font-semibold">
                        {comment.author.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs font-medium">{comment.author}</span>
                    <span className="text-[10px] text-muted-foreground/60">{formatRelativeTime(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{comment.text}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addComment()}
                placeholder="Write a comment..."
                className="flex-1 text-sm bg-muted border-border focus-visible:border-accent focus-visible:ring-accent/50 h-7"
              />
              <Button
                onClick={addComment}
                size="sm"
                className="bg-primary text-primary-foreground hover:opacity-80"
              >
                Send
              </Button>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateField({ archived: !card.archived })}
              className="text-muted-foreground hover:text-foreground"
            >
              <Archive size={14} />
              {card.archived ? 'Restore' : 'Archive'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => { if (confirm('Delete this card permanently?')) onDelete(); }}
            >
              <Trash2 size={14} />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
