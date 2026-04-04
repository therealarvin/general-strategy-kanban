'use client';

import { useState } from 'react';
import {
  X, Calendar, Tag, User, AlertTriangle, CheckSquare, MessageSquare,
  Plus, Trash2, Archive, Clock, Flag
} from 'lucide-react';
import { Card, Label, DEFAULT_LABELS, PRIORITY_CONFIG, TeamMember } from '@/types';
import { formatDate, formatRelativeTime, getChecklistProgress } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

interface CardModalProps {
  card: Card;
  members: TeamMember[];
  onUpdate: (card: Card) => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function CardModal({ card, members, onUpdate, onDelete, onClose }: CardModalProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [newComment, setNewComment] = useState('');
  const [showLabelPicker, setShowLabelPicker] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 modal-backdrop bg-ink/40 dark:bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-canvas dark:bg-dark-card rounded-card border border-ink/10 dark:border-dark-border shadow-xl animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Cover / Priority bar */}
        <div className={`h-2 rounded-t-card`} style={{ background: PRIORITY_CONFIG[card.priority].color }} />

        <div className="p-6 space-y-6">
          {/* Title */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {editingTitle ? (
                <input
                  autoFocus
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onBlur={() => { updateField({ title }); setEditingTitle(false); }}
                  onKeyDown={e => e.key === 'Enter' && (updateField({ title }), setEditingTitle(false))}
                  className="w-full text-xl font-serif font-semibold bg-transparent border-b-2 border-brass focus:outline-none pb-1"
                />
              ) : (
                <h2
                  className="text-xl font-serif font-semibold cursor-pointer hover:text-brass transition-colors"
                  onClick={() => setEditingTitle(true)}
                >
                  {card.title}
                </h2>
              )}
              <p className="text-xs text-faint mt-1">Created {formatRelativeTime(card.createdAt)}</p>
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-ink/10 dark:hover:bg-dark-border transition-colors">
              <X size={20} className="text-muted" />
            </button>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-3">
            {/* Priority */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.2em] text-brass font-semibold flex items-center gap-1">
                <Flag size={10} /> Priority
              </label>
              <select
                value={card.priority}
                onChange={e => updateField({ priority: e.target.value as Card['priority'] })}
                className="text-sm bg-ink/5 dark:bg-dark rounded-card px-2 py-1 border border-ink/10 dark:border-dark-border focus:outline-none focus:border-brass"
              >
                {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.icon} {config.label}</option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.2em] text-brass font-semibold flex items-center gap-1">
                <User size={10} /> Assignee
              </label>
              <select
                value={card.assignee}
                onChange={e => updateField({ assignee: e.target.value })}
                className="text-sm bg-ink/5 dark:bg-dark rounded-card px-2 py-1 border border-ink/10 dark:border-dark-border focus:outline-none focus:border-brass"
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.2em] text-brass font-semibold flex items-center gap-1">
                <Calendar size={10} /> Due Date
              </label>
              <input
                type="date"
                value={card.dueDate || ''}
                onChange={e => updateField({ dueDate: e.target.value || null })}
                className="text-sm bg-ink/5 dark:bg-dark rounded-card px-2 py-1 border border-ink/10 dark:border-dark-border focus:outline-none focus:border-brass"
              />
            </div>

            {/* Estimated Hours */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.2em] text-brass font-semibold flex items-center gap-1">
                <Clock size={10} /> Est. Hours
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={card.estimatedHours || ''}
                onChange={e => updateField({ estimatedHours: parseFloat(e.target.value) || undefined })}
                className="text-sm bg-ink/5 dark:bg-dark rounded-card px-2 py-1 border border-ink/10 dark:border-dark-border focus:outline-none focus:border-brass w-20"
              />
            </div>
          </div>

          {/* Labels */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-[0.2em] text-brass font-semibold flex items-center gap-1">
                <Tag size={10} /> Labels
              </label>
              <button
                onClick={() => setShowLabelPicker(!showLabelPicker)}
                className="text-xs text-brass hover:text-ink dark:hover:text-canvas transition-colors"
              >
                {showLabelPicker ? 'Done' : '+ Add'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {card.labels.map(label => (
                <span
                  key={label.id}
                  className="px-2 py-0.5 rounded text-[11px] font-medium text-white"
                  style={{ background: label.color }}
                >
                  {label.name}
                </span>
              ))}
              {card.labels.length === 0 && <span className="text-xs text-faint">No labels</span>}
            </div>
            {showLabelPicker && (
              <div className="flex flex-wrap gap-1.5 p-3 bg-ink/5 dark:bg-dark rounded-card animate-fade-in">
                {DEFAULT_LABELS.map(label => {
                  const active = card.labels.some(l => l.id === label.id);
                  return (
                    <button
                      key={label.id}
                      onClick={() => toggleLabel(label)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                        active ? 'text-white ring-2 ring-offset-1 ring-ink/30' : 'text-white/80 opacity-60 hover:opacity-100'
                      }`}
                      style={{ background: label.color }}
                    >
                      {label.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-brass font-semibold">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              onBlur={() => updateField({ description })}
              rows={3}
              placeholder="Add a description..."
              className="w-full text-sm bg-ink/5 dark:bg-dark rounded-card px-3 py-2 border border-ink/10 dark:border-dark-border focus:outline-none focus:border-brass resize-none"
            />
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-[0.2em] text-brass font-semibold flex items-center gap-1">
                <CheckSquare size={10} /> Checklist
                {card.checklist.length > 0 && (
                  <span className="text-faint ml-1">({checkProgress.done}/{checkProgress.total})</span>
                )}
              </label>
            </div>
            {card.checklist.length > 0 && (
              <div className="w-full h-1.5 bg-ink/10 dark:bg-dark-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-brass transition-all duration-300 rounded-full"
                  style={{ width: `${checkProgress.percent}%` }}
                />
              </div>
            )}
            <div className="space-y-1">
              {card.checklist.map(item => (
                <div key={item.id} className="flex items-center gap-2 group">
                  <button
                    onClick={() => toggleCheckItem(item.id)}
                    className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                      item.completed
                        ? 'bg-brass border-brass text-white'
                        : 'border-ink/20 dark:border-dark-border hover:border-brass'
                    }`}
                  >
                    {item.completed && <span className="text-[10px]">✓</span>}
                  </button>
                  <span className={`text-sm flex-1 ${item.completed ? 'line-through text-faint' : ''}`}>
                    {item.text}
                  </span>
                  <button
                    onClick={() => removeCheckItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-faint hover:text-red-500 transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newCheckItem}
                onChange={e => setNewCheckItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCheckItem()}
                placeholder="Add item..."
                className="flex-1 text-sm bg-ink/5 dark:bg-dark rounded-card px-3 py-1.5 border border-ink/10 dark:border-dark-border focus:outline-none focus:border-brass"
              />
              <button
                onClick={addCheckItem}
                className="px-3 py-1.5 bg-ink text-canvas dark:bg-canvas dark:text-ink rounded-card text-xs font-medium hover:opacity-80 transition-opacity"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-brass font-semibold flex items-center gap-1">
              <MessageSquare size={10} /> Comments ({card.comments.length})
            </label>
            <div className="space-y-2">
              {card.comments.map(comment => (
                <div key={comment.id} className="p-3 bg-ink/5 dark:bg-dark rounded-card animate-fade-in">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-full bg-brass flex items-center justify-center">
                      <span className="text-[9px] text-white font-semibold">
                        {comment.author.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs font-medium">{comment.author}</span>
                    <span className="text-[10px] text-faint">{formatRelativeTime(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-muted">{comment.text}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addComment()}
                placeholder="Write a comment..."
                className="flex-1 text-sm bg-ink/5 dark:bg-dark rounded-card px-3 py-1.5 border border-ink/10 dark:border-dark-border focus:outline-none focus:border-brass"
              />
              <button
                onClick={addComment}
                className="px-3 py-1.5 bg-ink text-canvas dark:bg-canvas dark:text-ink rounded-card text-xs font-medium hover:opacity-80 transition-opacity"
              >
                Send
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-ink/10 dark:border-dark-border">
            <button
              onClick={() => updateField({ archived: !card.archived })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted hover:text-ink dark:hover:text-canvas rounded-card hover:bg-ink/5 dark:hover:bg-dark-border transition-colors"
            >
              <Archive size={14} />
              {card.archived ? 'Restore' : 'Archive'}
            </button>
            <button
              onClick={() => { if (confirm('Delete this card permanently?')) onDelete(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-600 rounded-card hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
