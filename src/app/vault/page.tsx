'use client';

import { useState, useEffect, useCallback } from 'react';
import { VaultEntry, VAULT_CATEGORIES } from '@/types';
import { loadVault, saveVault, loadTheme, saveTheme } from '@/lib/storage';
import { formatRelativeTime } from '@/lib/utils';
import { exportBoardAsJSON } from '@/lib/utils';
import { Shield, Plus, Search, Eye, EyeOff, Copy, Trash2, Edit3, Save, X, Tag, ExternalLink, Moon, Sun } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { v4 as uuidv4 } from 'uuid';

export default function VaultPage() {
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [darkMode, setDarkMode] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New entry form
  const [newEntry, setNewEntry] = useState<Partial<VaultEntry>>({
    category: 'api-key',
    name: '',
    value: '',
    description: '',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    async function init() {
      const v = await loadVault();
      setEntries(v);
      const theme = loadTheme();
      setDarkMode(theme === 'dark');
      if (theme === 'dark') document.documentElement.classList.add('dark');
    }
    init();
  }, []);

  const toggleDark = useCallback(() => {
    const next = !darkMode;
    setDarkMode(next);
    saveTheme(next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  }, [darkMode]);

  function update(updated: VaultEntry[]) {
    setEntries(updated);
    saveVault(updated).catch(console.error);
  }

  function addEntry() {
    if (!newEntry.name || !newEntry.value) return;
    const entry: VaultEntry = {
      id: uuidv4(),
      category: newEntry.category as VaultEntry['category'],
      name: newEntry.name!,
      value: newEntry.value!,
      description: newEntry.description || '',
      tags: newEntry.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hidden: newEntry.category === 'api-key' || newEntry.category === 'credential' || newEntry.category === 'server',
    };
    update([entry, ...entries]);
    setNewEntry({ category: 'api-key', name: '', value: '', description: '', tags: [] });
    setTagInput('');
    setShowAdd(false);
  }

  function deleteEntry(id: string) {
    if (confirm('Delete this vault entry?')) {
      update(entries.filter(e => e.id !== id));
    }
  }

  function toggleReveal(id: string) {
    const next = new Set(revealedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setRevealedIds(next);
  }

  function copyValue(id: string, value: string) {
    navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function addTag() {
    if (!tagInput.trim()) return;
    setNewEntry({ ...newEntry, tags: [...(newEntry.tags || []), tagInput.trim()] });
    setTagInput('');
  }

  const filtered = entries.filter(e => {
    if (categoryFilter && e.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.tags.some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  const groupedByCategory = Object.entries(VAULT_CATEGORIES).map(([key, config]) => ({
    key,
    ...config,
    entries: filtered.filter(e => e.category === key),
  })).filter(g => g.entries.length > 0);

  return (
    <div className={`min-h-screen bg-canvas dark:bg-dark text-ink dark:text-canvas`}>
      <Sidebar
        darkMode={darkMode}
        onToggleDark={toggleDark}
        onExport={() => exportBoardAsJSON({ vault: entries })}
        onSearch={() => setShowSearch(true)}
      />

      <main className="ml-56 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-ink dark:bg-canvas flex items-center justify-center">
              <Shield size={20} className="text-canvas dark:text-ink" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold">Vault</h1>
              <p className="text-xs text-muted">API keys, credentials, links & important info</p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-4 py-2 bg-ink text-canvas dark:bg-canvas dark:text-ink rounded-card text-sm font-medium hover:opacity-80 transition-opacity"
          >
            <Plus size={16} /> Add Entry
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search vault..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-dark-card border border-ink/10 dark:border-dark-border rounded-card focus:outline-none focus:border-brass"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="text-sm bg-white dark:bg-dark-card border border-ink/10 dark:border-dark-border rounded-card px-3 py-2 focus:outline-none focus:border-brass"
          >
            <option value="">All Categories</option>
            {Object.entries(VAULT_CATEGORIES).map(([key, config]) => (
              <option key={key} value={key}>{config.icon} {config.label}</option>
            ))}
          </select>
        </div>

        {/* Add Entry Form */}
        {showAdd && (
          <div className="mb-6 p-4 bg-white dark:bg-dark-card border border-ink/10 dark:border-dark-border rounded-card space-y-3 animate-fade-in">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Plus size={14} className="text-brass" /> New Vault Entry
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-[0.2em] text-brass font-semibold">Category</label>
                <select
                  value={newEntry.category}
                  onChange={e => setNewEntry({ ...newEntry, category: e.target.value as VaultEntry['category'] })}
                  className="w-full text-sm bg-ink/5 dark:bg-dark border border-ink/10 dark:border-dark-border rounded-card px-3 py-1.5 focus:outline-none focus:border-brass"
                >
                  {Object.entries(VAULT_CATEGORIES).map(([key, config]) => (
                    <option key={key} value={key}>{config.icon} {config.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-[0.2em] text-brass font-semibold">Name</label>
                <input
                  value={newEntry.name}
                  onChange={e => setNewEntry({ ...newEntry, name: e.target.value })}
                  placeholder="e.g. OpenAI API Key"
                  className="w-full text-sm bg-ink/5 dark:bg-dark border border-ink/10 dark:border-dark-border rounded-card px-3 py-1.5 focus:outline-none focus:border-brass"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.2em] text-brass font-semibold">Value / Key / URL</label>
              <input
                value={newEntry.value}
                onChange={e => setNewEntry({ ...newEntry, value: e.target.value })}
                placeholder="sk-xxxx or https://..."
                className="w-full text-sm bg-ink/5 dark:bg-dark border border-ink/10 dark:border-dark-border rounded-card px-3 py-1.5 focus:outline-none focus:border-brass font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.2em] text-brass font-semibold">Description</label>
              <input
                value={newEntry.description}
                onChange={e => setNewEntry({ ...newEntry, description: e.target.value })}
                placeholder="What is this used for?"
                className="w-full text-sm bg-ink/5 dark:bg-dark border border-ink/10 dark:border-dark-border rounded-card px-3 py-1.5 focus:outline-none focus:border-brass"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.2em] text-brass font-semibold">Tags</label>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add tag..."
                  className="flex-1 text-sm bg-ink/5 dark:bg-dark border border-ink/10 dark:border-dark-border rounded-card px-3 py-1.5 focus:outline-none focus:border-brass"
                />
                <button onClick={addTag} className="text-xs text-brass">+ Add</button>
              </div>
              {(newEntry.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {(newEntry.tags || []).map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-brass/10 text-brass text-[10px] rounded-full flex items-center gap-1">
                      {tag}
                      <button onClick={() => setNewEntry({ ...newEntry, tags: newEntry.tags?.filter((_, j) => j !== i) })}>
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={addEntry}
                className="px-4 py-1.5 bg-ink text-canvas dark:bg-canvas dark:text-ink rounded-card text-sm font-medium hover:opacity-80 transition-opacity"
              >
                Save Entry
              </button>
              <button onClick={() => setShowAdd(false)} className="text-sm text-muted">Cancel</button>
            </div>
          </div>
        )}

        {/* Vault entries */}
        {groupedByCategory.length === 0 ? (
          <div className="py-16 text-center">
            <Shield size={40} className="text-faint mx-auto mb-3" />
            <p className="text-sm text-muted">No entries found</p>
            <p className="text-xs text-faint mt-1">Add your first vault entry above</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByCategory.map(group => (
              <div key={group.key}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-brass mb-3 flex items-center gap-2">
                  <span className="text-base">{group.icon}</span> {group.label}
                  <span className="text-faint">({group.entries.length})</span>
                </h3>
                <div className="space-y-2">
                  {group.entries.map(entry => (
                    <div
                      key={entry.id}
                      className="p-4 bg-white dark:bg-dark-card border border-ink/10 dark:border-dark-border rounded-card hover:border-brass/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold">{entry.name}</h4>
                            {entry.tags.map(tag => (
                              <span key={tag} className="px-1.5 py-0.5 bg-brass/10 text-brass text-[9px] rounded-full font-medium">
                                {tag}
                              </span>
                            ))}
                          </div>
                          {entry.description && <p className="text-xs text-muted mb-2">{entry.description}</p>}
                          <div className="flex items-center gap-2">
                            <code className={`text-xs bg-ink/5 dark:bg-dark px-2 py-1 rounded font-mono flex-1 ${entry.hidden && !revealedIds.has(entry.id) ? 'blur-sm select-none' : ''}`}>
                              {entry.hidden && !revealedIds.has(entry.id)
                                ? '••••••••••••••••••'
                                : entry.value
                              }
                            </code>
                          </div>
                          <p className="text-[10px] text-faint mt-2">Updated {formatRelativeTime(entry.updatedAt)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {entry.hidden && (
                            <button
                              onClick={() => toggleReveal(entry.id)}
                              className="p-1.5 rounded hover:bg-ink/5 dark:hover:bg-dark-border text-muted hover:text-ink dark:hover:text-canvas transition-colors"
                              title={revealedIds.has(entry.id) ? 'Hide' : 'Reveal'}
                            >
                              {revealedIds.has(entry.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          )}
                          <button
                            onClick={() => copyValue(entry.id, entry.value)}
                            className={`p-1.5 rounded hover:bg-ink/5 dark:hover:bg-dark-border transition-colors ${copiedId === entry.id ? 'text-green-500' : 'text-muted hover:text-ink dark:hover:text-canvas'}`}
                            title="Copy"
                          >
                            <Copy size={14} />
                          </button>
                          {entry.category === 'link' && (
                            <a
                              href={entry.value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded hover:bg-ink/5 dark:hover:bg-dark-border text-muted hover:text-ink dark:hover:text-canvas transition-colors"
                              title="Open Link"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-muted hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
