'use client';

import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Board, Card, Column, TeamMember, ActivityEntry } from '@/types';
import { loadBoard, saveBoard, loadMembers, saveMembers, loadTheme, saveTheme, loadActivity, saveActivity, addActivity } from '@/lib/storage';
import { filterCards, exportBoardAsJSON } from '@/lib/utils';
import KanbanColumn from '@/components/KanbanColumn';
import CardModal from '@/components/CardModal';
import SearchModal from '@/components/SearchModal';
import FilterBar from '@/components/FilterBar';
import AnalyticsPanel from '@/components/AnalyticsPanel';
import ActivityPanel from '@/components/ActivityPanel';
import TeamPanel from '@/components/TeamPanel';
import Sidebar from '@/components/Sidebar';
import { Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function BoardContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view');

  const [board, setBoard] = useState<Board | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedCard, setSelectedCard] = useState<{ card: Card; columnId: string } | null>(null);
  const [activityEntries, setActivityEntries] = useState<ActivityEntry[]>([]);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    priority: '',
    label: '',
    assignee: '',
    showArchived: false,
  });

  // Load data
  useEffect(() => {
    async function init() {
      try {
        const b = await loadBoard();
        const [m, a] = await Promise.all([loadMembers(), loadActivity()]);
        setBoard(b);
        setMembers(m);
        setActivityEntries(a);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
      const theme = loadTheme();
      setDarkMode(theme === 'dark');
      if (theme === 'dark') document.documentElement.classList.add('dark');
    }
    init();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setSelectedCard(null);
      }
      if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setAddingColumn(true);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const updateBoard = useCallback((updated: Board) => {
    setBoard(updated);
    saveBoard(updated).catch(console.error);
  }, []);

  const toggleDark = useCallback(() => {
    const next = !darkMode;
    setDarkMode(next);
    saveTheme(next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  }, [darkMode]);

  async function refreshActivity() {
    const entries = await loadActivity();
    setActivityEntries(entries);
  }

  // Drag & drop
  function onDragEnd(result: DropResult) {
    if (!board || !result.destination) return;

    const { source, destination } = result;
    const columns = [...board.columns];

    const srcCol = columns.find(c => c.id === source.droppableId);
    const destCol = columns.find(c => c.id === destination.droppableId);
    if (!srcCol || !destCol) return;

    const srcCards = [...srcCol.cards];
    const [moved] = srcCards.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      srcCards.splice(destination.index, 0, moved);
      srcCol.cards = srcCards;
    } else {
      const destCards = [...destCol.cards];
      destCards.splice(destination.index, 0, moved);
      srcCol.cards = srcCards;
      destCol.cards = destCards;
      addActivity('moved', moved.title, `${srcCol.title} → ${destCol.title}`).then(refreshActivity);
    }

    updateBoard({ ...board, columns });
  }

  // Card operations
  function handleAddCard(columnId: string, card: Card) {
    if (!board) return;
    const columns = board.columns.map(col =>
      col.id === columnId ? { ...col, cards: [...col.cards, card] } : col
    );
    updateBoard({ ...board, columns });
    addActivity('created', card.title, board.columns.find(c => c.id === columnId)?.title).then(refreshActivity);
  }

  function handleUpdateCard(updatedCard: Card) {
    if (!board || !selectedCard) return;
    const columns = board.columns.map(col =>
      col.id === selectedCard.columnId
        ? { ...col, cards: col.cards.map(c => c.id === updatedCard.id ? updatedCard : c) }
        : col
    );
    updateBoard({ ...board, columns });
    setSelectedCard({ ...selectedCard, card: updatedCard });
    addActivity('updated', updatedCard.title).then(refreshActivity);
  }

  function handleDeleteCard() {
    if (!board || !selectedCard) return;
    const columns = board.columns.map(col =>
      col.id === selectedCard.columnId
        ? { ...col, cards: col.cards.filter(c => c.id !== selectedCard.card.id) }
        : col
    );
    updateBoard({ ...board, columns });
    addActivity('deleted', selectedCard.card.title).then(refreshActivity);
    setSelectedCard(null);
  }

  // Column operations
  function handleAddColumn() {
    if (!board || !newColumnTitle.trim()) return;
    const newCol: Column = { id: uuidv4(), title: newColumnTitle.trim(), cards: [] };
    updateBoard({ ...board, columns: [...board.columns, newCol] });
    addActivity('created column', newColumnTitle.trim()).then(refreshActivity);
    setNewColumnTitle('');
    setAddingColumn(false);
  }

  function handleDeleteColumn(columnId: string) {
    if (!board) return;
    const col = board.columns.find(c => c.id === columnId);
    updateBoard({ ...board, columns: board.columns.filter(c => c.id !== columnId) });
    addActivity('deleted column', col?.title).then(refreshActivity);
  }

  function handleRenameColumn(columnId: string, name: string) {
    if (!board) return;
    const columns = board.columns.map(c => c.id === columnId ? { ...c, title: name } : c);
    updateBoard({ ...board, columns });
  }

  function handleUpdateMembers(updated: TeamMember[]) {
    setMembers(updated);
    saveMembers(updated).catch(console.error);
  }

  if (!board) return (
    <div className="min-h-screen flex items-center justify-center bg-canvas dark:bg-dark">
      <div className="text-center animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-ink dark:bg-canvas flex items-center justify-center mx-auto mb-3">
          <span className="text-canvas dark:text-ink font-serif text-lg font-semibold">GS</span>
        </div>
        <p className="text-sm text-muted">Loading...</p>
      </div>
    </div>
  );

  // Side panel views
  const showPanel = view === 'analytics' || view === 'activity' || view === 'team';

  return (
    <div className="min-h-screen bg-canvas dark:bg-dark text-ink dark:text-canvas">
      <Sidebar
        darkMode={darkMode}
        onToggleDark={toggleDark}
        onExport={() => exportBoardAsJSON(board)}
        onSearch={() => setShowSearch(true)}
      />

      <main className="ml-56 flex flex-col h-screen">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 h-14 border-b border-ink/10 dark:border-dark-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-lg font-semibold">{board.name}</h2>
            <div className="w-12 h-[2px] bg-brass" />
            <span className="text-xs text-muted">
              {board.columns.reduce((sum, c) => sum + c.cards.filter(cd => !cd.archived).length, 0)} cards
            </span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="text-[10px] text-faint bg-ink/5 dark:bg-dark-card px-2 py-1 rounded hidden sm:inline">⌘K search</kbd>
            <kbd className="text-[10px] text-faint bg-ink/5 dark:bg-dark-card px-2 py-1 rounded hidden sm:inline">⌘N column</kbd>
          </div>
        </header>

        {showPanel ? (
          <div className="flex-1 overflow-y-auto">
            {view === 'analytics' && <AnalyticsPanel columns={board.columns} />}
            {view === 'activity' && (
              <ActivityPanel
                entries={activityEntries}
                onClear={() => { saveActivity([]).catch(console.error); setActivityEntries([]); }}
              />
            )}
            {view === 'team' && (
              <TeamPanel
                members={members}
                columns={board.columns}
                onUpdateMembers={handleUpdateMembers}
              />
            )}
          </div>
        ) : (
          <>
            {/* Filter bar */}
            <div className="px-6 py-3 border-b border-ink/5 dark:border-dark-border/50 flex-shrink-0">
              <FilterBar filters={filters} members={members} onChange={setFilters} />
            </div>

            {/* Kanban board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
              <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-4 p-6 h-full items-start">
                  {board.columns.map(column => {
                    const filtered = filterCards(column.cards, filters);
                    return (
                      <KanbanColumn
                        key={column.id}
                        column={column}
                        members={members}
                        filteredCards={filtered}
                        onAddCard={handleAddCard}
                        onCardClick={(card, colId) => setSelectedCard({ card, columnId: colId })}
                        onDeleteColumn={handleDeleteColumn}
                        onRenameColumn={handleRenameColumn}
                      />
                    );
                  })}

                  {/* Add column */}
                  <div className="flex-shrink-0 w-72">
                    {addingColumn ? (
                      <div className="p-3 bg-white dark:bg-dark-card border border-ink/10 dark:border-dark-border rounded-card space-y-2 animate-fade-in">
                        <input
                          autoFocus
                          value={newColumnTitle}
                          onChange={e => setNewColumnTitle(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleAddColumn();
                            if (e.key === 'Escape') { setAddingColumn(false); setNewColumnTitle(''); }
                          }}
                          placeholder="Column title..."
                          className="w-full text-sm bg-transparent focus:outline-none"
                        />
                        <div className="flex gap-1.5">
                          <button
                            onClick={handleAddColumn}
                            className="px-3 py-1 bg-ink text-canvas dark:bg-canvas dark:text-ink rounded text-xs font-medium hover:opacity-80"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => { setAddingColumn(false); setNewColumnTitle(''); }}
                            className="px-3 py-1 text-xs text-muted"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingColumn(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-card border border-dashed border-ink/20 dark:border-dark-border text-sm text-muted hover:text-ink dark:hover:text-canvas hover:border-brass/50 transition-colors"
                      >
                        <Plus size={16} /> Add Column
                      </button>
                    )}
                  </div>
                </div>
              </DragDropContext>
            </div>
          </>
        )}
      </main>

      {/* Modals */}
      {showSearch && (
        <SearchModal
          columns={board.columns}
          onSelectCard={(card, columnId) => setSelectedCard({ card, columnId })}
          onClose={() => setShowSearch(false)}
        />
      )}

      {selectedCard && (
        <CardModal
          card={selectedCard.card}
          members={members}
          onUpdate={handleUpdateCard}
          onDelete={handleDeleteCard}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-canvas dark:bg-dark">
        <p className="text-sm text-muted">Loading...</p>
      </div>
    }>
      <BoardContent />
    </Suspense>
  );
}
