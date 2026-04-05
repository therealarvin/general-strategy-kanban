'use client';

import { useAuth } from '@/lib/auth';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mx-auto mb-3">
            <span className="text-primary-foreground font-serif text-lg font-semibold">GS</span>
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-sm mx-auto p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
              <span className="text-primary-foreground font-serif text-2xl font-semibold">GS</span>
            </div>
            <h1 className="font-serif text-2xl font-semibold mb-1">General Strategy</h1>
            <p className="text-xs uppercase tracking-[0.2em] text-accent font-semibold">Command Center</p>
          </div>

          {sent ? (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                <Mail size={20} className="text-accent" />
              </div>
              <h2 className="font-semibold">Check your email</h2>
              <p className="text-sm text-muted-foreground">
                We sent a magic link to <strong>{email}</strong>. Click it to sign in.
              </p>
              <Button variant="ghost" size="sm" onClick={() => { setSent(false); setEmail(''); }}>
                Use a different email
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(null); }}
                  onKeyDown={e => e.key === 'Enter' && handleSignIn()}
                  placeholder="your@email.com"
                  className="text-center"
                />
                {error && <p className="text-xs text-destructive text-center">{error}</p>}
              </div>
              <Button
                className="w-full"
                onClick={handleSignIn}
                disabled={submitting || !email.trim()}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                Sign in with Magic Link
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                No password needed. We&apos;ll email you a link to sign in.
              </p>
            </div>
          )}
        </div>
      </div>
    );

    async function handleSignIn() {
      if (!email.trim()) return;
      setSubmitting(true);
      setError(null);
      const { error } = await signIn(email.trim());
      setSubmitting(false);
      if (error) {
        setError(error);
      } else {
        setSent(true);
      }
    }
  }

  return <>{children}</>;
}
