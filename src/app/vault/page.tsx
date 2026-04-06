'use client';

import { useState, useEffect, useCallback } from 'react';
import { VaultEntry, VAULT_CATEGORIES } from '@/types';
import { loadVault, saveVault, loadTheme, saveTheme } from '@/lib/storage';
import { formatRelativeTime, exportBoardAsJSON, cn } from '@/lib/utils';
import { Shield, Plus, Eye, EyeOff, Copy, Trash2, Edit3, Save, X, ExternalLink, Upload, Download, FileText, Maximize2, Minimize2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import IconMap from '@/components/IconMap';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import dynamic from 'next/dynamic';

const DocumentEditor = dynamic(() => import('@/components/DocumentEditor'), { ssr: false });
const FileViewer = dynamic(() => import('@/components/FileViewer'), { ssr: false });

export default function VaultPage() {
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<VaultEntry>>({});
  const [editTagInput, setEditTagInput] = useState('');
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [darkMode, setDarkMode] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [newEntry, setNewEntry] = useState<Partial<VaultEntry>>({
    category: 'api-key',
    name: '',
    value: '',
    description: '',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [documentContent, setDocumentContent] = useState('');
  const [credFields, setCredFields] = useState<{ key: string; value: string }[]>([
    { key: 'Username', value: '' },
    { key: 'Password', value: '' },
  ]);
  const [docEditorEntry, setDocEditorEntry] = useState<VaultEntry | null>(null);
  const [docEditorContent, setDocEditorContent] = useState('');
  const [docEditorName, setDocEditorName] = useState('');
  const [docEditorDesc, setDocEditorDesc] = useState('');
  const [docEditorFullscreen, setDocEditorFullscreen] = useState(false);
  const [viewingFile, setViewingFile] = useState<VaultEntry | null>(null);
  const [fileViewerFullscreen, setFileViewerFullscreen] = useState(false);

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
    if (!newEntry.name) return;
    let value = newEntry.value || '';
    if (newEntry.category === 'credential') {
      const filledFields = credFields.filter(f => f.key.trim() && f.value.trim());
      if (filledFields.length === 0) return;
      value = JSON.stringify(filledFields);
    } else if (!value) {
      return;
    }
    const entry: VaultEntry = {
      id: uuidv4(),
      category: newEntry.category as VaultEntry['category'],
      name: newEntry.name!,
      value,
      description: newEntry.description || '',
      tags: newEntry.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hidden: newEntry.category === 'api-key' || newEntry.category === 'credential' || newEntry.category === 'server',
    };
    update([entry, ...entries]);
    setNewEntry({ category: 'api-key', name: '', value: '', description: '', tags: [] });
    setCredFields([{ key: 'Username', value: '' }, { key: 'Password', value: '' }]);
    setTagInput('');
    setShowAdd(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${uuidv4()}.${fileExt}`;
    const { error } = await supabase.storage.from('vault-files').upload(filePath, file);
    if (error) {
      console.error('Upload failed:', error.message);
      alert(`Upload failed: ${error.message}`);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('vault-files').getPublicUrl(filePath);
    const entry: VaultEntry = {
      id: uuidv4(),
      category: 'file',
      name: newEntry.name || file.name.replace(/\.[^/.]+$/, ''),
      value: urlData.publicUrl,
      description: `${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
      tags: [...(newEntry.tags || []), fileExt || 'file'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hidden: false,
    };
    update([entry, ...entries]);
    setNewEntry({ category: 'api-key', name: '', value: '', description: '', tags: [] });
    setTagInput('');
    setShowAdd(false);
    setUploading(false);
  }

  function addDocument() {
    if (!newEntry.name) return;
    const entry: VaultEntry = {
      id: uuidv4(),
      category: 'document',
      name: newEntry.name,
      value: documentContent || '',
      description: newEntry.description || '',
      tags: newEntry.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hidden: false,
    };
    const newEntries = [entry, ...entries];
    update(newEntries);
    openDocEditor(entry);
    setNewEntry({ category: 'api-key', name: '', value: '', description: '', tags: [] });
    setDocumentContent('');
    setTagInput('');
    setShowAdd(false);
  }

  function deleteEntry(id: string) {
    if (confirm('Delete this vault entry?')) {
      update(entries.filter(e => e.id !== id));
    }
  }

  function startEdit(entry: VaultEntry) {
    setEditingId(entry.id);
    setEditDraft({ ...entry });
    setEditTagInput('');
    setRevealedIds(prev => new Set(prev).add(entry.id));
  }

  function saveEdit() {
    if (!editingId || !editDraft.name || !editDraft.value) return;
    const updated = entries.map(e =>
      e.id === editingId
        ? { ...e, ...editDraft, updatedAt: new Date().toISOString() } as VaultEntry
        : e
    );
    update(updated);
    setEditingId(null);
    setEditDraft({});
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft({});
  }

  function openDocEditor(entry: VaultEntry) {
    setDocEditorEntry(entry);
    setDocEditorContent(entry.value);
    setDocEditorName(entry.name);
    setDocEditorDesc(entry.description);
    setDocEditorFullscreen(false);
  }

  function saveDocEditor() {
    if (!docEditorEntry) return;
    const updated = entries.map(e =>
      e.id === docEditorEntry.id
        ? { ...e, name: docEditorName, value: docEditorContent, description: docEditorDesc, updatedAt: new Date().toISOString() }
        : e
    );
    update(updated);
    setDocEditorEntry(null);
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

  function isCredentialJson(value: string): boolean {
    try { const parsed = JSON.parse(value); return Array.isArray(parsed); } catch { return false; }
  }

  function parseCredentialFields(value: string): { key: string; value: string }[] {
    try { return JSON.parse(value); } catch { return [{ key: 'Value', value }]; }
  }

  const groupedByCategory = Object.entries(VAULT_CATEGORIES).map(([key, config]) => ({
    key,
    ...config,
    entries: filtered.filter(e => e.category === key),
  })).filter(g => g.entries.length > 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar
        darkMode={darkMode}
        onToggleDark={toggleDark}
        onExport={() => exportBoardAsJSON({ vault: entries })}
        onSearch={() => {}}
      />

      <main className="ml-56 flex h-screen">
       <div className={cn(
         'overflow-y-auto p-6 transition-all',
         (docEditorEntry && docEditorFullscreen) || (viewingFile && fileViewerFullscreen) ? 'hidden'
           : (docEditorEntry || viewingFile) ? 'w-[50%] flex-shrink-0'
           : 'flex-1'
       )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Shield size={20} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold">Vault</h1>
              <p className="text-xs text-muted-foreground">API keys, credentials, links & important info</p>
            </div>
          </div>
          <Button onClick={() => setShowAdd(!showAdd)}>
            <Plus size={16} /> Add Entry
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1">
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search vault..."
            />
          </div>
          <Select value={categoryFilter || 'all'} onValueChange={v => setCategoryFilter(v === 'all' || !v ? '' : v)}>
            <SelectTrigger className="w-48">
              <SelectValue>{categoryFilter ? VAULT_CATEGORIES[categoryFilter as keyof typeof VAULT_CATEGORIES]?.label : 'All Categories'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(VAULT_CATEGORIES).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Add Entry Form */}
        {showAdd && (
          <Card className="mb-6 animate-fade-in">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Plus size={14} className="text-accent" /> New Vault Entry
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Category</Label>
                  <Select value={newEntry.category} onValueChange={v => setNewEntry({ ...newEntry, category: v as VaultEntry['category'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(VAULT_CATEGORIES).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Name</Label>
                  <Input
                    value={newEntry.name}
                    onChange={e => setNewEntry({ ...newEntry, name: e.target.value })}
                    placeholder="e.g. OpenAI API Key"
                  />
                </div>
              </div>
              {newEntry.category === 'file' ? (
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">File</Label>
                  <div className="relative border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent/50 transition-colors cursor-pointer">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">Drop a file or click to upload</p>
                    {uploading && <p className="text-xs text-accent mt-2">Uploading...</p>}
                  </div>
                </div>
              ) : newEntry.category === 'document' ? null : newEntry.category === 'credential' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Credential Fields</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-accent"
                      onClick={() => setCredFields([...credFields, { key: '', value: '' }])}
                    >
                      <Plus size={12} /> Add Field
                    </Button>
                  </div>
                  {credFields.map((field, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={field.key}
                        onChange={e => {
                          const updated = [...credFields];
                          updated[i] = { ...updated[i], key: e.target.value };
                          setCredFields(updated);
                        }}
                        placeholder="Field name (e.g. Username)"
                        className="w-1/3"
                      />
                      <Input
                        value={field.value}
                        onChange={e => {
                          const updated = [...credFields];
                          updated[i] = { ...updated[i], value: e.target.value };
                          setCredFields(updated);
                        }}
                        placeholder="Value"
                        className="flex-1 font-mono"
                      />
                      {credFields.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setCredFields(credFields.filter((_, j) => j !== i))}
                        >
                          <X size={14} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Value / Key / URL</Label>
                  <Input
                    value={newEntry.value}
                    onChange={e => setNewEntry({ ...newEntry, value: e.target.value })}
                    placeholder="sk-xxxx or https://..."
                    className="font-mono"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Description</Label>
                <Input
                  value={newEntry.description}
                  onChange={e => setNewEntry({ ...newEntry, description: e.target.value })}
                  placeholder="What is this used for?"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tag..."
                    className="flex-1"
                  />
                  <Button variant="ghost" size="sm" onClick={addTag} className="text-accent">+ Add</Button>
                </div>
                {(newEntry.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(newEntry.tags || []).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="bg-accent/10 text-accent text-[10px]">
                        {tag}
                        <button onClick={() => setNewEntry({ ...newEntry, tags: newEntry.tags?.filter((_, j) => j !== i) })} className="ml-1">
                          <X size={10} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {newEntry.category === 'file' ? (
                  <p className="text-xs text-muted-foreground">Select a file above to upload</p>
                ) : newEntry.category === 'document' ? (
                  <Button onClick={addDocument}><FileText size={14} /> Create Document</Button>
                ) : (
                  <Button onClick={addEntry}>Save Entry</Button>
                )}
                <Button variant="ghost" onClick={() => { setShowAdd(false); setDocumentContent(''); }}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vault entries */}
        {groupedByCategory.length === 0 ? (
          <div className="py-16 text-center">
            <Shield size={40} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No entries found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Add your first vault entry above</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByCategory.map(group => (
              <div key={group.key}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-accent mb-3 flex items-center gap-2">
                  <IconMap name={group.icon} size={16} /> {group.label}
                  <span className="text-muted-foreground/50">({group.entries.length})</span>
                </h3>
                <div className="space-y-2">
                  {group.entries.map(entry => (
                    <Card key={entry.id} className="hover:border-accent/30 transition-colors">
                      <CardContent className="py-4">
                        {editingId === entry.id ? (
                          <div className="space-y-3 animate-fade-in">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Category</Label>
                                <Select value={editDraft.category} onValueChange={v => setEditDraft({ ...editDraft, category: v as VaultEntry['category'] })}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(VAULT_CATEGORIES).map(([key, config]) => (
                                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Name</Label>
                                <Input value={editDraft.name || ''} onChange={e => setEditDraft({ ...editDraft, name: e.target.value })} />
                              </div>
                            </div>
                            {editDraft.category === 'credential' && isCredentialJson(editDraft.value || '') ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Credential Fields</Label>
                                  <Button variant="ghost" size="sm" className="text-accent" onClick={() => {
                                    const fields = parseCredentialFields(editDraft.value || '[]');
                                    fields.push({ key: '', value: '' });
                                    setEditDraft({ ...editDraft, value: JSON.stringify(fields) });
                                  }}>
                                    <Plus size={12} /> Add Field
                                  </Button>
                                </div>
                                {parseCredentialFields(editDraft.value || '[]').map((field, i) => (
                                  <div key={i} className="flex items-center gap-2">
                                    <Input
                                      value={field.key}
                                      onChange={e => {
                                        const fields = parseCredentialFields(editDraft.value || '[]');
                                        fields[i] = { ...fields[i], key: e.target.value };
                                        setEditDraft({ ...editDraft, value: JSON.stringify(fields) });
                                      }}
                                      placeholder="Field name"
                                      className="w-1/3"
                                    />
                                    <Input
                                      value={field.value}
                                      onChange={e => {
                                        const fields = parseCredentialFields(editDraft.value || '[]');
                                        fields[i] = { ...fields[i], value: e.target.value };
                                        setEditDraft({ ...editDraft, value: JSON.stringify(fields) });
                                      }}
                                      placeholder="Value"
                                      className="flex-1 font-mono"
                                    />
                                    <Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-destructive" onClick={() => {
                                      const fields = parseCredentialFields(editDraft.value || '[]').filter((_, j) => j !== i);
                                      setEditDraft({ ...editDraft, value: JSON.stringify(fields) });
                                    }}>
                                      <X size={14} />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Value / Key / URL</Label>
                                <Input value={editDraft.value || ''} onChange={e => setEditDraft({ ...editDraft, value: e.target.value })} className="font-mono" />
                              </div>
                            )}
                            <div className="space-y-1.5">
                              <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Description</Label>
                              <Input value={editDraft.description || ''} onChange={e => setEditDraft({ ...editDraft, description: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Tags</Label>
                              <div className="flex gap-2">
                                <Input
                                  value={editTagInput}
                                  onChange={e => setEditTagInput(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      if (editTagInput.trim()) {
                                        setEditDraft({ ...editDraft, tags: [...(editDraft.tags || []), editTagInput.trim()] });
                                        setEditTagInput('');
                                      }
                                    }
                                  }}
                                  placeholder="Add tag..."
                                  className="flex-1"
                                />
                                <Button variant="ghost" size="sm" onClick={() => {
                                  if (editTagInput.trim()) {
                                    setEditDraft({ ...editDraft, tags: [...(editDraft.tags || []), editTagInput.trim()] });
                                    setEditTagInput('');
                                  }
                                }} className="text-accent">+ Add</Button>
                              </div>
                              {(editDraft.tags || []).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {(editDraft.tags || []).map((tag, i) => (
                                    <Badge key={i} variant="secondary" className="bg-accent/10 text-accent text-[10px]">
                                      {tag}
                                      <button onClick={() => setEditDraft({ ...editDraft, tags: editDraft.tags?.filter((_, j) => j !== i) })} className="ml-1">
                                        <X size={10} />
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                                <input type="checkbox" checked={editDraft.hidden || false} onChange={e => setEditDraft({ ...editDraft, hidden: e.target.checked })} />
                                Hidden by default
                              </label>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={saveEdit}><Save size={14} /> Save</Button>
                              <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-semibold">{entry.name}</h4>
                                {entry.tags.map(tag => (
                                  <Badge key={tag} variant="secondary" className="bg-accent/10 text-accent text-[9px]">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              {entry.description && <p className="text-xs text-muted-foreground mb-2">{entry.description}</p>}
                              {entry.category === 'document' ? (
                                <div
                                  className="tiptap text-xs bg-secondary px-3 py-2 rounded max-h-32 overflow-y-auto cursor-pointer hover:ring-1 hover:ring-accent/30 transition-all"
                                  onClick={() => openDocEditor(entry)}
                                  dangerouslySetInnerHTML={{ __html: entry.value || '<p class="text-muted-foreground">Click to edit document...</p>' }}
                                />
                              ) : entry.category === 'file' ? (
                                <div className="flex items-center gap-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => { setViewingFile(entry); setDocEditorEntry(null); }}
                                  >
                                    <Eye size={12} /> Preview
                                  </Button>
                                  <a
                                    href={entry.value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
                                  >
                                    <Download size={12} /> Download
                                  </a>
                                </div>
                              ) : entry.category === 'credential' && isCredentialJson(entry.value) ? (
                                <div className={cn(
                                  'text-xs bg-secondary rounded overflow-hidden',
                                  entry.hidden && !revealedIds.has(entry.id) && 'blur-sm select-none'
                                )}>
                                  {entry.hidden && !revealedIds.has(entry.id) ? (
                                    <div className="px-2 py-1 font-mono">••••••••••••••••••</div>
                                  ) : (
                                    parseCredentialFields(entry.value).map((f, i) => (
                                      <div key={i} className="flex items-center border-b border-border/50 last:border-0">
                                        <span className="px-2 py-1 text-muted-foreground font-medium w-28 flex-shrink-0 border-r border-border/50">{f.key}</span>
                                        <span className="px-2 py-1 font-mono flex-1">{f.value}</span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              ) : (
                                <code className={cn(
                                  'text-xs bg-secondary px-2 py-1 rounded font-mono block',
                                  entry.hidden && !revealedIds.has(entry.id) && 'blur-sm select-none'
                                )}>
                                  {entry.hidden && !revealedIds.has(entry.id) ? '••••••••••••••••••' : entry.value}
                                </code>
                              )}
                              <p className="text-[10px] text-muted-foreground/50 mt-2">Updated {formatRelativeTime(entry.updatedAt)}</p>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <Tooltip>
                                <TooltipTrigger>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => entry.category === 'document' ? openDocEditor(entry) : startEdit(entry)}>
                                    <Edit3 size={14} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>
                              {entry.hidden && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => toggleReveal(entry.id)}>
                                      {revealedIds.has(entry.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{revealedIds.has(entry.id) ? 'Hide' : 'Reveal'}</TooltipContent>
                                </Tooltip>
                              )}
                              <Tooltip>
                                <TooltipTrigger>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn('h-8 w-8', copiedId === entry.id ? 'text-green-500' : 'text-muted-foreground')}
                                    onClick={() => copyValue(entry.id, entry.value)}
                                  >
                                    <Copy size={14} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copy</TooltipContent>
                              </Tooltip>
                              {entry.category === 'link' && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <a href={entry.value} target="_blank" rel="noopener noreferrer">
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                        <ExternalLink size={14} />
                                      </Button>
                                    </a>
                                  </TooltipTrigger>
                                  <TooltipContent>Open Link</TooltipContent>
                                </Tooltip>
                              )}
                              <Tooltip>
                                <TooltipTrigger>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteEntry(entry.id)}>
                                    <Trash2 size={14} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
       </div>

        {/* Document Editor Panel */}
        {docEditorEntry && (
          <div className={cn(
            'border-l border-border flex flex-col bg-card transition-all',
            docEditorFullscreen ? 'flex-1' : 'w-[50%]'
          )}>
            <div className="px-6 py-4 border-b border-border flex-shrink-0 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Input
                  value={docEditorName}
                  onChange={e => setDocEditorName(e.target.value)}
                  className="text-lg font-serif font-semibold border-0 bg-transparent px-0 h-auto focus-visible:ring-0 flex-1"
                  placeholder="Document title..."
                />
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger>
                      <Button variant="ghost" size="icon" onClick={() => setDocEditorFullscreen(!docEditorFullscreen)}>
                        {docEditorFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{docEditorFullscreen ? 'Split view' : 'Full screen'}</TooltipContent>
                  </Tooltip>
                  <Button variant="ghost" size="icon" onClick={() => setDocEditorEntry(null)}>
                    <X size={18} />
                  </Button>
                </div>
              </div>
              <Input
                value={docEditorDesc}
                onChange={e => setDocEditorDesc(e.target.value)}
                className="text-xs text-muted-foreground border-0 bg-transparent px-0 h-auto focus-visible:ring-0"
                placeholder="Description..."
              />
              <div className="flex items-center gap-2">
                {docEditorEntry.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="bg-accent/10 text-accent text-[9px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <DocumentEditor
                content={docEditorContent}
                onChange={setDocEditorContent}
              />
            </div>
            <div className="px-6 py-3 border-t border-border flex gap-2 flex-shrink-0">
              <Button onClick={saveDocEditor}>
                <Save size={14} /> Save
              </Button>
              <Button variant="ghost" onClick={() => setDocEditorEntry(null)}>Close</Button>
            </div>
          </div>
        )}

        {/* File Viewer Panel */}
        {viewingFile && !docEditorEntry && (
          <div className={cn(
            'border-l border-border flex flex-col bg-card transition-all',
            fileViewerFullscreen ? 'flex-1' : 'w-[50%]'
          )}>
            <div className="px-6 py-4 border-b border-border flex-shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif font-semibold truncate">{viewingFile.name}</h3>
                  {viewingFile.description && (
                    <p className="text-xs text-muted-foreground truncate">{viewingFile.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger>
                      <Button variant="ghost" size="icon" onClick={() => window.open(viewingFile.value, '_blank')}>
                        <ExternalLink size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Open in new tab</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger>
                      <Button variant="ghost" size="icon" onClick={() => setFileViewerFullscreen(!fileViewerFullscreen)}>
                        {fileViewerFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{fileViewerFullscreen ? 'Split view' : 'Full screen'}</TooltipContent>
                  </Tooltip>
                  <Button variant="ghost" size="icon" onClick={() => { setViewingFile(null); setFileViewerFullscreen(false); }}>
                    <X size={18} />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-col p-4 min-h-0">
              <FileViewer
                url={viewingFile.value}
                filename={viewingFile.description || viewingFile.name}
                className="flex-1"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
