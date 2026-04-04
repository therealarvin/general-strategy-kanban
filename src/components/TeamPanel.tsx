'use client';

import { useState } from 'react';
import { TeamMember, Column } from '@/types';
import { Users, Plus, X, Edit3, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

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
    if (id === 'm1') return; // Can't remove Arvin
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
        <button
          onClick={() => setAdding(!adding)}
          className="flex items-center gap-1 text-xs font-medium text-brass hover:text-ink dark:hover:text-canvas transition-colors"
        >
          <Plus size={14} /> Add Member
        </button>
      </div>

      {adding && (
        <div className="flex gap-2 animate-fade-in">
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addMember()}
            placeholder="Name..."
            className="flex-1 text-sm bg-ink/5 dark:bg-dark-card border border-ink/10 dark:border-dark-border rounded-card px-3 py-1.5 focus:outline-none focus:border-brass"
          />
          <button onClick={addMember} className="px-3 py-1.5 bg-ink text-canvas dark:bg-canvas dark:text-ink rounded-card text-xs font-medium">Add</button>
          <button onClick={() => setAdding(false)} className="text-xs text-muted">Cancel</button>
        </div>
      )}

      <div className="space-y-2">
        {members.map(member => {
          const cardCount = allCards.filter(c => c.assignee === member.id).length;
          return (
            <div
              key={member.id}
              className="flex items-center gap-3 p-3 rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-card"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: member.color }}
              >
                <span className="text-sm text-white font-bold">{member.initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                {editingId === member.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveName(member.id)}
                      className="text-sm bg-transparent border-b border-brass focus:outline-none"
                    />
                    <button onClick={() => saveName(member.id)} className="text-brass"><Save size={14} /></button>
                  </div>
                ) : (
                  <p className="text-sm font-medium">{member.name}</p>
                )}
                <p className="text-xs text-muted">{cardCount} card{cardCount !== 1 ? 's' : ''} assigned</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setEditingId(member.id); setEditName(member.name); }}
                  className="p-1 text-faint hover:text-ink dark:hover:text-canvas transition-colors"
                >
                  <Edit3 size={14} />
                </button>
                {member.id !== 'm1' && member.id !== 'm2' && (
                  <button
                    onClick={() => removeMember(member.id)}
                    className="p-1 text-faint hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
