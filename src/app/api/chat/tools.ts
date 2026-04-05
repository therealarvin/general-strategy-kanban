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
