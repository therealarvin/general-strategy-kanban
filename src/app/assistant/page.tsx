'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { loadTheme, saveTheme } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { Bot, Send, Loader2, Trash2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { exportBoardAsJSON } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const theme = loadTheme();
    setDarkMode(theme === 'dark');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleDark = useCallback(() => {
    const next = !darkMode;
    setDarkMode(next);
    saveTheme(next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  }, [darkMode]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (data.error) {
        setMessages([...newMessages, { role: 'assistant', content: `Error: ${data.error}` }]);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: data.content }]);
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Failed to reach the AI. Check your API key and try again.' }]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar
        darkMode={darkMode}
        onToggleDark={toggleDark}
        onExport={() => exportBoardAsJSON({ messages })}
        onSearch={() => {}}
      />

      <main className="ml-56 flex flex-col h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-6 h-14 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold">Assistant</h2>
            </div>
            <span className="text-xs text-muted-foreground">
              Manages your board, outreach, vault, and reminders
            </span>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => setMessages([])}
            >
              <Trash2 size={14} /> Clear
            </Button>
          )}
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <Bot size={28} className="text-accent" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">GS Assistant</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                I can manage your kanban board, outreach contacts, vault, and reminders. Try something like:
              </p>
              <div className="grid grid-cols-1 gap-2 max-w-lg w-full">
                {[
                  'I just talked to Sarah Chen from Acme Corp about a partnership. Need to follow up on the 15th.',
                  'Create a high priority task for the website redesign, assign it to Arvin, due next Friday',
                  'Show me all contacts we haven\'t responded to yet',
                  'What are our upcoming reminders?',
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(suggestion); textareaRef.current?.focus(); }}
                    className="text-left text-xs px-4 py-3 rounded-lg border border-border bg-card hover:border-accent/50 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.map((msg, i) => (
                <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot size={14} className="text-accent" />
                    </div>
                  )}
                  <div className={cn(
                    'rounded-xl px-4 py-3 max-w-[80%] text-sm whitespace-pre-wrap',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border'
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot size={14} className="text-accent" />
                  </div>
                  <div className="bg-card border border-border rounded-xl px-4 py-3 text-sm">
                    <Loader2 size={16} className="animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border px-6 py-3 flex-shrink-0">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Tell the assistant what to do..."
              rows={1}
              className="resize-none min-h-[40px] max-h-[120px]"
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="self-end"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
