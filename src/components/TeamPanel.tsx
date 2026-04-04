'use client';

import { useState } from 'react';
import { TeamMember, Column } from '@/types';
import { Users, Plus, X, Edit3, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface TeamPanelProps {
  members: TeamMember[];
  columns: Column[];
  onUpdateMembers: (members: TeamMember[]) => void;
}

const MEMBER_COLORS = ['#b8a07a', '#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#e67e22', '#1abc9c', '#34495e'];

export default function TeamPanel({ members, columns, onUpdateMembers }: TeamPanelProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const allCards = columns.flatMap(c => c.cards.filter(card => !card.archived));

  function addMember() {
    if (!newName.trim()) return;
    const initials = newName.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const color = MEMBER_COLORS[members.length % MEMBER_COLORS.length];
    onUpdateMembers([...members, { id: uuidv4(), name: newName.trim(), initials, color }]);
    setNewName('');
    setAdding(false);
  }

  function removeMember(id: string) {
    if (id === 'm1') return;
    onUpdateMembers(members.filter(m => m.id !== id));
  }

  function saveName(id: string) {
    const initials = editName.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    onUpdateMembers(members.map(m => m.id === id ? { ...m, name: editName.trim(), initials } : m));
    setEditingId(null);
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-brass" />
          <h2 className="font-serif text-xl font-semibold">Team</h2>
        </div>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setAdding(!adding)}
          className="text-brass hover:text-foreground"
        >
          <Plus size={14} /> Add Member
        </Button>
      </div>

      {adding && (
        <div className="flex gap-2 animate-fade-in">
          <Input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addMember()}
            placeholder="Name..."
            className="flex-1 bg-muted border-border focus-visible:border-accent focus-visible:ring-accent/30"
          />
          <Button
            size="sm"
            onClick={addMember}
            className="bg-primary text-primary-foreground hover:bg-primary/80"
          >
            Add
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setAdding(false)} className="text-muted-foreground">
            Cancel
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {members.map(member => {
          const cardCount = allCards.filter(c => c.assignees?.includes(member.id)).length;
          return (
            <Card
              key={member.id}
              size="sm"
              className="flex-row items-center bg-card ring-border py-0"
            >
              <CardContent className="flex items-center gap-3 px-3 py-3 w-full">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: member.color }}
                >
                  <span className="text-sm text-white font-bold">{member.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  {editingId === member.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveName(member.id)}
                        className="h-7 bg-transparent border-0 border-b border-brass rounded-none px-0 focus-visible:ring-0 focus-visible:border-accent"
                      />
                      <Button variant="ghost" size="icon-xs" onClick={() => saveName(member.id)} className="text-brass">
                        <Save size={14} />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm font-medium">{member.name}</p>
                  )}
                  <Badge variant="secondary" className="mt-0.5 text-[10px] text-muted-foreground bg-muted h-4 px-1.5">
                    {cardCount} card{cardCount !== 1 ? 's' : ''} assigned
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => { setEditingId(member.id); setEditName(member.name); }}
                    className="text-muted-foreground/60 hover:text-foreground"
                  >
                    <Edit3 size={14} />
                  </Button>
                  {member.id !== 'm1' && member.id !== 'm2' && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeMember(member.id)}
                      className="text-muted-foreground/60 hover:text-red-500"
                    >
                      <X size={14} />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
