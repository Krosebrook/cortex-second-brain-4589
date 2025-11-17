import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShortcutCombo } from '@/components/ui/shortcut-key';
import { Search, Printer, FileText } from 'lucide-react';
import { useShortcutTracking } from '@/hooks/useShortcutTracking';
import { ShortcutTester } from './ShortcutTester';
import { ShortcutCheatSheet } from './ShortcutCheatSheet';
import { toast } from '@/hooks/use-toast';

export interface Shortcut {
  id: string;
  keys: string[];
  description: string;
  category: string;
  page?: 'knowledge' | 'chats' | 'dashboard' | 'all';
  requiresSelection?: boolean;
}

const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

const shortcuts: Shortcut[] = [
  // Navigation (all contexts)
  { id: 'nav-up-down', keys: ['↑', '↓'], description: 'Navigate up/down', category: 'Navigation', page: 'all' },
  { id: 'nav-home', keys: ['Home'], description: 'Jump to first item', category: 'Navigation', page: 'all' },
  { id: 'nav-end', keys: ['End'], description: 'Jump to last item', category: 'Navigation', page: 'all' },
  { id: 'nav-enter', keys: ['Enter'], description: 'Open selected item', category: 'Navigation', page: 'all' },
  { id: 'nav-search', keys: ['/'], description: 'Focus search', category: 'Navigation', page: 'all' },
  
  // Selection (all contexts)
  { id: 'select-all', keys: [isMac ? 'Cmd' : 'Ctrl', 'A'], description: 'Select all', category: 'Selection', page: 'all' },
  { id: 'select-range', keys: ['Shift', 'Click'], description: 'Range select', category: 'Selection', page: 'all' },
  { id: 'select-toggle', keys: [isMac ? 'Cmd' : 'Ctrl', 'Click'], description: 'Toggle select', category: 'Selection', page: 'all' },
  { id: 'select-clear', keys: ['Escape'], description: 'Clear selection', category: 'Selection', page: 'all' },
  
  // Actions (context-specific)
  { id: 'action-delete', keys: ['Delete'], description: 'Delete selected items', category: 'Actions', page: 'all', requiresSelection: true },
  { id: 'action-undo', keys: [isMac ? 'Cmd' : 'Ctrl', 'Z'], description: 'Undo last action', category: 'Actions', page: 'all' },
  { id: 'action-redo', keys: [isMac ? 'Cmd' : 'Ctrl', 'Shift', 'Z'], description: 'Redo last action', category: 'Actions', page: 'all' },
  { id: 'action-history', keys: [isMac ? 'Cmd' : 'Ctrl', 'H'], description: 'View action history', category: 'Actions', page: 'all' },
  { id: 'action-command', keys: [isMac ? 'Cmd' : 'Ctrl', 'K'], description: 'Open command palette', category: 'Actions', page: 'all' },
  { id: 'action-save-filter', keys: [isMac ? 'Cmd' : 'Ctrl', 'S'], description: 'Save current filter', category: 'Actions', page: 'knowledge' },
  { id: 'action-tag', keys: ['T'], description: 'Manage tags for selected items', category: 'Actions', page: 'knowledge', requiresSelection: true },
  
  // Help
  { id: 'help-shortcuts', keys: ['?'], description: 'Show keyboard shortcuts', category: 'Help', page: 'all' },
  { id: 'help-shortcuts-alt', keys: [isMac ? 'Cmd' : 'Ctrl', '/'], description: 'Show keyboard shortcuts', category: 'Help', page: 'all' },
];

interface ShortcutsHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: {
    page: 'knowledge' | 'chats' | 'dashboard' | 'all';
    hasSelection: boolean;
    bulkMode: boolean;
  };
}

export const ShortcutsHelpDialog: React.FC<ShortcutsHelpDialogProps> = ({
  open,
  onOpenChange,
  context,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [printMode, setPrintMode] = useState(false);
  const { usageStats, getMostUsed, trackShortcut, resetStats } = useShortcutTracking();

  const contextualShortcuts = useMemo(() => {
    if (!context || activeTab !== 'context') return shortcuts;
    
    return shortcuts.filter(shortcut => {
      if (shortcut.page && shortcut.page !== context.page && shortcut.page !== 'all') {
        return false;
      }
      if (shortcut.requiresSelection && !context.hasSelection) {
        return false;
      }
      return true;
    });
  }, [context, activeTab]);

  const filteredShortcuts = useMemo(() => {
    const baseShortcuts = activeTab === 'context' ? contextualShortcuts : shortcuts;
    
    if (!searchQuery) return baseShortcuts;
    
    const query = searchQuery.toLowerCase();
    return baseShortcuts.filter(
      shortcut =>
        shortcut.description.toLowerCase().includes(query) ||
        shortcut.keys.some(key => key.toLowerCase().includes(query))
    );
  }, [searchQuery, activeTab, contextualShortcuts]);

  const groupedShortcuts = useMemo(() => {
    const groups: Record<string, Shortcut[]> = {};
    filteredShortcuts.forEach(shortcut => {
      if (!groups[shortcut.category]) {
        groups[shortcut.category] = [];
      }
      groups[shortcut.category].push(shortcut);
    });
    return groups;
  }, [filteredShortcuts]);

  const mostUsedShortcuts = useMemo(() => {
    const mostUsed = getMostUsed(10);
    return mostUsed
      .map(({ id, count, lastUsed }) => {
        const shortcut = shortcuts.find(s => s.id === id);
        return shortcut ? { shortcut, count, lastUsed } : null;
      })
      .filter(Boolean) as { shortcut: Shortcut; count: number; lastUsed: number }[];
  }, [getMostUsed, usageStats]);

  const handleExport = (format: 'print' | 'markdown') => {
    if (format === 'print') {
      setPrintMode(true);
      setTimeout(() => {
        window.print();
        setPrintMode(false);
      }, 100);
    } else {
      // Generate markdown
      let markdown = '# Keyboard Shortcuts\n\n';
      Object.entries(groupedShortcuts).forEach(([category, categoryShortcuts]) => {
        markdown += `## ${category}\n\n`;
        categoryShortcuts.forEach(shortcut => {
          const keys = shortcut.keys.join(' + ');
          markdown += `- **${keys}**: ${shortcut.description}\n`;
        });
        markdown += '\n';
      });
      navigator.clipboard.writeText(markdown);
      toast({ title: 'Copied to clipboard', description: 'Shortcuts copied as Markdown' });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>
              Quick reference for all available keyboard shortcuts
            </DialogDescription>
          </DialogHeader>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search shortcuts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="practice">Practice</TabsTrigger>
              <TabsTrigger value="my-shortcuts">My Shortcuts</TabsTrigger>
              <TabsTrigger value="context">Context</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-6">
                  {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                    <div key={category}>
                      <h3 className="text-sm font-semibold mb-3 text-foreground">
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {categoryShortcuts.map((shortcut, index) => (
                          <div
                            key={`${category}-${index}`}
                            className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-accent/50 transition-colors"
                          >
                            <span className="text-sm text-muted-foreground">
                              {shortcut.description}
                            </span>
                            <ShortcutCombo keys={shortcut.keys} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="practice" className="mt-4">
              <ShortcutTester shortcuts={shortcuts} onComplete={() => {}} />
            </TabsContent>

            <TabsContent value="my-shortcuts" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Most Used Shortcuts</h3>
                    {mostUsedShortcuts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No usage data yet. Start using shortcuts to see statistics here.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {mostUsedShortcuts.map(({ shortcut, count }) => (
                          <div
                            key={shortcut.id}
                            className="flex justify-between items-center py-2 px-3 rounded-md hover:bg-accent/50"
                          >
                            <div className="flex items-center gap-3">
                              <ShortcutCombo keys={shortcut.keys} />
                              <span className="text-sm">{shortcut.description}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Used {count} times
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {mostUsedShortcuts.length > 0 && (
                    <Button variant="outline" onClick={resetStats} className="w-full">
                      Reset Statistics
                    </Button>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="context" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                {context ? (
                  <div className="space-y-6">
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">
                        Showing shortcuts for: <strong>{context.page}</strong>
                        {context.hasSelection && ' (with selection)'}
                      </p>
                    </div>
                    {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                      <div key={category}>
                        <h3 className="text-sm font-semibold mb-3 text-foreground">
                          {category}
                        </h3>
                        <div className="space-y-2">
                          {categoryShortcuts.map((shortcut, index) => (
                            <div
                              key={`${category}-${index}`}
                              className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-accent/50 transition-colors"
                            >
                              <span className="text-sm text-muted-foreground">
                                {shortcut.description}
                              </span>
                              <ShortcutCombo keys={shortcut.keys} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No context provided. Switch to "All" tab to see all shortcuts.
                  </p>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => handleExport('print')}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" onClick={() => handleExport('markdown')}>
              <FileText className="mr-2 h-4 w-4" />
              Copy as Markdown
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {printMode && <ShortcutCheatSheet shortcuts={shortcuts} />}
    </>
  );
};
