'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Bot, Send, Loader2, Trash2, Plus, MessageSquare, Paperclip, X } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import AuthGuard, { useUserProfile } from '@/components/AuthGuard';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { loadTheme, saveTheme } from '@/lib/storage';
import { exportBoardAsJSON } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}

export default function AssistantPage() {
  return (
    <AuthGuard>
      <AssistantContent />
    </AuthGuard>
  );
}

function AssistantContent() {
  const { user } = useAuth();
  const profile = useUserProfile();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; url: string; content?: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    loadConversations();
    const theme = loadTheme();
    setDarkMode(theme === 'dark');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadConversations() {
    const { data } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', user!.id)
      .order('updated_at', { ascending: false });
    setConversations((data || []).map(c => ({
      id: c.id, title: c.title, updatedAt: c.updated_at,
    })));
  }

  async function loadMessages(convId: string) {
    setActiveConvId(convId);
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at');
    setMessages((data || []).map(m => ({
      id: m.id, role: m.role, content: m.content,
    })));
  }

  async function createConversation() {
    const id = uuidv4();
    await supabase.from('chat_conversations').insert({
      id, user_id: user!.id, title: 'New Chat',
    });
    setActiveConvId(id);
    setMessages([]);
    loadConversations();
  }

  async function deleteConversation(convId: string) {
    await supabase.from('chat_messages').delete().eq('conversation_id', convId);
    await supabase.from('chat_conversations').delete().eq('id', convId);
    if (activeConvId === convId) {
      setActiveConvId(null);
      setMessages([]);
    }
    loadConversations();
  }

  const TEXT_EXTENSIONS = ['.txt', '.md', '.csv', '.json'];

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.substring(file.name.lastIndexOf('.'));
      const filePath = `${user.id}/${uuidv4()}${ext}`;
      const { error } = await supabase.storage.from('vault-files').upload(filePath, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('vault-files').getPublicUrl(filePath);
      const fileUrl = urlData.publicUrl;

      let content: string | undefined;
      if (TEXT_EXTENSIONS.includes(ext.toLowerCase())) {
        content = await file.text();
      }

      setAttachedFile({ name: file.name, url: fileUrl, content });
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function sendMessage() {
    if ((!input.trim() && !attachedFile) || loading || !user) return;

    let convId = activeConvId;
    if (!convId) {
      convId = uuidv4();
      await supabase.from('chat_conversations').insert({
        id: convId, user_id: user.id, title: input.trim().slice(0, 50),
      });
      setActiveConvId(convId);
    }

    let messageText = input.trim();
    if (attachedFile) {
      if (attachedFile.content) {
        messageText += `\n\n[Attached file: ${attachedFile.name}]\nURL: ${attachedFile.url}\n\nFile contents:\n${attachedFile.content}`;
      } else {
        messageText += `\n\n[Attached file: ${attachedFile.name}]\nURL: ${attachedFile.url}`;
      }
    }

    const userMsg: Message = { id: uuidv4(), role: 'user', content: messageText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setAttachedFile(null);
    setLoading(true);

    // Save user message
    await supabase.from('chat_messages').insert({
      id: userMsg.id, role: 'user', content: userMsg.content,
      conversation_id: convId, user_id: user.id,
    });

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          userId: user.id,
          teamMemberId: profile.teamMemberId,
          teamMemberName: profile.displayName,
        }),
      });

      const data = await res.json();
      const assistantContent = data.error ? `Error: ${data.error}` : data.content;
      const assistantMsg: Message = { id: uuidv4(), role: 'assistant', content: assistantContent };
      setMessages([...newMessages, assistantMsg]);

      // Save assistant message
      await supabase.from('chat_messages').insert({
        id: assistantMsg.id, role: 'assistant', content: assistantContent,
        conversation_id: convId, user_id: user.id,
      });

      // Update conversation title from first message
      if (newMessages.length === 1) {
        await supabase.from('chat_conversations').update({
          title: input.trim().slice(0, 50), updated_at: new Date().toISOString(),
        }).eq('id', convId);
      } else {
        await supabase.from('chat_conversations').update({
          updated_at: new Date().toISOString(),
        }).eq('id', convId);
      }
      loadConversations();
    } catch {
      const errorMsg: Message = { id: uuidv4(), role: 'assistant', content: 'Failed to reach the AI. Check your API key.' };
      setMessages([...newMessages, errorMsg]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  function toggleDark() {
    const next = !darkMode;
    setDarkMode(next);
    saveTheme(next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar darkMode={darkMode} onToggleDark={toggleDark} onExport={() => exportBoardAsJSON({ conversations })} onSearch={() => {}} />

      <main className="ml-56 flex h-screen">
        {/* Conversation sidebar */}
        <div className="w-56 border-r border-border flex flex-col bg-card flex-shrink-0">
          <div className="p-3 border-b border-border">
            <Button size="sm" className="w-full" onClick={createConversation}>
              <Plus size={14} /> New Chat
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map(conv => (
              <div
                key={conv.id}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-xs cursor-pointer border-b border-border/50 hover:bg-muted transition-colors group',
                  activeConvId === conv.id && 'bg-muted'
                )}
                onClick={() => loadMessages(conv.id)}
              >
                <MessageSquare size={12} className="text-muted-foreground flex-shrink-0" />
                <span className="flex-1 truncate">{conv.title}</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  onClick={e => { e.stopPropagation(); deleteConversation(conv.id); }}
                >
                  <Trash2 size={10} />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          <header className="flex items-center gap-3 px-6 h-14 border-b border-border flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold">Assistant</h2>
            </div>
            <span className="text-xs text-muted-foreground">
              Board, outreach, vault, and reminders
            </span>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <Bot size={28} className="text-accent" />
                </div>
                <h3 className="font-serif text-xl font-semibold mb-2">GS Assistant</h3>
                <p className="text-sm text-muted-foreground max-w-md mb-6">
                  I can manage your kanban board, outreach contacts, vault, and reminders.
                </p>
                <div className="grid grid-cols-1 gap-2 max-w-lg w-full">
                  {[
                    'I just talked to Sarah Chen from Acme Corp about a partnership. Need to follow up on the 15th.',
                    'Create a high priority task for the website redesign, assign it to Arvin, due next Friday',
                    'Show me all contacts we haven\'t responded to yet',
                    'Set a reminder to review proposals next Monday',
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
                {messages.map((msg) => (
                  <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot size={14} className="text-accent" />
                      </div>
                    )}
                    <div className={cn(
                      'rounded-xl px-4 py-3 max-w-[80%] text-sm whitespace-pre-wrap',
                      msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'
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

          <div className="border-t border-border px-6 py-3 flex-shrink-0">
            <div className="max-w-3xl mx-auto">
              {attachedFile && (
                <div className="mb-2 flex items-center gap-1">
                  <span className="inline-flex items-center gap-1 text-xs bg-muted border border-border rounded-full px-2.5 py-1 text-muted-foreground">
                    <Paperclip size={10} />
                    {attachedFile.name}
                    <button
                      onClick={() => setAttachedFile(null)}
                      className="ml-0.5 hover:text-foreground transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </span>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="self-end flex-shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                </Button>
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                  }}
                  placeholder="Tell the assistant what to do..."
                  rows={1}
                  className="resize-none min-h-[40px] max-h-[120px]"
                />
                <Button onClick={sendMessage} disabled={loading || (!input.trim() && !attachedFile)} className="self-end">
                  <Send size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
