'use client';

import { useState, useEffect, useCallback } from 'react';
import { loadTheme, saveTheme } from '@/lib/storage';
import { exportBoardAsJSON } from '@/lib/utils';
import { Settings, Plus, Trash2, Shield } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';

const ADMIN_EMAIL = 'ar.jakkamreddy@gmail.com';

export default function SettingsPage() {
  const { user } = useAuth();
  const [allowedEmails, setAllowedEmails] = useState<{ email: string; created_at: string }[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    loadAllowed();
    const theme = loadTheme();
    setDarkMode(theme === 'dark');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  }, []);

  const toggleDark = useCallback(() => {
    const next = !darkMode;
    setDarkMode(next);
    saveTheme(next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  }, [darkMode]);

  async function loadAllowed() {
    const { data } = await supabase.from('allowed_users').select('*').order('created_at');
    setAllowedEmails(data || []);
  }

  async function addEmail() {
    if (!newEmail.trim() || !isAdmin) return;
    const email = newEmail.trim().toLowerCase();
    const { error } = await supabase.from('allowed_users').insert({ email, added_by: user!.email });
    if (error) {
      setError(error.message.includes('duplicate') ? 'Email already added' : error.message);
      return;
    }
    setNewEmail('');
    setError(null);
    loadAllowed();
  }

  async function removeEmail(email: string) {
    if (!isAdmin || email === ADMIN_EMAIL) return;
    await supabase.from('allowed_users').delete().eq('email', email);
    loadAllowed();
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Sidebar darkMode={darkMode} onToggleDark={toggleDark} onExport={() => exportBoardAsJSON({})} onSearch={() => {}} />
        <main className="ml-56 p-6">
          <div className="py-16 text-center">
            <Shield size={40} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Only admins can access settings</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar darkMode={darkMode} onToggleDark={toggleDark} onExport={() => exportBoardAsJSON({})} onSearch={() => {}} />

      <main className="ml-56 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <Settings size={20} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold">Settings</h1>
            <p className="text-xs text-muted-foreground">Manage access and configuration</p>
          </div>
        </div>

        {/* Allowed Users */}
        <Card className="max-w-xl">
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Shield size={14} className="text-accent" /> Allowed Users
            </h3>
            <p className="text-xs text-muted-foreground">Only these email addresses can sign in.</p>

            <div className="flex gap-2">
              <Input
                value={newEmail}
                onChange={e => { setNewEmail(e.target.value); setError(null); }}
                onKeyDown={e => e.key === 'Enter' && addEmail()}
                placeholder="new-user@email.com"
                className="flex-1"
              />
              <Button onClick={addEmail} disabled={!newEmail.trim()}>
                <Plus size={14} /> Add
              </Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}

            <div className="space-y-1">
              {allowedEmails.map(entry => (
                <div key={entry.email} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted text-sm">
                  <div className="flex items-center gap-2">
                    <span>{entry.email}</span>
                    {entry.email === ADMIN_EMAIL && (
                      <Badge variant="outline" className="text-[9px] text-accent border-accent">admin</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{formatRelativeTime(entry.created_at)}</span>
                    {entry.email !== ADMIN_EMAIL && (
                      <Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-destructive" onClick={() => removeEmail(entry.email)}>
                        <Trash2 size={12} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
