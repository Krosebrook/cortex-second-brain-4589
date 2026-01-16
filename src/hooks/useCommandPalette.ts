import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Command, CommandGroup } from '@/types/command';
import {
  Home,
  MessageSquare,
  Upload,
  User,
  Settings,
  Plus,
  Trash2,
  Download,
  X,
} from 'lucide-react';

interface UseCommandPaletteOptions {
  onCreateNewChat?: () => void;
  onImport?: () => void;
  onExport?: () => void;
  onDelete?: () => void;
  onClearSelection?: () => void;
  hasSelection?: boolean;
  isMultiSelectMode?: boolean;
}

export const useCommandPalette = (options: UseCommandPaletteOptions = {}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Load recent commands from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentCommands');
    if (stored) {
      setRecentCommands(JSON.parse(stored));
    }
  }, []);

  const recordCommand = useCallback((commandId: string) => {
    setRecentCommands((prev) => {
      const updated = [commandId, ...prev.filter((id) => id !== commandId)].slice(0, 5);
      localStorage.setItem('recentCommands', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const commands = useMemo((): Command[] => {
    const baseCommands: Command[] = [
      // Navigation
      {
        id: 'nav-home',
        label: 'Go to Home',
        description: 'Navigate to landing page',
        icon: Home,
        category: 'navigation',
        keywords: ['home', 'landing', 'index'],
        action: () => navigate('/'),
        visible: location.pathname !== '/',
      },
      {
        id: 'nav-search',
        label: 'Go to Search',
        description: 'Navigate to chat search',
        icon: MessageSquare,
        category: 'navigation',
        keywords: ['search', 'chat', 'tessa'],
        action: () => navigate('/search'),
        visible: location.pathname !== '/search',
      },
      {
        id: 'nav-import',
        label: 'Go to Import',
        description: 'Navigate to knowledge import',
        icon: Upload,
        category: 'navigation',
        keywords: ['import', 'knowledge', 'upload'],
        action: () => navigate('/import'),
        visible: location.pathname !== '/import',
      },
      {
        id: 'nav-profile',
        label: 'Go to Profile',
        description: 'Navigate to your profile',
        icon: User,
        category: 'navigation',
        keywords: ['profile', 'account', 'user'],
        action: () => navigate('/profile'),
        visible: location.pathname !== '/profile',
      },
      {
        id: 'nav-settings',
        label: 'Go to Settings',
        description: 'Navigate to settings',
        icon: Settings,
        category: 'navigation',
        keywords: ['settings', 'preferences', 'config'],
        action: () => navigate('/settings'),
        visible: location.pathname !== '/settings',
      },

      // Actions
      {
        id: 'action-new-chat',
        label: 'Create New Chat',
        description: 'Start a new conversation with Tessa',
        icon: Plus,
        category: 'action',
        keywords: ['new', 'chat', 'create', 'conversation'],
        shortcut: 'Ctrl+N',
        action: () => options.onCreateNewChat?.(),
        visible: location.pathname === '/search' && !!options.onCreateNewChat,
      },
      {
        id: 'action-import',
        label: 'Import Knowledge',
        description: 'Add new items to knowledge base',
        icon: Upload,
        category: 'action',
        keywords: ['import', 'add', 'upload', 'knowledge'],
        action: () => {
          if (options.onImport) {
            options.onImport();
          } else {
            navigate('/import');
          }
        },
      },
      {
        id: 'action-export',
        label: 'Export Selected',
        description: 'Export selected items',
        icon: Download,
        category: 'action',
        keywords: ['export', 'download', 'save'],
        action: () => options.onExport?.(),
        visible: options.hasSelection,
      },
      {
        id: 'action-delete',
        label: 'Delete Selected',
        description: 'Delete selected items',
        icon: Trash2,
        category: 'action',
        keywords: ['delete', 'remove', 'trash'],
        shortcut: 'Delete',
        action: () => options.onDelete?.(),
        visible: options.hasSelection,
      },
      {
        id: 'action-clear',
        label: 'Clear Selection',
        description: 'Deselect all items',
        icon: X,
        category: 'action',
        keywords: ['clear', 'deselect', 'cancel'],
        shortcut: 'Esc',
        action: () => options.onClearSelection?.(),
        visible: options.isMultiSelectMode,
      },
    ];

    return baseCommands.filter((cmd) => cmd.visible !== false);
  }, [navigate, location.pathname, options]);

  // Group commands by category
  const commandGroups = useMemo((): CommandGroup[] => {
    const groups = new Map<string, Command[]>();
    
    commands.forEach((cmd) => {
      const existing = groups.get(cmd.category) || [];
      groups.set(cmd.category, [...existing, cmd]);
    });

    return Array.from(groups.entries()).map(([category, cmds]) => ({
      category,
      commands: cmds,
    }));
  }, [commands]);

  // Fuzzy search
  const filteredCommands = useMemo(() => {
    if (!search.trim()) {
      // Show recent commands first
      const recent = commands.filter((cmd) => recentCommands.includes(cmd.id));
      const others = commands.filter((cmd) => !recentCommands.includes(cmd.id));
      return [...recent, ...others];
    }

    const query = search.toLowerCase();
    return commands
      .map((cmd) => {
        const labelMatch = cmd.label.toLowerCase().includes(query);
        const keywordMatch = cmd.keywords.some((k) => k.toLowerCase().includes(query));
        const descMatch = cmd.description?.toLowerCase().includes(query);

        const score = labelMatch ? 10 : keywordMatch ? 5 : descMatch ? 3 : 0;

        return { cmd, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ cmd }) => cmd);
  }, [search, commands, recentCommands]);

  const executeCommand = useCallback(
    (command: Command) => {
      recordCommand(command.id);
      command.action();
      setOpen(false);
      setSearch('');
    },
    [recordCommand]
  );

  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
    if (open) {
      setSearch('');
    }
  }, [open]);

  return {
    open,
    setOpen,
    toggle,
    search,
    setSearch,
    commands,
    commandGroups,
    filteredCommands,
    executeCommand,
  };
};
