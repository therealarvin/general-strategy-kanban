'use client';

import { DEFAULT_LABELS, PRIORITY_CONFIG, TeamMember } from '@/types';
import { Filter, X } from 'lucide-react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

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
      <Select
        value={filters.priority || null}
        onValueChange={(value) => onChange({ ...filters, priority: value ?? '' })}
      >
        <SelectTrigger
          size="sm"
          className={cn(
            'text-xs bg-ink/5 dark:bg-dark-card border-ink/10 dark:border-dark-border',
            'rounded-card focus-visible:border-brass'
          )}
        >
          <SelectValue placeholder="All Priorities" />
        </SelectTrigger>
        <SelectContent
          className="bg-canvas dark:bg-dark-card border-ink/10 dark:border-dark-border"
        >
          <SelectItem value={null as unknown as string}>All Priorities</SelectItem>
          {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
            <SelectItem key={key} value={key}>{config.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Label */}
      <Select
        value={filters.label || null}
        onValueChange={(value) => onChange({ ...filters, label: value ?? '' })}
      >
        <SelectTrigger
          size="sm"
          className={cn(
            'text-xs bg-ink/5 dark:bg-dark-card border-ink/10 dark:border-dark-border',
            'rounded-card focus-visible:border-brass'
          )}
        >
          <SelectValue placeholder="All Labels" />
        </SelectTrigger>
        <SelectContent
          className="bg-canvas dark:bg-dark-card border-ink/10 dark:border-dark-border"
        >
          <SelectItem value={null as unknown as string}>All Labels</SelectItem>
          {DEFAULT_LABELS.map(label => (
            <SelectItem key={label.id} value={label.id}>{label.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Assignee */}
      <Select
        value={filters.assignee || null}
        onValueChange={(value) => onChange({ ...filters, assignee: value ?? '' })}
      >
        <SelectTrigger
          size="sm"
          className={cn(
            'text-xs bg-ink/5 dark:bg-dark-card border-ink/10 dark:border-dark-border',
            'rounded-card focus-visible:border-brass'
          )}
        >
          <SelectValue placeholder="All Assignees" />
        </SelectTrigger>
        <SelectContent
          className="bg-canvas dark:bg-dark-card border-ink/10 dark:border-dark-border"
        >
          <SelectItem value={null as unknown as string}>All Assignees</SelectItem>
          {members.map(m => (
            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Show Archived */}
      <Label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer font-normal">
        <Checkbox
          checked={filters.showArchived}
          onCheckedChange={(checked) => onChange({ ...filters, showArchived: checked === true })}
          className="data-checked:bg-brass data-checked:border-brass"
        />
        Show Archived
      </Label>

      {/* Clear */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onChange({ search: filters.search, priority: '', label: '', assignee: '', showArchived: false })}
          className="text-brass hover:text-ink dark:hover:text-canvas gap-1"
        >
          <X size={12} /> Clear
        </Button>
      )}
    </div>
  );
}
