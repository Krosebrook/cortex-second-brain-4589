import React, { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Chat } from '@/types/chat';
import { PlusCircle, Edit3, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { groupChatsByDate } from '@/utils/chatUtils';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useRangeSelection } from '@/hooks/useRangeSelection';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { BulkActionBar } from '@/components/feedback/BulkActionBar';
import { ExportDialog } from '@/components/feedback/ExportDialog';
import { DragIndicator } from '@/components/ui/drag-indicator';
import { VirtualList } from '@/components/ui/virtual-list';
import { exportToJSON, exportToCSV, exportToPDF, ExportFormat, getExportFilename } from '@/utils/exportUtils';
import { enhancedToast } from '@/components/feedback/EnhancedToast';

interface ChatSidebarWithBulkProps {
  chats: Chat[];
  activeChat: Chat | null;
  setActiveChat: (chat: Chat) => void;
  createNewChat: () => void;
  deleteChat: (chatId: string, e: React.MouseEvent) => void;
  deleteBulkChats: (chatIds: string[]) => void;
  softDeleteBulkChats?: (chatIds: string[]) => Promise<Chat[]>;
  restoreBulkChats?: (chatIds: string[]) => Promise<void>;
  updateChatOrder: (orderedChats: { id: string; order_index: number }[]) => void;
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
  softDeleteBulkChats,
  restoreBulkChats,
  updateChatOrder,
  showSidebar,
  isEditingTitle,
  editTitle,
  setEditTitle,
  startEditingTitle,
  saveTitle
}) => {
  const { selectedIds, selectedCount, isMultiSelectMode, toggleSelect, selectAll, clearSelection, isSelected } = useMultiSelect<string>();
  const [searchQuery, setSearchQuery] = useState('');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const { handleClick, resetLastClicked } = useRangeSelection<string>();
  const { addAction, undo, redo, canUndo, canRedo } = useUndoRedo();

  const filteredChats = useMemo(() => {
    if (!searchQuery) return chats;
    const query = searchQuery.toLowerCase();
    return chats.filter(chat => chat.title.toLowerCase().includes(query));
  }, [chats, searchQuery]);

  const { draggedId, dragOverId, handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd } = useDragAndDrop({
    items: filteredChats,
    onReorder: async (reorderedChats) => {
      const updates = reorderedChats.map((chat, idx) => ({ id: chat.id, order_index: idx }));
      await updateChatOrder(updates);
    },
    getId: (chat) => chat.id,
    disabled: isMultiSelectMode,
  });

  const { focusedIndex, setItemRef, handleArrowDown, handleArrowUp, handleHome, handleEnd, handleEnter } = useKeyboardNavigation({
    items: filteredChats,
    onSelect: () => {},
    onActivate: (index) => { setActiveChat(filteredChats[index]); },
    enabled: !isMultiSelectMode && showSidebar,
  });

  useKeyboardShortcuts([
    { key: 'a', ctrlKey: true, callback: (e) => { e.preventDefault(); if (filteredChats.length > 0) { selectAll(filteredChats.map(chat => chat.id)); enhancedToast.info('All Selected', `${filteredChats.length} chats selected`); } } },
    { key: 'Escape', callback: () => { if (isMultiSelectMode) { clearSelection(); resetLastClicked(); enhancedToast.info('Selection Cleared', 'Multi-select mode deactivated'); } } },
    { key: 'Delete', callback: () => { if (selectedCount > 0) handleBulkDelete(); } },
    { key: 'z', ctrlKey: true, shiftKey: false, callback: async (e) => { e.preventDefault(); if (canUndo) { await undo(); enhancedToast.success('Undo', 'Action undone'); } } },
    { key: 'z', ctrlKey: true, shiftKey: true, callback: async (e) => { e.preventDefault(); if (canRedo) { await redo(); enhancedToast.success('Redo', 'Action redone'); } } },
    { key: 'ArrowDown', callback: (e) => { if (!isMultiSelectMode && showSidebar) { e.preventDefault(); handleArrowDown(); } } },
    { key: 'ArrowUp', callback: (e) => { if (!isMultiSelectMode && showSidebar) { e.preventDefault(); handleArrowUp(); } } },
    { key: 'Home', callback: (e) => { if (!isMultiSelectMode && showSidebar) { e.preventDefault(); handleHome(); } } },
    { key: 'End', callback: (e) => { if (!isMultiSelectMode && showSidebar) { e.preventDefault(); handleEnd(); } } },
    { key: 'Enter', callback: () => { if (!isMultiSelectMode && showSidebar) handleEnter(); } },
  ], { enabled: showSidebar });

  const handleBulkDelete = async () => { 
    if (selectedCount === 0 || !softDeleteBulkChats) return;
    
    const chatsToDelete = chats.filter(chat => selectedIds.includes(chat.id));
    const deletedChats = await softDeleteBulkChats(selectedIds);
    
    addAction({
      id: `bulk-delete-chats-${Date.now()}`,
      type: 'delete',
      timestamp: Date.now(),
      data: { itemIds: selectedIds, beforeState: chatsToDelete, afterState: [] },
      undo: async () => { if (restoreBulkChats) await restoreBulkChats(selectedIds); },
      redo: async () => { if (softDeleteBulkChats) await softDeleteBulkChats(selectedIds); },
      description: `Deleted ${selectedIds.length} chat${selectedIds.length > 1 ? 's' : ''}`,
    });
    
    enhancedToast.success('Chats Deleted', `${selectedIds.length} chat${selectedIds.length > 1 ? 's' : ''} deleted. Press Ctrl+Z to undo.`);
    clearSelection(); 
    resetLastClicked(); 
  };

  const handleChatClick = (index: number, chat: Chat, e: React.MouseEvent) => {
    if (isMultiSelectMode) {
      handleClick(index, chat.id, e.shiftKey, filteredChats.map(c => c.id), isSelected, toggleSelect, selectAll);
    } else {
      setActiveChat(chat);
    }
  };

  const handleExport = async (format: ExportFormat, selectedFields: string[]) => {
    const chatsToExport = selectedCount > 0 ? chats.filter(chat => selectedIds.includes(chat.id)) : filteredChats;
    const data = chatsToExport.map(chat => ({
      id: chat.id,
      title: chat.title,
      created_at: chat.createdAt.toISOString(),
      updated_at: chat.updatedAt.toISOString(),
      message_count: chat.messages.length,
      messages: chat.messages.map(m => ({ role: m.type, content: m.content, timestamp: m.timestamp.toISOString() })),
    }));

    try {
      let blob: Blob;
      if (format === 'json') blob = exportToJSON(data);
      else if (format === 'csv') {
        const flatData = data.map(({ messages, ...rest }) => ({ ...rest, messages: messages.length }));
        blob = exportToCSV(flatData, ['title', 'created_at', 'updated_at', 'messages']);
      } else blob = exportToPDF(data, ['title', 'created_at', 'message_count'], 'Chats Export');

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${getExportFilename('chats', format)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);

      enhancedToast.success('Export Complete', `Exported ${data.length} chats as ${format.toUpperCase()}`);
      setExportDialogOpen(false);
    } catch (error) {
      enhancedToast.error('Export Failed', 'Failed to export chats');
    }
  };

  const groupedChats = groupChatsByDate(filteredChats);

  if (!showSidebar) return null;

  return (
    <div className="h-full flex flex-col border-r bg-background">
      <div className="p-4 border-b space-y-4">
        <Button onClick={createNewChat} className="w-full" disabled={isMultiSelectMode}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Chat
        </Button>
        <Input placeholder="Search chats..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full" />
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {filteredChats.length > 50 ? (
          <VirtualList
            items={filteredChats}
            estimateSize={48}
            className="h-full overflow-auto"
            renderItem={(chat, index) => {
              const globalIndex = index;
              const isFocused = focusedIndex === globalIndex;
              const isDragging = draggedId === chat.id;
              const isDropTarget = dragOverId === chat.id;

              return (
                <div key={chat.id} className="relative mb-1">
                  <DragIndicator visible={isDropTarget} className="-top-0.5" />
                  <div
                    ref={(el) => setItemRef(globalIndex, el)}
                    draggable={!isMultiSelectMode}
                    onDragStart={(e) => handleDragStart(e, chat)}
                    onDragOver={(e) => handleDragOver(e, chat)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, chat)}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => handleChatClick(globalIndex, chat, e)}
                    className={cn(
                      "group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all",
                      activeChat?.id === chat.id && !isMultiSelectMode && "bg-accent",
                      isSelected(chat.id) && "bg-primary/10 ring-2 ring-primary",
                      isFocused && "ring-2 ring-primary/50",
                      isDragging && "opacity-50",
                      "hover:bg-accent"
                    )}
                  >
                    {!isMultiSelectMode && (
                      <div className="cursor-move opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => e.stopPropagation()}>
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    {isMultiSelectMode && (
                      <Checkbox checked={isSelected(chat.id)} onCheckedChange={() => toggleSelect(chat.id)} onClick={(e) => e.stopPropagation()} />
                    )}
                    <div className="flex-1 min-w-0">
                      {isEditingTitle === chat.id ? (
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => saveTitle(chat.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveTitle(chat.id);
                            if (e.key === 'Escape') setEditTitle('');
                          }}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          className="h-7"
                        />
                      ) : (
                        <p className="text-sm truncate">{chat.title}</p>
                      )}
                    </div>
                    {!isMultiSelectMode && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={(e) => startEditingTitle(chat.id, e)} className="h-7 w-7 p-0">
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={(e) => deleteChat(chat.id, e)} className="h-7 w-7 p-0">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            }}
          />
        ) : (
          Object.entries(groupedChats).map(([date, dateChatsEntry]) => {
            const dateChats = Array.isArray(dateChatsEntry) ? dateChatsEntry : [];
            return (
              <div key={date}>
                <h3 className="text-xs font-semibold text-muted-foreground px-2 mb-2">{date}</h3>
                <div className="space-y-1">
                  {dateChats.map((chat, index) => {
                  const globalIndex = filteredChats.findIndex(c => c.id === chat.id);
                  const isFocused = focusedIndex === globalIndex;
                  const isDragging = draggedId === chat.id;
                  const isDropTarget = dragOverId === chat.id;

                  return (
                    <div key={chat.id} className="relative">
                      <DragIndicator visible={isDropTarget} className="-top-0.5" />
                      <div
                        ref={(el) => setItemRef(globalIndex, el)}
                        draggable={!isMultiSelectMode}
                        onDragStart={(e) => handleDragStart(e, chat)}
                        onDragOver={(e) => handleDragOver(e, chat)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, chat)}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => handleChatClick(globalIndex, chat, e)}
                        className={cn(
                          "group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all",
                          activeChat?.id === chat.id && !isMultiSelectMode && "bg-accent",
                          isSelected(chat.id) && "bg-primary/10 ring-2 ring-primary",
                          isFocused && "ring-2 ring-primary/50",
                          isDragging && "opacity-50",
                          "hover:bg-accent"
                        )}
                      >
                        {!isMultiSelectMode && (
                          <div className="cursor-move opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => e.stopPropagation()}>
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        {isMultiSelectMode && (
                          <Checkbox checked={isSelected(chat.id)} onCheckedChange={() => toggleSelect(chat.id)} onClick={(e) => e.stopPropagation()} />
                        )}
                        <div className="flex-1 min-w-0">
                          {isEditingTitle === chat.id ? (
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onBlur={() => saveTitle(chat.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveTitle(chat.id);
                                if (e.key === 'Escape') setEditTitle('');
                              }}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                              className="h-7"
                            />
                          ) : (
                            <p className="text-sm truncate">{chat.title}</p>
                          )}
                        </div>
                        {!isMultiSelectMode && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" onClick={(e) => startEditingTitle(chat.id, e)} className="h-7 w-7 p-0">
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={(e) => deleteChat(chat.id, e)} className="h-7 w-7 p-0">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      <BulkActionBar 
        selectedCount={selectedCount} 
        onDelete={handleBulkDelete} 
        onExport={() => setExportDialogOpen(true)} 
        onCancel={() => { clearSelection(); resetLastClicked(); }}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <ExportDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} onExport={handleExport} availableFields={['title', 'created_at', 'updated_at', 'messages']} itemCount={selectedCount > 0 ? selectedCount : filteredChats.length} />
    </div>
  );
};

export default ChatSidebarWithBulk;
