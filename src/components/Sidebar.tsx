'use client';

import { useState, Suspense } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import {
  Columns3, Shield, BarChart3, Activity,
  ChevronLeft, ChevronRight, Moon, Sun, Search,
  Download, Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  darkMode: boolean;
  onToggleDark: () => void;
  onExport: () => void;
  onSearch: () => void;
}

const NAV_ITEMS = [
  { href: '/', icon: Columns3, label: 'Board' },
  { href: '/vault', icon: Shield, label: 'Vault' },
  { href: '/?view=analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/?view=activity', icon: Activity, label: 'Activity' },
  { href: '/?view=team', icon: Users, label: 'Team' },
];

export default function Sidebar(props: SidebarProps) {
  return (
    <Suspense>
      <SidebarInner {...props} />
    </Suspense>
  );
}

function NavItemWithTooltip({
  collapsed,
  label,
  children,
}: {
  collapsed: boolean;
  label: string;
  children: React.ReactNode;
}) {
  if (!collapsed) return <>{children}</>;

  return (
    <Tooltip>
      <TooltipTrigger render={(props) => <div {...props}>{children}</div>} />
      <TooltipContent side="right" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function SidebarInner({ darkMode, onToggleDark, onExport, onSearch }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view');
  const router = useRouter();

  return (
    <TooltipProvider delay={300}>
      <aside
        className={cn(
          'fixed left-0 top-0 h-full z-40 flex flex-col',
          'border-r transition-all duration-300 ease-in-out',
          'bg-background',
          'border-border',
          collapsed ? 'w-16' : 'w-56'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-serif text-sm font-semibold">GS</span>
          </div>
          {!collapsed && (
            <div className="animate-fade-in overflow-hidden">
              <h1 className="font-serif text-sm font-semibold tracking-tight truncate">General Strategy</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-brass font-semibold">Command Center</p>
            </div>
          )}
        </div>

        <Separator className="bg-border" />

        {/* Search */}
        <div className="px-3 py-3">
          <NavItemWithTooltip collapsed={collapsed} label="Search (⌘K)">
            <Button
              variant="ghost"
              onClick={onSearch}
              className={cn(
                'w-full bg-muted',
                'hover:bg-muted/80',
                'text-muted-foreground',
                collapsed ? 'justify-center' : 'justify-start gap-2'
              )}
              size={collapsed ? 'icon' : 'default'}
            >
              <Search size={16} className="flex-shrink-0" />
              {!collapsed && <span className="text-sm font-normal">Search... ⌘K</span>}
            </Button>
          </NavItemWithTooltip>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map(item => {
            const itemView = item.href.includes('view=') ? item.href.split('view=')[1] : null;
            const isActive = item.href === '/vault'
              ? pathname === '/vault'
              : itemView
                ? pathname === '/' && currentView === itemView
                : pathname === '/' && !currentView;

            return (
              <NavItemWithTooltip key={item.label} collapsed={collapsed} label={item.label}>
                <Button
                  variant="ghost"
                  size={collapsed ? 'icon' : 'default'}
                  className={cn(
                    'w-full rounded-card',
                    collapsed ? 'justify-center' : 'justify-start gap-3',
                    isActive
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                  onClick={() => router.push(item.href)}
                >
                  <item.icon size={18} className="flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Button>
              </NavItemWithTooltip>
            );
          })}
        </nav>

        <Separator className="bg-border" />

        {/* Bottom actions */}
        <div className="px-3 py-3 space-y-1">
          <NavItemWithTooltip collapsed={collapsed} label={darkMode ? 'Light Mode' : 'Dark Mode'}>
            <Button
              variant="ghost"
              size={collapsed ? 'icon' : 'default'}
              onClick={onToggleDark}
              className={cn(
                'w-full rounded-card',
                collapsed ? 'justify-center' : 'justify-start gap-3',
                'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              {!collapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
            </Button>
          </NavItemWithTooltip>

          <NavItemWithTooltip collapsed={collapsed} label="Export Backup">
            <Button
              variant="ghost"
              size={collapsed ? 'icon' : 'default'}
              onClick={onExport}
              className={cn(
                'w-full rounded-card',
                collapsed ? 'justify-center' : 'justify-start gap-3',
                'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Download size={18} />
              {!collapsed && <span>Export Backup</span>}
            </Button>
          </NavItemWithTooltip>

          <NavItemWithTooltip collapsed={collapsed} label={collapsed ? 'Expand' : 'Collapse'}>
            <Button
              variant="ghost"
              size={collapsed ? 'icon' : 'default'}
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                'w-full rounded-card',
                collapsed ? 'justify-center' : 'justify-start gap-3',
                'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              {!collapsed && <span>Collapse</span>}
            </Button>
          </NavItemWithTooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
