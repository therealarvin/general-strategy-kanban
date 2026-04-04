import { Board, Column, Card, VaultEntry, ActivityEntry, TeamMember, DEFAULT_MEMBERS } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const BOARD_KEY = 'gs-kanban-board';
const VAULT_KEY = 'gs-kanban-vault';
const ACTIVITY_KEY = 'gs-kanban-activity';
const MEMBERS_KEY = 'gs-kanban-members';
const THEME_KEY = 'gs-kanban-theme';

// Board
export function loadBoard(): Board {
  if (typeof window === 'undefined') return getDefaultBoard();
  const data = localStorage.getItem(BOARD_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return getDefaultBoard();
    }
  }
  return getDefaultBoard();
}

export function saveBoard(board: Board): void {
  if (typeof window === 'undefined') return;
  board.updatedAt = new Date().toISOString();
  localStorage.setItem(BOARD_KEY, JSON.stringify(board));
}

// Vault
export function loadVault(): VaultEntry[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(VAULT_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  return getSampleVault();
}

export function saveVault(entries: VaultEntry[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VAULT_KEY, JSON.stringify(entries));
}

// Activity
export function loadActivity(): ActivityEntry[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(ACTIVITY_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  return [];
}

export function saveActivity(entries: ActivityEntry[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(entries.slice(0, 200)));
}

export function addActivity(action: string, cardTitle?: string, columnTitle?: string): void {
  const entries = loadActivity();
  entries.unshift({
    id: uuidv4(),
    action,
    cardTitle,
    columnTitle,
    timestamp: new Date().toISOString(),
    author: 'Arvin',
  });
  saveActivity(entries);
}

// Members
export function loadMembers(): TeamMember[] {
  if (typeof window === 'undefined') return DEFAULT_MEMBERS;
  const data = localStorage.getItem(MEMBERS_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return DEFAULT_MEMBERS;
    }
  }
  return DEFAULT_MEMBERS;
}

export function saveMembers(members: TeamMember[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
}

// Theme
export function loadTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'light';
}

export function saveTheme(theme: 'light' | 'dark'): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_KEY, theme);
}

// Default data
function getDefaultBoard(): Board {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    name: 'General Strategy',
    columns: [
      {
        id: 'col-backlog',
        title: 'Backlog',
        cards: [
          createCard('Set up analytics dashboard', 'Implement Vercel Analytics or Plausible on generalstrategy.co', 'low', ['l3', 'l8']),
          createCard('SEO metadata audit', 'Add proper meta tags, OG images, and structured data across all pages', 'medium', ['l3']),
          createCard('Lighthouse API documentation', 'Write comprehensive API docs for the simulation engine endpoints', 'low', ['l6', 'l8']),
        ],
      },
      {
        id: 'col-todo',
        title: 'To Do',
        cards: [
          createCard('Cold email campaign v2', 'Draft new outreach templates targeting supply chain companies', 'high', ['l7']),
          createCard('Agency Platform onboarding flow', 'Build guided setup wizard for new client deployments', 'medium', ['l2']),
        ],
      },
      {
        id: 'col-progress',
        title: 'In Progress',
        cards: [
          createCard('Website performance optimization', 'Reduce LCP below 2.5s, optimize image loading and font delivery', 'high', ['l3']),
        ],
      },
      {
        id: 'col-review',
        title: 'In Review',
        cards: [
          createCard('Client proposal template', 'Standardized proposal deck for PE portfolio company pitches', 'medium', ['l7', 'l5']),
        ],
      },
      {
        id: 'col-done',
        title: 'Done',
        cards: [
          createCard('Fix booking button', 'Calendly integration was broken — fixed routing and embed', 'urgent', ['l1']),
          createCard('Brand guide documentation', 'Complete brand reference with colors, typography, components', 'medium', ['l5', 'l8']),
        ],
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

function createCard(title: string, description: string, priority: Card['priority'], labelIds: string[]): Card {
  const { DEFAULT_LABELS } = require('@/types');
  return {
    id: uuidv4(),
    title,
    description,
    labels: labelIds.map((id: string) => DEFAULT_LABELS.find((l: { id: string }) => l.id === id)!).filter(Boolean),
    assignee: 'm1',
    dueDate: null,
    priority,
    checklist: [],
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    archived: false,
    attachments: [],
  };
}

function getSampleVault(): VaultEntry[] {
  const now = new Date().toISOString();
  return [
    {
      id: uuidv4(),
      category: 'link',
      name: 'GS Website',
      value: 'https://generalstrategy.co',
      description: 'Main marketing website (Namecheap hosting)',
      tags: ['website', 'production'],
      createdAt: now,
      updatedAt: now,
      hidden: false,
    },
    {
      id: uuidv4(),
      category: 'link',
      name: 'GS Documentation',
      value: 'https://ygali04.github.io/general-strategy-docs/',
      description: 'Internal docs site (MkDocs, private repo)',
      tags: ['docs', 'internal'],
      createdAt: now,
      updatedAt: now,
      hidden: false,
    },
    {
      id: uuidv4(),
      category: 'api-key',
      name: 'OpenRouter API Key',
      value: 'sk-or-xxxx-placeholder',
      description: 'Used by Agency Platform for LLM routing',
      tags: ['api', 'llm', 'agency-platform'],
      createdAt: now,
      updatedAt: now,
      hidden: true,
    },
    {
      id: uuidv4(),
      category: 'server',
      name: 'Lighthouse Server',
      value: 'localhost:5000',
      description: 'Flask dev server for simulation engine',
      tags: ['lighthouse', 'dev'],
      createdAt: now,
      updatedAt: now,
      hidden: false,
    },
    {
      id: uuidv4(),
      category: 'credential',
      name: 'Namecheap Account',
      value: 'See 1Password',
      description: 'Domain registrar and hosting for generalstrategy.co',
      tags: ['hosting', 'domain'],
      createdAt: now,
      updatedAt: now,
      hidden: true,
    },
  ];
}
