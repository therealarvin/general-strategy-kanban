import { Board, Column, Card, VaultEntry, ActivityEntry, TeamMember, DEFAULT_MEMBERS, DEFAULT_LABELS } from '@/types';
import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

// ── Board ──────────────────────────────────────────────

export async function loadBoard(): Promise<Board> {
  const { data: boards } = await supabase
    .from('boards')
    .select('*')
    .limit(1)
    .single();

  if (!boards) {
    // Seed default board
    const board = await seedDefaultBoard();
    return board;
  }

  const { data: columns } = await supabase
    .from('columns')
    .select('*')
    .eq('board_id', boards.id)
    .order('position');

  const columnIds = (columns || []).map(c => c.id);
  const { data: cards } = columnIds.length > 0
    ? await supabase
        .from('cards')
        .select('*')
        .in('column_id', columnIds)
        .order('position')
    : { data: [] as Record<string, unknown>[] };

  const boardColumns: Column[] = (columns || []).map(col => ({
    id: col.id,
    title: col.title,
    limit: col.card_limit ?? undefined,
    color: col.color ?? undefined,
    cards: (cards || [])
      .filter(c => c.column_id === col.id)
      .map(dbCardToCard),
  }));

  return {
    id: boards.id,
    name: boards.name,
    columns: boardColumns,
    createdAt: boards.created_at,
    updatedAt: boards.updated_at,
  };
}

export async function saveBoard(board: Board): Promise<void> {
  const now = new Date().toISOString();

  await supabase
    .from('boards')
    .upsert({ id: board.id, name: board.name, updated_at: now });

  // Get existing columns to diff
  const { data: existingCols } = await supabase
    .from('columns')
    .select('id')
    .eq('board_id', board.id);

  const existingColIds = new Set((existingCols || []).map(c => c.id));
  const newColIds = new Set(board.columns.map(c => c.id));

  // Delete removed columns
  const removedColIds = [...existingColIds].filter(id => !newColIds.has(id));
  if (removedColIds.length > 0) {
    await supabase.from('columns').delete().in('id', removedColIds);
  }

  // Upsert columns
  if (board.columns.length > 0) {
    await supabase.from('columns').upsert(
      board.columns.map((col, i) => ({
        id: col.id,
        board_id: board.id,
        title: col.title,
        position: i,
        card_limit: col.limit ?? null,
        color: col.color ?? null,
      }))
    );
  }

  // Get all existing card IDs for this board's columns
  const allColIds = board.columns.map(c => c.id);
  const { data: existingCards } = allColIds.length > 0
    ? await supabase.from('cards').select('id').in('column_id', allColIds)
    : { data: [] };

  const existingCardIds = new Set((existingCards || []).map(c => c.id));
  const allNewCardIds = new Set(board.columns.flatMap(col => col.cards.map(c => c.id)));

  // Delete removed cards
  const removedCardIds = [...existingCardIds].filter(id => !allNewCardIds.has(id));
  if (removedCardIds.length > 0) {
    await supabase.from('cards').delete().in('id', removedCardIds);
  }

  // Upsert all cards
  const allCards = board.columns.flatMap((col, _colIdx) =>
    col.cards.map((card, cardIdx) => cardToDbCard(card, col.id, cardIdx))
  );
  if (allCards.length > 0) {
    await supabase.from('cards').upsert(allCards);
  }
}

// ── Vault ──────────────────────────────────────────────

export async function loadVault(): Promise<VaultEntry[]> {
  const { data } = await supabase
    .from('vault_entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (!data || data.length === 0) {
    const sample = getSampleVault();
    await saveVault(sample);
    return sample;
  }

  return data.map(dbVaultToVault);
}

export async function saveVault(entries: VaultEntry[]): Promise<void> {
  // Replace all vault entries
  await supabase.from('vault_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  if (entries.length > 0) {
    await supabase.from('vault_entries').insert(
      entries.map(e => ({
        id: e.id,
        category: e.category,
        name: e.name,
        value: e.value,
        description: e.description,
        tags: e.tags,
        hidden: e.hidden,
        created_at: e.createdAt,
        updated_at: e.updatedAt,
      }))
    );
  }
}

// ── Activity ───────────────────────────────────────────

export async function loadActivity(): Promise<ActivityEntry[]> {
  const { data } = await supabase
    .from('activity_entries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  return (data || []).map(a => ({
    id: a.id,
    action: a.action,
    cardTitle: a.card_title ?? undefined,
    columnTitle: a.column_title ?? undefined,
    timestamp: a.created_at,
    author: a.author,
  }));
}

export async function saveActivity(entries: ActivityEntry[]): Promise<void> {
  // Clear all activity
  await supabase.from('activity_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  if (entries.length > 0) {
    await supabase.from('activity_entries').insert(
      entries.slice(0, 200).map(e => ({
        id: e.id,
        action: e.action,
        card_title: e.cardTitle ?? null,
        column_title: e.columnTitle ?? null,
        author: e.author,
        created_at: e.timestamp,
      }))
    );
  }
}

export async function addActivity(action: string, cardTitle?: string, columnTitle?: string): Promise<void> {
  await supabase.from('activity_entries').insert({
    action,
    card_title: cardTitle ?? null,
    column_title: columnTitle ?? null,
    author: 'Arvin',
  });
}

// ── Members ────────────────────────────────────────────

export async function loadMembers(): Promise<TeamMember[]> {
  const { data } = await supabase
    .from('team_members')
    .select('*');

  if (!data || data.length === 0) {
    await saveMembers(DEFAULT_MEMBERS);
    return DEFAULT_MEMBERS;
  }

  return data.map(m => ({
    id: m.id,
    name: m.name,
    initials: m.initials,
    color: m.color,
  }));
}

export async function saveMembers(members: TeamMember[]): Promise<void> {
  await supabase.from('team_members').delete().neq('id', '___none___');

  if (members.length > 0) {
    await supabase.from('team_members').insert(
      members.map(m => ({
        id: m.id,
        name: m.name,
        initials: m.initials,
        color: m.color,
      }))
    );
  }
}

// ── Theme (stays in localStorage — per-browser preference) ──

export function loadTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return (localStorage.getItem('gs-kanban-theme') as 'light' | 'dark') || 'light';
}

export function saveTheme(theme: 'light' | 'dark'): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('gs-kanban-theme', theme);
}

// ── Helpers ────────────────────────────────────────────

function dbCardToCard(row: Record<string, unknown>): Card {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) || '',
    labels: (row.labels as Label[] | null) || [],
    assignee: (row.assignee as string) || '',
    dueDate: (row.due_date as string) || null,
    priority: (row.priority as Card['priority']) || 'low',
    checklist: (row.checklist as ChecklistItem[] | null) || [],
    comments: (row.comments as Comment[] | null) || [],
    attachments: (row.attachments as string[] | null) || [],
    archived: (row.archived as boolean) || false,
    coverColor: (row.cover_color as string) ?? undefined,
    estimatedHours: (row.estimated_hours as number) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

type Label = { id: string; name: string; color: string };
type ChecklistItem = { id: string; text: string; completed: boolean };
type Comment = { id: string; author: string; text: string; createdAt: string };

function cardToDbCard(card: Card, columnId: string, position: number) {
  return {
    id: card.id,
    column_id: columnId,
    title: card.title,
    description: card.description,
    assignee: card.assignee,
    due_date: card.dueDate,
    priority: card.priority,
    labels: card.labels,
    checklist: card.checklist,
    comments: card.comments,
    attachments: card.attachments,
    archived: card.archived,
    cover_color: card.coverColor ?? null,
    estimated_hours: card.estimatedHours ?? null,
    position,
    created_at: card.createdAt,
    updated_at: new Date().toISOString(),
  };
}

function dbVaultToVault(row: Record<string, unknown>): VaultEntry {
  return {
    id: row.id as string,
    category: row.category as VaultEntry['category'],
    name: row.name as string,
    value: row.value as string,
    description: (row.description as string) || '',
    tags: (row.tags as string[]) || [],
    hidden: (row.hidden as boolean) || false,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

async function seedDefaultBoard(): Promise<Board> {
  const boardId = uuidv4();
  const now = new Date().toISOString();

  await supabase.from('boards').insert({ id: boardId, name: 'General Strategy' });

  const defaultColumns = [
    { id: 'col-backlog', title: 'Backlog', position: 0 },
    { id: 'col-todo', title: 'To Do', position: 1 },
    { id: 'col-progress', title: 'In Progress', position: 2 },
    { id: 'col-review', title: 'In Review', position: 3 },
    { id: 'col-done', title: 'Done', position: 4 },
  ];

  await supabase.from('columns').insert(
    defaultColumns.map(c => ({ ...c, board_id: boardId }))
  );

  const defaultCards: { col: string; title: string; desc: string; priority: Card['priority']; labelIds: string[] }[] = [
    { col: 'col-backlog', title: 'Set up analytics dashboard', desc: 'Implement Vercel Analytics or Plausible on generalstrategy.co', priority: 'low', labelIds: ['l3', 'l8'] },
    { col: 'col-backlog', title: 'SEO metadata audit', desc: 'Add proper meta tags, OG images, and structured data across all pages', priority: 'medium', labelIds: ['l3'] },
    { col: 'col-backlog', title: 'Lighthouse API documentation', desc: 'Write comprehensive API docs for the simulation engine endpoints', priority: 'low', labelIds: ['l6', 'l8'] },
    { col: 'col-todo', title: 'Cold email campaign v2', desc: 'Draft new outreach templates targeting supply chain companies', priority: 'high', labelIds: ['l7'] },
    { col: 'col-todo', title: 'Agency Platform onboarding flow', desc: 'Build guided setup wizard for new client deployments', priority: 'medium', labelIds: ['l2'] },
    { col: 'col-progress', title: 'Website performance optimization', desc: 'Reduce LCP below 2.5s, optimize image loading and font delivery', priority: 'high', labelIds: ['l3'] },
    { col: 'col-review', title: 'Client proposal template', desc: 'Standardized proposal deck for PE portfolio company pitches', priority: 'medium', labelIds: ['l7', 'l5'] },
    { col: 'col-done', title: 'Fix booking button', desc: 'Calendly integration was broken — fixed routing and embed', priority: 'urgent', labelIds: ['l1'] },
    { col: 'col-done', title: 'Brand guide documentation', desc: 'Complete brand reference with colors, typography, components', priority: 'medium', labelIds: ['l5', 'l8'] },
  ];

  const cards = defaultCards.map((c, i) => ({
    id: uuidv4(),
    column_id: c.col,
    title: c.title,
    description: c.desc,
    assignee: 'm1',
    due_date: null,
    priority: c.priority,
    labels: c.labelIds.map(id => DEFAULT_LABELS.find(l => l.id === id)!).filter(Boolean),
    checklist: [],
    comments: [],
    attachments: [],
    archived: false,
    cover_color: null,
    estimated_hours: null,
    position: i,
    created_at: now,
    updated_at: now,
  }));

  await supabase.from('cards').insert(cards);

  const boardColumns: Column[] = defaultColumns.map(col => ({
    id: col.id,
    title: col.title,
    cards: cards
      .filter(c => c.column_id === col.id)
      .map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        labels: c.labels as { id: string; name: string; color: string }[],
        assignee: c.assignee,
        dueDate: null,
        priority: c.priority as Card['priority'],
        checklist: [],
        comments: [],
        attachments: [],
        archived: false,
        createdAt: now,
        updatedAt: now,
      })),
  }));

  return {
    id: boardId,
    name: 'General Strategy',
    columns: boardColumns,
    createdAt: now,
    updatedAt: now,
  };
}

function getSampleVault(): VaultEntry[] {
  const now = new Date().toISOString();
  return [
    { id: uuidv4(), category: 'link', name: 'GS Website', value: 'https://generalstrategy.co', description: 'Main marketing website (Namecheap hosting)', tags: ['website', 'production'], createdAt: now, updatedAt: now, hidden: false },
    { id: uuidv4(), category: 'link', name: 'GS Documentation', value: 'https://ygali04.github.io/general-strategy-docs/', description: 'Internal docs site (MkDocs, private repo)', tags: ['docs', 'internal'], createdAt: now, updatedAt: now, hidden: false },
    { id: uuidv4(), category: 'api-key', name: 'OpenRouter API Key', value: 'sk-or-xxxx-placeholder', description: 'Used by Agency Platform for LLM routing', tags: ['api', 'llm', 'agency-platform'], createdAt: now, updatedAt: now, hidden: true },
    { id: uuidv4(), category: 'server', name: 'Lighthouse Server', value: 'localhost:5000', description: 'Flask dev server for simulation engine', tags: ['lighthouse', 'dev'], createdAt: now, updatedAt: now, hidden: false },
    { id: uuidv4(), category: 'credential', name: 'Namecheap Account', value: 'See 1Password', description: 'Domain registrar and hosting for generalstrategy.co', tags: ['hosting', 'domain'], createdAt: now, updatedAt: now, hidden: true },
  ];
}
