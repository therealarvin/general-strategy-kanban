export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface ActivityEntry {
  id: string;
  action: string;
  cardTitle?: string;
  columnTitle?: string;
  timestamp: string;
  author: string;
}

export interface Card {
  id: string;
  title: string;
  description: string;
  labels: Label[];
  assignee: string;
  dueDate: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  checklist: ChecklistItem[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  coverColor?: string;
  estimatedHours?: number;
  attachments: string[];
  dependencies: string[];
}

export interface Column {
  id: string;
  title: string;
  cards: Card[];
  limit?: number;
  color?: string;
}

export interface Board {
  id: string;
  name: string;
  columns: Column[];
  createdAt: string;
  updatedAt: string;
}

export interface VaultEntry {
  id: string;
  category: 'api-key' | 'credential' | 'link' | 'note' | 'server' | 'document' | 'file';
  name: string;
  value: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  hidden: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  color: string;
  nextActionCardId?: string | null;
}

export const DEFAULT_LABELS: Label[] = [
  { id: 'l1', name: 'Bug', color: '#e74c3c' },
  { id: 'l2', name: 'Feature', color: '#3498db' },
  { id: 'l3', name: 'Enhancement', color: '#2ecc71' },
  { id: 'l4', name: 'Urgent', color: '#e67e22' },
  { id: 'l5', name: 'Design', color: '#9b59b6' },
  { id: 'l6', name: 'Research', color: '#1abc9c' },
  { id: 'l7', name: 'Client Work', color: '#b8a07a' },
  { id: 'l8', name: 'Internal', color: '#777777' },
];

export const DEFAULT_MEMBERS: TeamMember[] = [
  { id: 'm1', name: 'Arvin', initials: 'AJ', color: '#b8a07a' },
  { id: 'm2', name: 'Unassigned', initials: '??', color: '#aaaaaa' },
];

export const PRIORITY_CONFIG = {
  low: { label: 'Low', color: '#2ecc71', icon: 'arrow-down' },
  medium: { label: 'Medium', color: '#f39c12', icon: 'arrow-right' },
  high: { label: 'High', color: '#e67e22', icon: 'arrow-up' },
  urgent: { label: 'Urgent', color: '#e74c3c', icon: 'zap' },
};

export const VAULT_CATEGORIES = {
  'api-key': { label: 'API Key', icon: 'key' },
  'credential': { label: 'Credential', icon: 'lock' },
  'link': { label: 'Link', icon: 'link' },
  'note': { label: 'Note', icon: 'file-text' },
  'server': { label: 'Server', icon: 'server' },
  'document': { label: 'Document', icon: 'file-text' },
  'file': { label: 'File', icon: 'paperclip' },
};
