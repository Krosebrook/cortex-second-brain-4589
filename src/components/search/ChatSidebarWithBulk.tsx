import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Chat } from '@/types/chat';
import { PlusCircle, Edit3, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { groupChatsByDate } from '@/utils/chatUtils';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useRangeSelection } from '@/hooks/useRangeSelection';
import { BulkActionBar } from '@/components/feedback/BulkActionBar';
import { ExportDialog } from '@/components/feedback/ExportDialog';
import { exportToJSON, exportToCSV, exportToPDF, ExportFormat, getExportFilename } from '@/utils/exportUtils';
import { enhancedToast } from '@/components/feedback/EnhancedToast';

interface ChatSidebarWithBulkProps {
  chats: Chat[];
  activeChat: Chat | null;
  setActiveChat: (chat: Chat) => void;
  createNewChat: () => void;
  deleteChat: (chatId: string, e: React.MouseEvent) => void;
  deleteBulkChats: (chatIds: string[]) => void;
  showSidebar: boolean;
  isEditingTitle: string | null;
  editTitle: string;
  setEditTitle: (title: string) => void;
  startEditingTitle: (chatId: string, e: React.MouseEvent) => void;
  saveTitle: (chatId: string) => void;
}

const ChatSidebarWithBulk: React.FC<ChatSidebarWithBulkProps> = ({
  chats,
  activeChat,
  setActiveChat,
  createNewChat,
  deleteChat,
  deleteBulkChats,
  showSidebar,
  isEditingTitle,
  editTitle,
  setEditTitle,
  startEditingTitle,
  saveTitle
}) => {
  const {
    selectedIds,
    selectedCount,
    isMultiSelectMode,
    toggleSelect,
    selectAll,
    selectRange,
    clearSelection,
    isSelected,
  } = useMultiSelect<string>();

  const [searchQuery, setSearchQuery] = useState('');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const { handleClick, resetLastClicked } = useRangeSelection<string>();

  // Filter chats based on search
  const filteredChats = useMemo(() => {
    if (!searchQuery) return chats;
    const query = searchQuery.toLowerCase();
    return chats.filter(chat => chat.title.toLowerCase().includes(query));
  }, [chats, searchQuery]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'a',
      ctrlKey: true,
      callback: (e) => {
        e.preventDefault();
        if (filteredChats.length > 0) {
          selectAll(filteredChats.map(chat => chat.id));
          enhancedToast.info('All Selected', `${filteredChats.length} chats selected`);
        }
      },
    },
    {
      key: 'Escape',
      callback: () => {
        if (isMultiSelectMode) {
          clearSelection();
          resetLastClicked();
          enhancedToast.info('Selection Cleared', 'Multi-select mode deactivated');
        }
      },
    },
    {
      key: 'Delete',
      callback: () => {
        if (selectedCount > 0) {
          handleBulkDelete();
        }
      },
    },
  ], { enabled: showSidebar });

  const handleBulkDelete = () => {
    deleteBulkChats(selectedIds);
    clearSelection();
    resetLastClicked();
  };

  const handleChatClick = (chat: Chat, index: number, e: React.MouseEvent) => {
    if (isMultiSelectMode) {
      handleClick(
        index,
        chat.id,
        e.shiftKey,
        filteredChats.map(c => c.id),
        isSelected,
        toggleSelect,
        selectRange
      );
    } else {
      setActiveChat(chat);
    }
  };

  const handleExport = (format: ExportFormat) => {
    const chatsToExport = selectedCount > 0
      ? chats.filter(chat => selectedIds.includes(chat.id))
      : filteredChats;

    const exportData = chatsToExport.map(chat => ({
      id: chat.id,
      title: chat.title,
      created_at: chat.createdAt.toISOString(),
      updated_at: chat.updatedAt.toISOString(),
      content: chat.messages.map(m => `${m.type}: ${m.content}`).join('\n\n'),
      message_count: chat.messages.length,
    }));

    const filename = getExportFilename('chats', format);

    try {
      if (format === 'json') {
        exportToJSON(exportData, filename);
      } else if (format === 'csv') {
        exportToCSV(exportData, filename);
      } else if (format === 'pdf') {
        exportToPDF(exportData, filename, 'Chat History Export');
      }
      enhancedToast.success('Export Successful', `Exported ${exportData.length} chats as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      enhancedToast.error('Export Failed', 'Failed to export chats');
    }
  };

  return (
    <>
      <div className={cn(
        "h-full bg-muted/30 border-r transition-all duration-300",
        showSidebar ? "w-64" : "w-0 overflow-hidden"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-3 space-y-2">
            <Button 
              onClick={createNewChat}
              className="w-full justify-start gap-2"
              variant="outline"
              disabled={isMultiSelectMode}
            >
              <PlusCircle size={16} />
              New Chat
            </Button>
            
            {/* Search bar */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-8"
                disabled={isMultiSelectMode}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {!isMultiSelectMode && filteredChats.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Enter multi-select mode
                  toggleSelect(filteredChats[0].id);
                  clearSelection();
                }}
                className="w-full justify-start text-xs"
              >
                Select Multiple
              </Button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-4">
            {filteredChats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center p-4">
                {searchQuery ? 'No chats found' : 'No chats yet'}
              </p>
            ) : (
              groupChatsByDate(filteredChats).map(([dateGroup, dateChats]) => (
                <div key={dateGroup} className="space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground px-2">{dateGroup}</h3>
                  
                  {dateChats.map((chat, index) => {
                    const selected = isSelected(chat.id);
                    const globalIndex = filteredChats.findIndex(c => c.id === chat.id);
                    
                    return (
                      <div 
                        key={chat.id}
                        onClick={(e) => handleChatClick(chat, globalIndex, e)}
                        className={cn(
                          "p-2 rounded-lg flex items-center gap-2 cursor-pointer group",
                          activeChat?.id === chat.id && !isMultiSelectMode
                            ? "bg-primary/10 text-primary" 
                            : "hover:bg-muted/50",
                          selected && "ring-2 ring-primary"
                        )}
                      >
                        {isMultiSelectMode && (
                          <Checkbox
                            checked={!!selected}
                            onCheckedChange={() => toggleSelect(chat.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        
                        {isEditingTitle === chat.id ? (
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => saveTitle(chat.id)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                saveTitle(chat.id);
                              }
                            }}
                            className="h-7 text-sm"
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        ) : (
                          <>
                            <span className="flex-1 text-sm truncate">{chat.title}</span>
                            {!isMultiSelectMode && (
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => startEditingTitle(chat.id, e)}
                                >
                                  <Edit3 size={12} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => deleteChat(chat.id, e)}
                                >
                                  <Trash2 size={12} />
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <BulkActionBar
        selectedCount={selectedCount}
        onDelete={handleBulkDelete}
        onExport={() => setExportDialogOpen(true)}
        onCancel={() => {
          clearSelection();
          resetLastClicked();
        }}
      />

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExport={handleExport}
        itemCount={selectedCount > 0 ? selectedCount : filteredChats.length}
        itemType="chats"
      />
    </>
  );
};

export default ChatSidebarWithBulk;
