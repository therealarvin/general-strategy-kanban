'use client';

import { ActivityEntry } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import { Activity, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface ActivityPanelProps {
  entries: ActivityEntry[];
  onClear: () => void;
}

export default function ActivityPanel({ entries, onClear }: ActivityPanelProps) {
  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-brass" />
          <h2 className="font-serif text-xl font-semibold">Activity Log</h2>
          <span className="text-xs text-muted-foreground/60">({entries.length})</span>
        </div>
        {entries.length > 0 && (
          <Button
            variant="ghost"
            size="xs"
            onClick={onClear}
            className="text-muted-foreground hover:text-red-500"
          >
            <Trash2 size={12} /> Clear
          </Button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="py-12 text-center">
          <Activity size={32} className="text-muted-foreground/60 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No activity yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Actions on the board will appear here</p>
        </div>
      ) : (
        <Card className="bg-card ring-border py-0">
          <CardContent className="px-4 py-0">
            {entries.slice(0, 50).map((entry, i) => (
              <div key={entry.id}>
                <div
                  className="flex items-start gap-3 py-3 animate-slide-in"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="w-6 h-6 rounded-full bg-brass/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[9px] text-brass font-bold">{entry.author.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{entry.author}</span>{' '}
                      <span className="text-muted-foreground">{entry.action}</span>
                      {entry.cardTitle && (
                        <span className="font-medium"> &ldquo;{entry.cardTitle}&rdquo;</span>
                      )}
                      {entry.columnTitle && (
                        <span className="text-muted-foreground"> in {entry.columnTitle}</span>
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{formatRelativeTime(entry.timestamp)}</p>
                  </div>
                </div>
                {i < entries.slice(0, 50).length - 1 && (
                  <Separator className="bg-border" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
