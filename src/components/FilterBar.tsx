'use client';

import { DEFAULT_LABELS, PRIORITY_CONFIG, TeamMember } from '@/types';
import { Filter, X } from 'lucide-react';

interface Filters {
  search: string;
  priority: string;
  label: string;
  assignee: string;
  showArchived: boolean;
}

interface FilterBarProps {
  filters: Filters;
  members: TeamMember[];
  onChange: (filters: Filters) => void;
}

export default function FilterBar({ filters, members, onChange }: FilterBarProps) {
  const hasFilters = filters.priority || filters.label || filters.assignee || filters.showArchived;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5 text-muted">
        <Filter size={14} />
        <span className="text-xs font-medium uppercase tracking-wider">Filters</span>
      </div>

      {/* Priority */}
      <select
        value={filters.priority}
        onChange={e => onChange({ ...filters, priority: e.target.value })}
        className="text-xs bg-ink/5 dark:bg-dark-card border border-ink/10 dark:border-dark-border rounded-card px-2 py-1.5 focus:outline-none focus:border-brass"
      >
        <option value="">All Priorities</option>
        {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
          <option key={key} value={key}>{config.label}</option>
        ))}
      </select>

      {/* Label */}
      <select
        value={filters.label}
        onChange={e => onChange({ ...filters, label: e.target.value })}
        className="text-xs bg-ink/5 dark:bg-dark-card border border-ink/10 dark:border-dark-border rounded-card px-2 py-1.5 focus:outline-none focus:border-brass"
      >
        <option value="">All Labels</option>
        {DEFAULT_LABELS.map(label => (
          <option key={label.id} value={label.id}>{label.name}</option>
        ))}
      </select>

      {/* Assignee */}
      <select
        value={filters.assignee}
        onChange={e => onChange({ ...filters, assignee: e.target.value })}
        className="text-xs bg-ink/5 dark:bg-dark-card border border-ink/10 dark:border-dark-border rounded-card px-2 py-1.5 focus:outline-none focus:border-brass"
      >
        <option value="">All Assignees</option>
        {members.map(m => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>

      {/* Show archived */}
      <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer">
        <input
          type="checkbox"
          checked={filters.showArchived}
          onChange={e => onChange({ ...filters, showArchived: e.target.checked })}
          className="accent-brass"
        />
        Show Archived
      </label>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={() => onChange({ search: filters.search, priority: '', label: '', assignee: '', showArchived: false })}
          className="flex items-center gap-1 text-xs text-brass hover:text-ink dark:hover:text-canvas transition-colors"
        >
          <X size={12} /> Clear
        </button>
      )}
    </div>
  );
}
