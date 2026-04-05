'use client';

import { useState, useEffect, useCallback } from 'react';
import { Reminder } from '@/types';
import { loadTheme, saveTheme } from '@/lib/storage';
import { formatRelativeTime, cn } from '@/lib/utils';
import { exportBoardAsJSON } from '@/lib/utils';
import { Bell, Plus, Check, Trash2, X, Users as UsersIcon, User } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/auth';
import AuthGuard from '@/components/AuthGuard';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';

function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function RemindersPage() {
  return (
    <AuthGuard>
      <RemindersContent />
    </AuthGuard>
  );
}

function RemindersContent() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [draft, setDraft] = useState({ title: '', description: '', dueDate: '', isGroup: false });

  useEffect(() => {
    if (!user) return;
    loadReminders();
    const theme = loadTheme();
    setDarkMode(theme === 'dark');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  }, [user]);

  const toggleDark = useCallback(() => {
    const next = !darkMode;
    setDarkMode(next);
    saveTheme(next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  }, [darkMode]);

  async function loadReminders() {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .order('due_date');
    if (error) console.error('Failed to load reminders:', error.message);
    setReminders((data || []).map(r => ({
      id: r.id,
      title: r.title,
      description: r.description || '',
      dueDate: r.due_date,
      completed: r.completed,
      relatedContactId: r.related_contact_id,
      relatedCardId: r.related_card_id,
      createdAt: r.created_at,
      isGroup: r.is_group,
      userId: r.user_id,
    })));
  }

  async function addReminder() {
    if (!draft.title || !draft.dueDate) return;
    const id = uuidv4();
    const { error } = await supabase.from('reminders').insert({
      id,
      title: draft.title,
      description: draft.description,
      due_date: draft.dueDate,
      user_id: user!.id,
      is_group: draft.isGroup,
    });
    if (error) { console.error(error.message); return; }
    setDraft({ title: '', description: '', dueDate: '', isGroup: false });
    setShowAdd(false);
    loadReminders();
  }

  async function toggleComplete(id: string, completed: boolean) {
    await supabase.from('reminders').update({ completed }).eq('id', id);
    setReminders(reminders.map(r => r.id === id ? { ...r, completed } : r));
  }

  async function deleteReminder(id: string) {
    await supabase.from('reminders').delete().eq('id', id);
    setReminders(reminders.filter(r => r.id !== id));
  }

  const now = new Date();
  const active = reminders.filter(r => !r.completed);
  const completed = reminders.filter(r => r.completed);

  const overdue = active.filter(r => parseDateLocal(r.dueDate) < now);
  const today = active.filter(r => {
    const d = parseDateLocal(r.dueDate);
    return d.toDateString() === now.toDateString();
  });
  const upcoming = active.filter(r => {
    const d = parseDateLocal(r.dueDate);
    return d > now && d.toDateString() !== now.toDateString();
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar
        darkMode={darkMode}
        onToggleDark={toggleDark}
        onExport={() => exportBoardAsJSON({ reminders })}
        onSearch={() => {}}
      />

      <main className="ml-56 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Bell size={20} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold">Reminders</h1>
              <p className="text-xs text-muted-foreground">{active.length} active, {overdue.length} overdue</p>
            </div>
          </div>
          <Button onClick={() => setShowAdd(!showAdd)}>
            <Plus size={16} /> Add Reminder
          </Button>
        </div>

        {/* Add Form */}
        {showAdd && (
          <Card className="mb-6 animate-fade-in">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Plus size={14} className="text-accent" /> New Reminder
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Title *</Label>
                  <Input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="Follow up with..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Due Date *</Label>
                  <Input type="date" value={draft.dueDate} onChange={e => setDraft({ ...draft, dueDate: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Description</Label>
                <Textarea value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} placeholder="Details..." rows={2} />
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <Checkbox
                  checked={draft.isGroup}
                  onCheckedChange={checked => setDraft({ ...draft, isGroup: checked === true })}
                />
                Group reminder (visible to everyone)
              </label>
              <div className="flex gap-2">
                <Button onClick={addReminder}>Save Reminder</Button>
                <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reminders */}
        {active.length === 0 && !showAdd ? (
          <div className="py-16 text-center">
            <Bell size={40} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No active reminders</p>
          </div>
        ) : (
          <div className="space-y-6">
            {overdue.length > 0 && (
              <ReminderGroup
                title="Overdue"
                color="#e74c3c"
                reminders={overdue}
                onToggle={toggleComplete}
                onDelete={deleteReminder}
              />
            )}
            {today.length > 0 && (
              <ReminderGroup
                title="Today"
                color="#e67e22"
                reminders={today}
                onToggle={toggleComplete}
                onDelete={deleteReminder}
              />
            )}
            {upcoming.length > 0 && (
              <ReminderGroup
                title="Upcoming"
                color="#3498db"
                reminders={upcoming}
                onToggle={toggleComplete}
                onDelete={deleteReminder}
              />
            )}
          </div>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <div className="mt-8">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showCompleted ? 'Hide' : 'Show'} {completed.length} completed
            </button>
            {showCompleted && (
              <div className="mt-3 space-y-1 opacity-60">
                {completed.map(r => (
                  <div key={r.id} className="flex items-center gap-3 px-3 py-2 text-sm line-through text-muted-foreground">
                    <Checkbox checked onCheckedChange={() => toggleComplete(r.id, false)} />
                    <span>{r.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function ReminderGroup({
  title, color, reminders, onToggle, onDelete,
}: {
  title: string;
  color: string;
  reminders: (Reminder & { isGroup?: boolean; userId?: string })[];
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span style={{ color }}>{title}</span>
        <span className="text-muted-foreground/50">({reminders.length})</span>
      </h3>
      <div className="space-y-2">
        {reminders.map(r => (
          <Card key={r.id} className="hover:border-accent/30 transition-colors">
            <CardContent className="py-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  className="mt-0.5"
                  checked={r.completed}
                  onCheckedChange={() => onToggle(r.id, !r.completed)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium">{r.title}</h4>
                    {r.isGroup && (
                      <Badge variant="outline" className="text-[9px]">
                        <UsersIcon size={9} className="mr-0.5" /> group
                      </Badge>
                    )}
                    {!r.isGroup && (
                      <Badge variant="outline" className="text-[9px] text-muted-foreground">
                        <User size={9} className="mr-0.5" /> personal
                      </Badge>
                    )}
                  </div>
                  {r.description && <p className="text-xs text-muted-foreground mt-1">{r.description}</p>}
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    Due {parseDateLocal(r.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {' - '}Created {formatRelativeTime(r.createdAt)}
                  </p>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(r.id)}>
                      <Trash2 size={13} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
