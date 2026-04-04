import { Board, Column, Card, VaultEntry, ActivityEntry, TeamMember, DEFAULT_MEMBERS } from '@/types';
import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

// ── Board ──────────────────────────────────────────────

export async function loadBoard(): Promise<Board> {
  const { data: boards, error: boardErr } = await supabase
    .from('boards')
    .select('*')
    .limit(1)
    .single();

  if (boardErr || !boards) {
    console.warn('No board found, creating empty board:', boardErr?.message);
    return createEmptyBoard();
  }

  const { data: columns, error: colErr } = await supabase
    .from('columns')
    .select('*')
    .eq('board_id', boards.id)
    .order('position');

  if (colErr) console.error('Failed to load columns:', colErr.message);

  const columnIds = (columns || []).map(c => c.id);
  let cards: Record<string, unknown>[] = [];
  if (columnIds.length > 0) {
    const { data: cardData, error: cardErr } = await supabase
      .from('cards')
      .select('*')
      .in('column_id', columnIds)
      .order('position');
    if (cardErr) console.error('Failed to load cards:', cardErr.message);
    cards = cardData || [];
  }

  const boardColumns: Column[] = (columns || []).map(col => ({
    id: col.id,
    title: col.title,
    limit: col.card_limit ?? undefined,
    color: col.color ?? undefined,
    cards: cards
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

async function createEmptyBoard(): Promise<Board> {
  const boardId = uuidv4();
  const now = new Date().toISOString();

  const { error } = await supabase.from('boards').insert({ id: boardId, name: 'General Strategy' });
  if (error) console.error('Failed to create board:', error.message);

  const defaultColumns = [
    { id: 'col-backlog', title: 'Backlog', position: 0 },
    { id: 'col-todo', title: 'To Do', position: 1 },
    { id: 'col-progress', title: 'In Progress', position: 2 },
    { id: 'col-review', title: 'In Review', position: 3 },
    { id: 'col-done', title: 'Done', position: 4 },
  ];

  const { error: colErr } = await supabase.from('columns').insert(
    defaultColumns.map(c => ({ ...c, board_id: boardId }))
  );
  if (colErr) console.error('Failed to create columns:', colErr.message);

  return {
    id: boardId,
    name: 'General Strategy',
    columns: defaultColumns.map(col => ({ id: col.id, title: col.title, cards: [] })),
    createdAt: now,
    updatedAt: now,
  };
}

export async function saveBoard(board: Board): Promise<void> {
  const now = new Date().toISOString();

  const { error: boardErr } = await supabase
    .from('boards')
    .upsert({ id: board.id, name: board.name, updated_at: now });
  if (boardErr) console.error('Failed to save board:', boardErr.message);

  // Get existing columns to diff
  const { data: existingCols } = await supabase
    .from('columns')
    .select('id')
    .eq('board_id', board.id);

  const existingColIds = new Set((existingCols || []).map(c => c.id));
  const newColIds = new Set(board.columns.map(c => c.id));

  // Delete removed columns (cascades to cards)
  const removedColIds = [...existingColIds].filter(id => !newColIds.has(id));
  if (removedColIds.length > 0) {
    const { error } = await supabase.from('columns').delete().in('id', removedColIds);
    if (error) console.error('Failed to delete columns:', error.message);
  }

  // Upsert columns
  if (board.columns.length > 0) {
    const { error } = await supabase.from('columns').upsert(
      board.columns.map((col, i) => ({
        id: col.id,
        board_id: board.id,
        title: col.title,
        position: i,
        card_limit: col.limit ?? null,
        color: col.color ?? null,
      }))
    );
    if (error) console.error('Failed to upsert columns:', error.message);
  }

  // Get all existing card IDs for this board's columns
  const allColIds = board.columns.map(c => c.id);
  let existingCardIds = new Set<string>();
  if (allColIds.length > 0) {
    const { data: existingCards } = await supabase
      .from('cards')
      .select('id')
      .in('column_id', allColIds);
    existingCardIds = new Set((existingCards || []).map(c => c.id));
  }

  const allNewCardIds = new Set(board.columns.flatMap(col => col.cards.map(c => c.id)));

  // Delete removed cards
  const removedCardIds = [...existingCardIds].filter(id => !allNewCardIds.has(id));
  if (removedCardIds.length > 0) {
    const { error } = await supabase.from('cards').delete().in('id', removedCardIds);
    if (error) console.error('Failed to delete cards:', error.message);
  }

  // Upsert all cards
  const allCards = board.columns.flatMap(col =>
    col.cards.map((card, cardIdx) => cardToDbCard(card, col.id, cardIdx))
  );
  if (allCards.length > 0) {
    const { error } = await supabase.from('cards').upsert(allCards);
    if (error) console.error('Failed to upsert cards:', error.message);
  }
}

// ── Vault ──────────────────────────────────────────────

export async function loadVault(): Promise<VaultEntry[]> {
  const { data, error } = await supabase
    .from('vault_entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) console.error('Failed to load vault:', error.message);
  return (data || []).map(dbVaultToVault);
}

export async function saveVault(entries: VaultEntry[]): Promise<void> {
  const { error: delErr } = await supabase.from('vault_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) console.error('Failed to clear vault:', delErr.message);

  if (entries.length > 0) {
    const { error } = await supabase.from('vault_entries').insert(
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
    if (error) console.error('Failed to save vault:', error.message);
  }
}

// ── Activity ───────────────────────────────────────────

export async function loadActivity(): Promise<ActivityEntry[]> {
  const { data, error } = await supabase
    .from('activity_entries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) console.error('Failed to load activity:', error.message);

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
  const { error: delErr } = await supabase.from('activity_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) console.error('Failed to clear activity:', delErr.message);

  if (entries.length > 0) {
    const { error } = await supabase.from('activity_entries').insert(
      entries.slice(0, 200).map(e => ({
        id: e.id,
        action: e.action,
        card_title: e.cardTitle ?? null,
        column_title: e.columnTitle ?? null,
        author: e.author,
        created_at: e.timestamp,
      }))
    );
    if (error) console.error('Failed to save activity:', error.message);
  }
}

export async function addActivity(action: string, cardTitle?: string, columnTitle?: string): Promise<void> {
  const { error } = await supabase.from('activity_entries').insert({
    action,
    card_title: cardTitle ?? null,
    column_title: columnTitle ?? null,
    author: 'Arvin',
  });
  if (error) console.error('Failed to add activity:', error.message);
}

// ── Members ────────────────────────────────────────────

export async function loadMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('*');

  if (error) console.error('Failed to load members:', error.message);

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
  const { error: delErr } = await supabase.from('team_members').delete().neq('id', '___none___');
  if (delErr) console.error('Failed to clear members:', delErr.message);

  if (members.length > 0) {
    const { error } = await supabase.from('team_members').insert(
      members.map(m => ({
        id: m.id,
        name: m.name,
        initials: m.initials,
        color: m.color,
      }))
    );
    if (error) console.error('Failed to save members:', error.message);
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
    labels: (row.labels as { id: string; name: string; color: string }[] | null) || [],
    assignee: (row.assignee as string) || '',
    dueDate: (row.due_date as string) || null,
    priority: (row.priority as Card['priority']) || 'low',
    checklist: (row.checklist as { id: string; text: string; completed: boolean }[] | null) || [],
    comments: (row.comments as { id: string; author: string; text: string; createdAt: string }[] | null) || [],
    attachments: (row.attachments as string[] | null) || [],
    archived: (row.archived as boolean) || false,
    coverColor: (row.cover_color as string) ?? undefined,
    estimatedHours: (row.estimated_hours as number) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

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
