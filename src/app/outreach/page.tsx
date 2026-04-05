'use client';

import { useState, useEffect, useCallback } from 'react';
import { Contact, CONTACT_TYPES, CONTACT_STATUSES } from '@/types';
import { loadContacts, saveContact, deleteContact as deleteContactApi, loadTheme, saveTheme } from '@/lib/storage';
import { formatRelativeTime, cn } from '@/lib/utils';
import { UserCheck, Plus, Search, Trash2, Edit3, Save, X, Mail, Phone, Building2, ChevronDown, ChevronRight } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { exportBoardAsJSON } from '@/lib/utils';

export default function OutreachPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  const [draft, setDraft] = useState<Partial<Contact>>({
    name: '', company: '', title: '', email: '', phone: '',
    contactType: 'lead', status: 'lead', source: '', notes: '', tags: [],
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    async function init() {
      const c = await loadContacts();
      setContacts(c);
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

  function resetDraft() {
    setDraft({
      name: '', company: '', title: '', email: '', phone: '',
      contactType: 'lead', status: 'lead', source: '', notes: '', tags: [],
    });
    setTagInput('');
  }

  async function handleAdd() {
    if (!draft.name) return;
    const contact: Contact = {
      id: uuidv4(),
      name: draft.name!,
      company: draft.company || '',
      title: draft.title || '',
      email: draft.email || '',
      phone: draft.phone || '',
      contactType: (draft.contactType as Contact['contactType']) || 'lead',
      status: (draft.status as Contact['status']) || 'lead',
      lastContacted: null,
      source: draft.source || '',
      notes: draft.notes || '',
      tags: draft.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveContact(contact);
    setContacts([contact, ...contacts]);
    resetDraft();
    setShowAdd(false);
  }

  async function handleUpdate(contact: Contact) {
    const updated = { ...contact, updatedAt: new Date().toISOString() };
    await saveContact(updated);
    setContacts(contacts.map(c => c.id === updated.id ? updated : c));
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this contact?')) return;
    await deleteContactApi(id);
    setContacts(contacts.filter(c => c.id !== id));
  }

  async function handleStatusChange(contact: Contact, status: Contact['status']) {
    const updated = {
      ...contact,
      status,
      lastContacted: ['contacted', 'responded', 'meeting'].includes(status) ? new Date().toISOString() : contact.lastContacted,
      updatedAt: new Date().toISOString(),
    };
    await saveContact(updated);
    setContacts(contacts.map(c => c.id === updated.id ? updated : c));
  }

  const filtered = contacts.filter(c => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (typeFilter && c.contactType !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q)
        || c.company.toLowerCase().includes(q)
        || c.email.toLowerCase().includes(q)
        || c.notes.toLowerCase().includes(q)
        || c.tags.some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  // Group by status
  const grouped = Object.entries(CONTACT_STATUSES).map(([key, config]) => ({
    key,
    ...config,
    contacts: filtered.filter(c => c.status === key),
  })).filter(g => g.contacts.length > 0);

  const statusCounts = Object.entries(CONTACT_STATUSES).map(([key, config]) => ({
    key, ...config,
    count: contacts.filter(c => c.status === key).length,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar
        darkMode={darkMode}
        onToggleDark={toggleDark}
        onExport={() => exportBoardAsJSON({ contacts })}
        onSearch={() => {}}
      />

      <main className="ml-56 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <UserCheck size={20} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold">Outreach</h1>
              <p className="text-xs text-muted-foreground">Track contacts, outreach, and relationships</p>
            </div>
          </div>
          <Button onClick={() => setShowAdd(!showAdd)}>
            <Plus size={16} /> Add Contact
          </Button>
        </div>

        {/* Status summary */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {statusCounts.map(s => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(statusFilter === s.key ? '' : s.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                statusFilter === s.key
                  ? 'border-accent bg-accent/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-accent/50'
              )}
            >
              <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: s.color }} />
              {s.label} ({s.count})
            </button>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1">
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search contacts..."
            />
          </div>
          <Select value={typeFilter || '__all__'} onValueChange={v => setTypeFilter(v === '__all__' || !v ? '' : v)}>
            <SelectTrigger className="w-44">
              <SelectValue>{typeFilter ? CONTACT_TYPES[typeFilter as keyof typeof CONTACT_TYPES]?.label : 'All Types'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Types</SelectItem>
              {Object.entries(CONTACT_TYPES).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Add Contact Form */}
        {showAdd && (
          <Card className="mb-6 animate-fade-in">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Plus size={14} className="text-accent" /> New Contact
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Name *</Label>
                  <Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="John Smith" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Company</Label>
                  <Input value={draft.company} onChange={e => setDraft({ ...draft, company: e.target.value })} placeholder="Acme Corp" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Title</Label>
                  <Input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="VP of Operations" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Email</Label>
                  <Input value={draft.email} onChange={e => setDraft({ ...draft, email: e.target.value })} placeholder="john@acme.com" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Phone</Label>
                  <Input value={draft.phone} onChange={e => setDraft({ ...draft, phone: e.target.value })} placeholder="+1 555-0123" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Type</Label>
                  <Select value={draft.contactType} onValueChange={v => setDraft({ ...draft, contactType: v as Contact['contactType'] })}>
                    <SelectTrigger><SelectValue>{CONTACT_TYPES[(draft.contactType || 'lead') as keyof typeof CONTACT_TYPES]?.label}</SelectValue></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CONTACT_TYPES).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Status</Label>
                  <Select value={draft.status} onValueChange={v => setDraft({ ...draft, status: v as Contact['status'] })}>
                    <SelectTrigger><SelectValue>{CONTACT_STATUSES[(draft.status || 'lead') as keyof typeof CONTACT_STATUSES]?.label}</SelectValue></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CONTACT_STATUSES).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Source</Label>
                  <Input value={draft.source} onChange={e => setDraft({ ...draft, source: e.target.value })} placeholder="LinkedIn, Referral..." />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Notes</Label>
                <Textarea value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} placeholder="Notes about this contact..." rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && tagInput.trim()) {
                        e.preventDefault();
                        setDraft({ ...draft, tags: [...(draft.tags || []), tagInput.trim()] });
                        setTagInput('');
                      }
                    }}
                    placeholder="Add tag..."
                    className="flex-1"
                  />
                  <Button variant="ghost" size="sm" className="text-accent" onClick={() => {
                    if (tagInput.trim()) {
                      setDraft({ ...draft, tags: [...(draft.tags || []), tagInput.trim()] });
                      setTagInput('');
                    }
                  }}>+ Add</Button>
                </div>
                {(draft.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(draft.tags || []).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="bg-accent/10 text-accent text-[10px]">
                        {tag}
                        <button onClick={() => setDraft({ ...draft, tags: draft.tags?.filter((_, j) => j !== i) })} className="ml-1"><X size={10} /></button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdd}>Save Contact</Button>
                <Button variant="ghost" onClick={() => { setShowAdd(false); resetDraft(); }}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contacts list */}
        {grouped.length === 0 ? (
          <div className="py-16 text-center">
            <UserCheck size={40} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No contacts found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Add your first contact above</p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(group => (
              <div key={group.key}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />
                  <span style={{ color: group.color }}>{group.label}</span>
                  <span className="text-muted-foreground/50">({group.contacts.length})</span>
                </h3>
                <div className="space-y-2">
                  {group.contacts.map(contact => (
                    <Card key={contact.id} className="hover:border-accent/30 transition-colors">
                      <CardContent className="py-3">
                        {editingId === contact.id ? (
                          <EditContactForm
                            contact={contact}
                            onSave={handleUpdate}
                            onCancel={() => setEditingId(null)}
                          />
                        ) : (
                          <div>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-sm font-semibold">{contact.name}</h4>
                                  <Badge variant="outline" className="text-[9px]" style={{ borderColor: CONTACT_TYPES[contact.contactType]?.color, color: CONTACT_TYPES[contact.contactType]?.color }}>
                                    {CONTACT_TYPES[contact.contactType]?.label}
                                  </Badge>
                                  {contact.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="bg-accent/10 text-accent text-[9px]">{tag}</Badge>
                                  ))}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  {contact.company && (
                                    <span className="flex items-center gap-1"><Building2 size={10} /> {contact.company}{contact.title && ` - ${contact.title}`}</span>
                                  )}
                                  {contact.email && (
                                    <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:text-accent"><Mail size={10} /> {contact.email}</a>
                                  )}
                                  {contact.phone && (
                                    <span className="flex items-center gap-1"><Phone size={10} /> {contact.phone}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {/* Status quick-change */}
                                <Select value={contact.status} onValueChange={v => handleStatusChange(contact, v as Contact['status'])}>
                                  <SelectTrigger className="h-7 text-[10px] w-auto gap-1 border-0 bg-transparent">
                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CONTACT_STATUSES[contact.status]?.color }} />
                                    <SelectValue>{CONTACT_STATUSES[contact.status]?.label}</SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(CONTACT_STATUSES).map(([key, config]) => (
                                      <SelectItem key={key} value={key}>
                                        <span className="flex items-center gap-1.5">
                                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                                          {config.label}
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => setEditingId(contact.id)}>
                                      <Edit3 size={13} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(contact.id)}>
                                      <Trash2 size={13} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete</TooltipContent>
                                </Tooltip>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground"
                                  onClick={() => setExpandedId(expandedId === contact.id ? null : contact.id)}
                                >
                                  {expandedId === contact.id ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                </Button>
                              </div>
                            </div>

                            {/* Expanded details */}
                            {expandedId === contact.id && (
                              <div className="mt-3 pt-3 border-t border-border space-y-2 animate-fade-in">
                                <div className="grid grid-cols-3 gap-4 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">Source:</span>
                                    <span className="ml-1">{contact.source || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Last Contacted:</span>
                                    <span className="ml-1">{contact.lastContacted ? formatRelativeTime(contact.lastContacted) : 'Never'}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Added:</span>
                                    <span className="ml-1">{formatRelativeTime(contact.createdAt)}</span>
                                  </div>
                                </div>
                                {contact.notes && (
                                  <div className="text-xs bg-muted rounded-lg p-3 whitespace-pre-wrap">{contact.notes}</div>
                                )}
                              </div>
                            )}
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
      </main>
    </div>
  );
}

// ── Inline Edit Form ──

function EditContactForm({ contact, onSave, onCancel }: { contact: Contact; onSave: (c: Contact) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<Contact>({ ...contact });

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Name</Label>
          <Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Company</Label>
          <Input value={draft.company} onChange={e => setDraft({ ...draft, company: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Title</Label>
          <Input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Email</Label>
          <Input value={draft.email} onChange={e => setDraft({ ...draft, email: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Phone</Label>
          <Input value={draft.phone} onChange={e => setDraft({ ...draft, phone: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Type</Label>
          <Select value={draft.contactType} onValueChange={v => setDraft({ ...draft, contactType: v as Contact['contactType'] })}>
            <SelectTrigger><SelectValue>{CONTACT_TYPES[draft.contactType]?.label}</SelectValue></SelectTrigger>
            <SelectContent>
              {Object.entries(CONTACT_TYPES).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Source</Label>
          <Input value={draft.source} onChange={e => setDraft({ ...draft, source: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Last Contacted</Label>
          <Input type="date" value={draft.lastContacted ? draft.lastContacted.slice(0, 10) : ''} onChange={e => setDraft({ ...draft, lastContacted: e.target.value || null })} />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">Notes</Label>
        <Textarea value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} rows={3} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(draft)}><Save size={14} /> Save</Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
