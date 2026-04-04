'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Columns3, Shield, BarChart3, Activity,
  Settings, ChevronLeft, ChevronRight, Moon, Sun, Search,
  Download, Users
} from 'lucide-react';

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

export default function Sidebar({ darkMode, onToggleDark, onExport, onSearch }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full z-40 flex flex-col
        border-r transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-56'}
        bg-canvas dark:bg-dark
        border-ink/10 dark:border-dark-border
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-ink/10 dark:border-dark-border">
        <div className="w-8 h-8 rounded-full bg-ink dark:bg-canvas flex items-center justify-center flex-shrink-0">
          <span className="text-canvas dark:text-ink font-serif text-sm font-semibold">GS</span>
        </div>
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <h1 className="font-serif text-sm font-semibold tracking-tight truncate">General Strategy</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-brass font-semibold">Command Center</p>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="px-3 py-3">
        <button
          onClick={onSearch}
          className={`
            w-full flex items-center gap-2 rounded-card text-sm
            bg-ink/5 dark:bg-dark-card hover:bg-ink/10 dark:hover:bg-dark-border
            transition-colors
            ${collapsed ? 'justify-center p-2' : 'px-3 py-2'}
          `}
        >
          <Search size={16} className="text-muted flex-shrink-0" />
          {!collapsed && <span className="text-muted">Search... ⌘K</span>}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map(item => {
          const isActive = item.href === '/'
            ? pathname === '/' && !item.href.includes('view=')
            : pathname === item.href || (item.href.includes('view=') && typeof window !== 'undefined' && window.location.search.includes(item.href.split('?')[1]));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`
                flex items-center gap-3 rounded-card text-sm font-medium
                transition-all duration-200
                ${collapsed ? 'justify-center p-2' : 'px-3 py-2'}
                ${isActive
                  ? 'bg-ink text-canvas dark:bg-canvas dark:text-ink'
                  : 'text-muted hover:text-ink hover:bg-ink/5 dark:hover:text-canvas dark:hover:bg-dark-card'
                }
              `}
            >
              <item.icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-3 space-y-1 border-t border-ink/10 dark:border-dark-border">
        <button
          onClick={onToggleDark}
          className={`
            w-full flex items-center gap-3 rounded-card text-sm font-medium
            text-muted hover:text-ink hover:bg-ink/5 dark:hover:text-canvas dark:hover:bg-dark-card
            transition-colors
            ${collapsed ? 'justify-center p-2' : 'px-3 py-2'}
          `}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        <button
          onClick={onExport}
          className={`
            w-full flex items-center gap-3 rounded-card text-sm font-medium
            text-muted hover:text-ink hover:bg-ink/5 dark:hover:text-canvas dark:hover:bg-dark-card
            transition-colors
            ${collapsed ? 'justify-center p-2' : 'px-3 py-2'}
          `}
        >
          <Download size={18} />
          {!collapsed && <span>Export Backup</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`
            w-full flex items-center gap-3 rounded-card text-sm font-medium
            text-muted hover:text-ink hover:bg-ink/5 dark:hover:text-canvas dark:hover:bg-dark-card
            transition-colors
            ${collapsed ? 'justify-center p-2' : 'px-3 py-2'}
          `}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
