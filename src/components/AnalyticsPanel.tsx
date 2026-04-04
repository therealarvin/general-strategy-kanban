'use client';

import { Column, PRIORITY_CONFIG } from '@/types';
import { getBoardStats } from '@/lib/utils';
import { BarChart3, AlertTriangle, Clock, CheckSquare, TrendingUp } from 'lucide-react';

interface AnalyticsPanelProps {
  columns: Column[];
}

export default function AnalyticsPanel({ columns }: AnalyticsPanelProps) {
  const stats = getBoardStats(columns);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={20} className="text-brass" />
        <h2 className="font-serif text-xl font-semibold">Board Analytics</h2>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Cards" value={stats.totalCards} icon={<BarChart3 size={16} />} />
        <StatCard label="Overdue" value={stats.overdue} icon={<AlertTriangle size={16} />} variant={stats.overdue > 0 ? 'danger' : 'default'} />
        <StatCard label="Due Soon" value={stats.dueSoon} icon={<Clock size={16} />} variant={stats.dueSoon > 0 ? 'warning' : 'default'} />
        <StatCard
          label="Checklist Done"
          value={stats.totalChecklist > 0 ? `${Math.round((stats.doneChecklist / stats.totalChecklist) * 100)}%` : 'N/A'}
          icon={<CheckSquare size={16} />}
        />
      </div>

      {/* Column distribution */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-brass">Cards by Column</h3>
        <div className="space-y-2">
          {stats.byColumn.map(col => {
            const percent = stats.totalCards > 0 ? (col.count / stats.totalCards) * 100 : 0;
            return (
              <div key={col.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{col.name}</span>
                  <span className="text-muted">{col.count}</span>
                </div>
                <div className="w-full h-2 bg-ink/10 dark:bg-dark-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brass rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Priority breakdown */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-brass">Priority Breakdown</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(stats.byPriority).map(([key, count]) => {
            const config = PRIORITY_CONFIG[key as keyof typeof PRIORITY_CONFIG];
            return (
              <div
                key={key}
                className="flex items-center gap-3 p-3 rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-card"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                  style={{ background: config.color }}
                >
                  {config.icon}
                </div>
                <div>
                  <p className="text-lg font-serif font-semibold">{count}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted">{config.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Velocity hint */}
      <div className="p-4 rounded-card border border-brass/30 bg-brass/5">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={14} className="text-brass" />
          <span className="text-xs font-semibold uppercase tracking-wider text-brass">Insight</span>
        </div>
        <p className="text-sm text-muted">
          {stats.overdue > 0
            ? `You have ${stats.overdue} overdue card${stats.overdue > 1 ? 's' : ''}. Consider re-prioritizing or moving them to the backlog.`
            : stats.totalCards === 0
            ? 'Your board is empty. Add some cards to get started.'
            : `Looking good! ${stats.byColumn.find(c => c.name === 'Done')?.count || 0} cards completed.`
          }
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, variant = 'default' }: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  variant?: 'default' | 'danger' | 'warning';
}) {
  const colors = {
    default: 'border-ink/10 dark:border-dark-border',
    danger: 'border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10',
    warning: 'border-yellow-200 dark:border-yellow-900/30 bg-yellow-50/50 dark:bg-yellow-950/10',
  };

  return (
    <div className={`p-4 rounded-card border bg-white dark:bg-dark-card ${colors[variant]}`}>
      <div className="flex items-center gap-2 mb-2 text-muted">{icon}<span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span></div>
      <p className="text-2xl font-serif font-semibold">{value}</p>
    </div>
  );
}
