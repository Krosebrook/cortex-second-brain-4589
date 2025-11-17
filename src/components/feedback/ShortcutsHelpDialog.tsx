import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShortcutCombo } from '@/components/ui/shortcut-key';
import { Search } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

const shortcuts: Shortcut[] = [
  // Navigation
  { keys: ['↑', '↓'], description: 'Navigate up/down', category: 'Navigation' },
  { keys: ['Home'], description: 'Jump to first item', category: 'Navigation' },
  { keys: ['End'], description: 'Jump to last item', category: 'Navigation' },
  { keys: ['Enter'], description: 'Open selected item', category: 'Navigation' },
  { keys: ['/'], description: 'Focus search', category: 'Navigation' },
  
  // Selection
  { keys: [isMac ? 'Cmd' : 'Ctrl', 'A'], description: 'Select all', category: 'Selection' },
  { keys: ['Shift', 'Click'], description: 'Range select', category: 'Selection' },
  { keys: [isMac ? 'Cmd' : 'Ctrl', 'Click'], description: 'Toggle select', category: 'Selection' },
  { keys: ['Escape'], description: 'Clear selection', category: 'Selection' },
  
  // Actions
  { keys: ['Delete'], description: 'Delete selected items', category: 'Actions' },
  { keys: [isMac ? 'Cmd' : 'Ctrl', 'Z'], description: 'Undo last action', category: 'Actions' },
  { keys: [isMac ? 'Cmd' : 'Ctrl', 'Shift', 'Z'], description: 'Redo last action', category: 'Actions' },
  { keys: [isMac ? 'Cmd' : 'Ctrl', 'K'], description: 'Open command palette', category: 'Actions' },
  { keys: [isMac ? 'Cmd' : 'Ctrl', 'S'], description: 'Save current filter', category: 'Actions' },
  
  // Help
  { keys: ['?'], description: 'Show keyboard shortcuts', category: 'Help' },
  { keys: [isMac ? 'Cmd' : 'Ctrl', '/'], description: 'Show keyboard shortcuts', category: 'Help' },
];

interface ShortcutsHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShortcutsHelpDialog: React.FC<ShortcutsHelpDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredShortcuts = useMemo(() => {
    if (!searchQuery) return shortcuts;
    
    const query = searchQuery.toLowerCase();
    return shortcuts.filter(
      shortcut =>
        shortcut.description.toLowerCase().includes(query) ||
        shortcut.keys.some(key => key.toLowerCase().includes(query))
    );
  }, [searchQuery]);

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

  return (
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
                      key={index}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
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

          {filteredShortcuts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No shortcuts found matching "{searchQuery}"
            </div>
          )}
        </ScrollArea>

        <div className="pt-4 border-t text-xs text-muted-foreground">
          <p>💡 Tip: Use the command palette ({isMac ? 'Cmd' : 'Ctrl'}+K) for quick access to all features</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
