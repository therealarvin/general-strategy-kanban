import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Tool Definitions (OpenAI format) ──

export const tools = [
  // Board tools
  {
    type: 'function' as const,
    function: {
      name: 'list_board',
      description: 'Get the full kanban board with all columns and cards',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_card',
      description: 'Create a new card on the kanban board',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Card title' },
          description: { type: 'string', description: 'Card description' },
          column_id: { type: 'string', description: 'Column ID to add to. Use list_board to find column IDs.' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: 'Priority level' },
          assignees: { type: 'array', items: { type: 'string' }, description: 'Array of team member IDs' },
          estimated_hours: { type: 'number', description: 'Estimated hours' },
          due_date: { type: 'string', description: 'Due date in YYYY-MM-DD format' },
        },
        required: ['title', 'column_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_card',
      description: 'Update an existing card',
      parameters: {
        type: 'object',
        properties: {
          card_id: { type: 'string', description: 'Card ID to update' },
          title: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          assignees: { type: 'array', items: { type: 'string' } },
          estimated_hours: { type: 'number' },
          due_date: { type: 'string', description: 'YYYY-MM-DD or null to clear' },
          column_id: { type: 'string', description: 'Move to this column' },
          archived: { type: 'boolean' },
        },
        required: ['card_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_team_members',
      description: 'List all team members with their IDs',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  // Contact tools
  {
    type: 'function' as const,
    function: {
      name: 'list_contacts',
      description: 'List all outreach contacts',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['lead', 'contacted', 'responded', 'meeting', 'closed-won', 'closed-lost'], description: 'Filter by status' },
          contact_type: { type: 'string', enum: ['lead', 'investor', 'referral', 'partner', 'other'], description: 'Filter by type' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_contact',
      description: 'Create a new outreach contact',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Contact name' },
          company: { type: 'string' },
          title: { type: 'string', description: 'Job title' },
          email: { type: 'string' },
          phone: { type: 'string' },
          contact_type: { type: 'string', enum: ['lead', 'investor', 'referral', 'partner', 'other'] },
          status: { type: 'string', enum: ['lead', 'contacted', 'responded', 'meeting', 'closed-won', 'closed-lost'] },
          source: { type: 'string' },
          notes: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_contact',
      description: 'Update an existing contact',
      parameters: {
        type: 'object',
        properties: {
          contact_id: { type: 'string', description: 'Contact ID to update' },
          name: { type: 'string' },
          company: { type: 'string' },
          title: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          contact_type: { type: 'string', enum: ['lead', 'investor', 'referral', 'partner', 'other'] },
          status: { type: 'string', enum: ['lead', 'contacted', 'responded', 'meeting', 'closed-won', 'closed-lost'] },
          notes: { type: 'string', description: 'Replaces existing notes. Append to existing if needed.' },
          last_contacted: { type: 'string', description: 'YYYY-MM-DD' },
        },
        required: ['contact_id'],
      },
    },
  },
  // Vault tools
  {
    type: 'function' as const,
    function: {
      name: 'list_vault',
      description: 'List all vault entries (API keys, credentials, links, notes, documents, files)',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: ['api-key', 'credential', 'link', 'note', 'server', 'document', 'file'] },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_vault_entry',
      description: 'Create a new vault entry',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: ['api-key', 'credential', 'link', 'note', 'server', 'document', 'file'] },
          name: { type: 'string' },
          value: { type: 'string', description: 'The value, URL, key, or document content' },
          description: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          hidden: { type: 'boolean', description: 'Whether to blur the value by default' },
        },
        required: ['name', 'category', 'value'],
      },
    },
  },
  // Reminder tools
  {
    type: 'function' as const,
    function: {
      name: 'set_reminder',
      description: 'Set a reminder for a future date',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Reminder title' },
          description: { type: 'string' },
          due_date: { type: 'string', description: 'Due date in YYYY-MM-DD format' },
          related_contact_id: { type: 'string', description: 'Optional contact ID this reminder is about' },
          related_card_id: { type: 'string', description: 'Optional card ID this reminder is about' },
          is_group: { type: 'boolean', description: 'If true, reminder is visible to all team members. Default false (personal).' },
        },
        required: ['title', 'due_date'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_reminders',
      description: 'List upcoming reminders',
      parameters: {
        type: 'object',
        properties: {
          include_completed: { type: 'boolean', description: 'Include completed reminders' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'complete_reminder',
      description: 'Mark a reminder as completed',
      parameters: {
        type: 'object',
        properties: {
          reminder_id: { type: 'string' },
        },
        required: ['reminder_id'],
      },
    },
  },
  // Board summary
  {
    type: 'function' as const,
    function: {
      name: 'board_summary',
      description: 'Returns a comprehensive board overview: total cards, cards per column, overdue items, blocked items, cards by priority, and cards by assignee.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  // Search everything
  {
    type: 'function' as const,
    function: {
      name: 'search_everything',
      description: 'Search across cards, contacts, vault entries, and reminders. Returns grouped results with type labels.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query string' },
        },
        required: ['query'],
      },
    },
  },
  // Vault update
  {
    type: 'function' as const,
    function: {
      name: 'update_vault_entry',
      description: 'Update an existing vault entry',
      parameters: {
        type: 'object',
        properties: {
          entry_id: { type: 'string', description: 'Vault entry ID to update' },
          name: { type: 'string' },
          value: { type: 'string' },
          description: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          category: { type: 'string', enum: ['api-key', 'credential', 'link', 'note', 'server', 'document', 'file'] },
          hidden: { type: 'boolean' },
        },
        required: ['entry_id'],
      },
    },
  },
  // Vault delete
  {
    type: 'function' as const,
    function: {
      name: 'delete_vault_entry',
      description: 'Delete a vault entry',
      parameters: {
        type: 'object',
        properties: {
          entry_id: { type: 'string', description: 'Vault entry ID to delete' },
        },
        required: ['entry_id'],
      },
    },
  },
  // Activity list
  {
    type: 'function' as const,
    function: {
      name: 'list_activity',
      description: 'Returns the last 20 activity entries. Useful for seeing what happened recently.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  // Move card by column name
  {
    type: 'function' as const,
    function: {
      name: 'move_card',
      description: 'Move a card to a different column by column name (human-readable title, not ID)',
      parameters: {
        type: 'object',
        properties: {
          card_id: { type: 'string', description: 'Card ID to move' },
          target_column_name: { type: 'string', description: 'Target column title (e.g. "In Progress", "Done")' },
        },
        required: ['card_id', 'target_column_name'],
      },
    },
  },
  // Draft outreach message context
  {
    type: 'function' as const,
    function: {
      name: 'draft_outreach_message',
      description: 'Fetches contact details and context so the AI can draft an outreach message. Returns contact info for message composition.',
      parameters: {
        type: 'object',
        properties: {
          contact_id: { type: 'string', description: 'Contact ID to draft message for' },
          message_type: { type: 'string', enum: ['follow-up', 'introduction', 'meeting-request', 'thank-you'], description: 'Type of message to draft' },
        },
        required: ['contact_id', 'message_type'],
      },
    },
  },
];

// ── Tool Execution ──

export async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  try {
    switch (name) {
      case 'list_board': return await listBoard();
      case 'create_card': return await createCard(args);
      case 'update_card': return await updateCard(args);
      case 'list_team_members': return await listTeamMembers();
      case 'list_contacts': return await listContacts(args);
      case 'create_contact': return await createContact(args);
      case 'update_contact': return await updateContact(args);
      case 'list_vault': return await listVault(args);
      case 'create_vault_entry': return await createVaultEntry(args);
      case 'set_reminder': return await setReminder(args);
      case 'list_reminders': return await listReminders(args);
      case 'complete_reminder': return await completeReminder(args);
      case 'board_summary': return await boardSummary();
      case 'search_everything': return await searchEverything(args);
      case 'update_vault_entry': return await updateVaultEntry(args);
      case 'delete_vault_entry': return await deleteVaultEntry(args);
      case 'list_activity': return await listActivity();
      case 'move_card': return await moveCard(args);
      case 'draft_outreach_message': return await draftOutreachMessage(args);
      default: return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err) {
    return JSON.stringify({ error: String(err) });
  }
}

// ── Tool Implementations ──

async function listBoard() {
  const { data: boards } = await supabase.from('boards').select('*').order('updated_at', { ascending: false }).limit(1).single();
  if (!boards) return JSON.stringify({ error: 'No board found' });

  const { data: columns } = await supabase.from('columns').select('*').eq('board_id', boards.id).order('position');
  const colIds = (columns || []).map(c => c.id);
  const { data: cards } = colIds.length > 0
    ? await supabase.from('cards').select('*').in('column_id', colIds).order('position')
    : { data: [] };

  const board = {
    id: boards.id,
    name: boards.name,
    columns: (columns || []).map(col => ({
      id: col.id,
      title: col.title,
      cards: (cards || []).filter(c => c.column_id === col.id).map(c => ({
        id: c.id, title: c.title, description: c.description, priority: c.priority,
        assignees: c.assignees, due_date: c.due_date, estimated_hours: c.estimated_hours,
        archived: c.archived, checklist_count: (c.checklist || []).length,
      })),
    })),
  };
  return JSON.stringify(board);
}

async function createCard(args: Record<string, unknown>) {
  const now = new Date().toISOString();
  const id = uuidv4();
  const { data: maxPos } = await supabase.from('cards').select('position').eq('column_id', args.column_id).order('position', { ascending: false }).limit(1);
  const position = maxPos && maxPos.length > 0 ? (maxPos[0].position + 1) : 0;

  const { error } = await supabase.from('cards').insert({
    id,
    column_id: args.column_id,
    title: args.title,
    description: args.description || '',
    priority: args.priority || 'medium',
    assignees: args.assignees || [],
    estimated_hours: args.estimated_hours || null,
    due_date: args.due_date || null,
    labels: [], checklist: [], comments: [], attachments: [], dependencies: [], external_dependencies: [],
    archived: false, position,
    created_at: now, updated_at: now,
  });
  if (error) return JSON.stringify({ error: error.message });

  // Log activity
  await supabase.from('activity_entries').insert({
    action: 'created', card_title: args.title as string, author: 'AI Assistant',
  });

  return JSON.stringify({ success: true, card_id: id });
}

async function updateCard(args: Record<string, unknown>) {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (args.title !== undefined) updates.title = args.title;
  if (args.description !== undefined) updates.description = args.description;
  if (args.priority !== undefined) updates.priority = args.priority;
  if (args.assignees !== undefined) updates.assignees = args.assignees;
  if (args.estimated_hours !== undefined) updates.estimated_hours = args.estimated_hours;
  if (args.due_date !== undefined) updates.due_date = args.due_date;
  if (args.archived !== undefined) updates.archived = args.archived;
  if (args.column_id !== undefined) updates.column_id = args.column_id;

  const { error } = await supabase.from('cards').update(updates).eq('id', args.card_id);
  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ success: true });
}

async function listTeamMembers() {
  const { data } = await supabase.from('team_members').select('*');
  return JSON.stringify(data || []);
}

async function listContacts(args: Record<string, unknown>) {
  let query = supabase.from('contacts').select('*').order('updated_at', { ascending: false });
  if (args.status) query = query.eq('status', args.status);
  if (args.contact_type) query = query.eq('contact_type', args.contact_type);
  const { data } = await query;
  return JSON.stringify(data || []);
}

async function createContact(args: Record<string, unknown>) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const { error } = await supabase.from('contacts').insert({
    id,
    name: args.name,
    company: args.company || '',
    title: args.title || '',
    email: args.email || '',
    phone: args.phone || '',
    contact_type: args.contact_type || 'lead',
    status: args.status || 'lead',
    source: args.source || '',
    notes: args.notes || '',
    tags: args.tags || [],
    last_contacted: args.status && args.status !== 'lead' ? now : null,
    created_at: now, updated_at: now,
  });
  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ success: true, contact_id: id });
}

async function updateContact(args: Record<string, unknown>) {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (args.name !== undefined) updates.name = args.name;
  if (args.company !== undefined) updates.company = args.company;
  if (args.title !== undefined) updates.title = args.title;
  if (args.email !== undefined) updates.email = args.email;
  if (args.phone !== undefined) updates.phone = args.phone;
  if (args.contact_type !== undefined) updates.contact_type = args.contact_type;
  if (args.status !== undefined) updates.status = args.status;
  if (args.notes !== undefined) updates.notes = args.notes;
  if (args.last_contacted !== undefined) updates.last_contacted = args.last_contacted;

  const { error } = await supabase.from('contacts').update(updates).eq('id', args.contact_id);
  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ success: true });
}

async function listVault(args: Record<string, unknown>) {
  let query = supabase.from('vault_entries').select('*').order('created_at', { ascending: false });
  if (args.category) query = query.eq('category', args.category);
  const { data } = await query;
  // Mask hidden values
  const safe = (data || []).map(e => ({
    ...e,
    value: e.hidden ? '[HIDDEN]' : e.value,
  }));
  return JSON.stringify(safe);
}

async function createVaultEntry(args: Record<string, unknown>) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const { error } = await supabase.from('vault_entries').insert({
    id,
    category: args.category,
    name: args.name,
    value: args.value,
    description: args.description || '',
    tags: args.tags || [],
    hidden: args.hidden ?? (args.category === 'api-key' || args.category === 'credential'),
    created_at: now, updated_at: now,
  });
  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ success: true, entry_id: id });
}

async function setReminder(args: Record<string, unknown>) {
  const id = uuidv4();
  const { error } = await supabase.from('reminders').insert({
    id,
    title: args.title,
    description: args.description || '',
    due_date: args.due_date,
    related_contact_id: args.related_contact_id || null,
    related_card_id: args.related_card_id || null,
    user_id: args._userId || null,
    is_group: args.is_group || false,
  });
  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ success: true, reminder_id: id });
}

async function listReminders(args: Record<string, unknown>) {
  let query = supabase.from('reminders').select('*').order('due_date');
  if (!args.include_completed) query = query.eq('completed', false);
  const { data } = await query;
  return JSON.stringify(data || []);
}

async function completeReminder(args: Record<string, unknown>) {
  const { error } = await supabase.from('reminders').update({ completed: true }).eq('id', args.reminder_id);
  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ success: true });
}

async function boardSummary() {
  // Fetch board, columns, cards, and team members in parallel
  const { data: boards } = await supabase.from('boards').select('*').order('updated_at', { ascending: false }).limit(1).single();
  if (!boards) return JSON.stringify({ error: 'No board found' });

  const [{ data: columns }, { data: teamMembers }] = await Promise.all([
    supabase.from('columns').select('*').eq('board_id', boards.id).order('position'),
    supabase.from('team_members').select('*'),
  ]);

  const colIds = (columns || []).map(c => c.id);
  const { data: cards } = colIds.length > 0
    ? await supabase.from('cards').select('*').in('column_id', colIds).order('position')
    : { data: [] };

  const allCards = cards || [];
  const allColumns = columns || [];
  const members = teamMembers || [];

  // Find the "Done" column (case-insensitive)
  const doneColumn = allColumns.find(c => c.title.toLowerCase() === 'done');
  const doneColId = doneColumn?.id;

  // Active cards = not archived and not in Done
  const activeCards = allCards.filter(c => !c.archived && c.column_id !== doneColId);

  // Cards per column
  const cardsPerColumn: Record<string, number> = {};
  for (const col of allColumns) {
    cardsPerColumn[col.title] = allCards.filter(c => c.column_id === col.id && !c.archived).length;
  }

  // Overdue cards (due_date < now and not in Done and not archived)
  const now = new Date();
  const overdueCards = activeCards.filter(c => {
    if (!c.due_date) return false;
    return new Date(c.due_date) < now;
  }).map(c => ({ id: c.id, title: c.title, due_date: c.due_date, priority: c.priority }));

  // Blocked cards (has dependencies that are not completed / not in Done)
  const cardById = new Map(allCards.map(c => [c.id, c]));
  const blockedCards = activeCards.filter(c => {
    const deps = c.dependencies || [];
    if (deps.length === 0) return false;
    return deps.some((depId: string) => {
      const dep = cardById.get(depId);
      // Blocked if dependency doesn't exist, is not archived, or is not in Done
      return !dep || (dep.column_id !== doneColId && !dep.archived);
    });
  }).map(c => ({ id: c.id, title: c.title, blocking_deps: c.dependencies }));

  // By priority
  const byPriority: Record<string, number> = {};
  for (const c of activeCards) {
    const p = c.priority || 'none';
    byPriority[p] = (byPriority[p] || 0) + 1;
  }

  // By assignee
  const byAssignee: Record<string, number> = {};
  const memberMap = new Map(members.map(m => [m.id, m.name]));
  for (const c of activeCards) {
    const assignees = c.assignees || [];
    if (assignees.length === 0) {
      byAssignee['Unassigned'] = (byAssignee['Unassigned'] || 0) + 1;
    } else {
      for (const aid of assignees as string[]) {
        const name = memberMap.get(aid) || aid;
        byAssignee[name] = (byAssignee[name] || 0) + 1;
      }
    }
  }

  const summary = {
    board_name: boards.name,
    total_active_cards: activeCards.length,
    total_all_cards: allCards.filter(c => !c.archived).length,
    cards_per_column: cardsPerColumn,
    overdue_cards: overdueCards,
    overdue_count: overdueCards.length,
    blocked_cards: blockedCards,
    blocked_count: blockedCards.length,
    by_priority: byPriority,
    by_assignee: byAssignee,
  };

  return JSON.stringify(summary);
}

async function searchEverything(args: Record<string, unknown>) {
  const query = args.query as string;
  const pattern = `%${query}%`;

  const [cardsRes, contactsRes, vaultRes, remindersRes] = await Promise.all([
    supabase.from('cards').select('id, title, description, priority, column_id, due_date')
      .or(`title.ilike.${pattern},description.ilike.${pattern}`),
    supabase.from('contacts').select('id, name, company, email, notes')
      .or(`name.ilike.${pattern},company.ilike.${pattern},email.ilike.${pattern},notes.ilike.${pattern}`),
    supabase.from('vault_entries').select('id, name, description, value, hidden, category')
      .or(`name.ilike.${pattern},description.ilike.${pattern},value.ilike.${pattern}`),
    supabase.from('reminders').select('id, title, description, due_date, completed')
      .or(`title.ilike.${pattern},description.ilike.${pattern}`),
  ]);

  // Mask hidden vault values
  const vaultResults = (vaultRes.data || []).map(e => ({
    ...e,
    value: e.hidden ? '[HIDDEN]' : e.value,
  }));

  const results = {
    cards: cardsRes.data || [],
    contacts: contactsRes.data || [],
    vault_entries: vaultResults,
    reminders: remindersRes.data || [],
    total_results: (cardsRes.data?.length || 0) + (contactsRes.data?.length || 0) + (vaultRes.data?.length || 0) + (remindersRes.data?.length || 0),
  };

  return JSON.stringify(results);
}

async function updateVaultEntry(args: Record<string, unknown>) {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (args.name !== undefined) updates.name = args.name;
  if (args.value !== undefined) updates.value = args.value;
  if (args.description !== undefined) updates.description = args.description;
  if (args.tags !== undefined) updates.tags = args.tags;
  if (args.category !== undefined) updates.category = args.category;
  if (args.hidden !== undefined) updates.hidden = args.hidden;

  const { error } = await supabase.from('vault_entries').update(updates).eq('id', args.entry_id);
  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ success: true });
}

async function deleteVaultEntry(args: Record<string, unknown>) {
  const { error } = await supabase.from('vault_entries').delete().eq('id', args.entry_id);
  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ success: true });
}

async function listActivity() {
  const { data, error } = await supabase.from('activity_entries').select('*').order('created_at', { ascending: false }).limit(20);
  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify(data || []);
}

async function moveCard(args: Record<string, unknown>) {
  const cardId = args.card_id as string;
  const targetName = args.target_column_name as string;

  // Look up the column by title (case-insensitive)
  const { data: columns } = await supabase.from('columns').select('*');
  const targetCol = (columns || []).find(c => c.title.toLowerCase() === targetName.toLowerCase());
  if (!targetCol) {
    const available = (columns || []).map(c => c.title).join(', ');
    return JSON.stringify({ error: `Column "${targetName}" not found. Available columns: ${available}` });
  }

  // Get the card title for activity logging
  const { data: card } = await supabase.from('cards').select('title, column_id').eq('id', cardId).single();
  if (!card) return JSON.stringify({ error: 'Card not found' });

  // Find the source column name
  const sourceCol = (columns || []).find(c => c.id === card.column_id);
  const sourceName = sourceCol?.title || 'Unknown';

  // Get max position in target column
  const { data: maxPos } = await supabase.from('cards').select('position').eq('column_id', targetCol.id).order('position', { ascending: false }).limit(1);
  const position = maxPos && maxPos.length > 0 ? (maxPos[0].position + 1) : 0;

  // Move the card
  const { error } = await supabase.from('cards').update({
    column_id: targetCol.id,
    position,
    updated_at: new Date().toISOString(),
  }).eq('id', cardId);
  if (error) return JSON.stringify({ error: error.message });

  // Log activity
  await supabase.from('activity_entries').insert({
    action: 'moved',
    card_title: card.title,
    details: `Moved from "${sourceName}" to "${targetCol.title}"`,
    author: 'AI Assistant',
  });

  return JSON.stringify({ success: true, moved_from: sourceName, moved_to: targetCol.title });
}

async function draftOutreachMessage(args: Record<string, unknown>) {
  const contactId = args.contact_id as string;
  const messageType = args.message_type as string;

  const { data: contact, error } = await supabase.from('contacts').select('*').eq('id', contactId).single();
  if (error || !contact) return JSON.stringify({ error: 'Contact not found' });

  // Also fetch any related reminders for context
  const { data: reminders } = await supabase.from('reminders').select('*').eq('related_contact_id', contactId).eq('completed', false);

  // Fetch recent activity mentioning this contact's name
  const { data: activity } = await supabase.from('activity_entries').select('*')
    .ilike('card_title', `%${contact.name}%`)
    .order('created_at', { ascending: false }).limit(5);

  return JSON.stringify({
    message_type: messageType,
    contact: {
      name: contact.name,
      company: contact.company,
      title: contact.title,
      email: contact.email,
      phone: contact.phone,
      contact_type: contact.contact_type,
      status: contact.status,
      source: contact.source,
      notes: contact.notes,
      tags: contact.tags,
      last_contacted: contact.last_contacted,
      created_at: contact.created_at,
    },
    upcoming_reminders: reminders || [],
    recent_activity: activity || [],
    instruction: `Use the above contact details and context to draft a ${messageType} message. Be professional and personalized based on the available information.`,
  });
}
