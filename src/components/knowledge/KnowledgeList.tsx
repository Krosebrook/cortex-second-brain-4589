import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useKnowledge } from '@/hooks/useKnowledge';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useRangeSelection } from '@/hooks/useRangeSelection';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { useSearchFilter } from '@/hooks/useSearchFilter';
import { useFilterPresets } from '@/hooks/useFilterPresets';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useConflictDetection } from '@/hooks/useConflictDetection';
import { useShortcutHelp } from '@/hooks/useShortcutHelp';
import { useShortcutTracking } from '@/hooks/useShortcutTracking';
import { BulkActionBar } from '@/components/feedback/BulkActionBar';
import { BulkTagDialog } from '@/components/feedback/BulkTagDialog';
import { SearchFilterBar } from '@/components/feedback/SearchFilterBar';
import { ExportDialog } from '@/components/feedback/ExportDialog';
import { FilterPresetDialog } from '@/components/feedback/FilterPresetDialog';
import { ConflictDialog } from '@/components/feedback/ConflictDialog';
import { ShortcutsHelpDialog } from '@/components/feedback/ShortcutsHelpDialog';
import { DragIndicator } from '@/components/ui/drag-indicator';
import { VirtualList } from '@/components/ui/virtual-list';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Globe, Database, File, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToJSON, exportToCSV, exportToPDF, ExportFormat, getExportFilename } from '@/utils/exportUtils';
import { enhancedToast } from '@/components/feedback/EnhancedToast';
import { UndoToast } from '@/components/feedback/UndoToast';
import { ConflictResolver } from '@/lib/conflict-resolver';
import { Conflict, ConflictResolution, ConflictError } from '@/types/conflict';

const typeIcons = {
  note: FileText,
  document: File,
  web_page: Globe,
  file: Database,
};

export const KnowledgeList: React.FC = () => {
  const { user } = useAuth();
  const { 
    items, 
    loading, 
    deleteKnowledgeItem, 
    deleteBulkKnowledgeItems, 
    softDeleteBulkKnowledgeItems,
    restoreBulkKnowledgeItems,
    updateKnowledgeOrder, 
    updateBulkTags,
    restoreBulkTags
  } = useKnowledge();
  
  const { addAction, undo, redo, canUndo, canRedo, undoStack } = useUndoRedo();
  const { isOpen: shortcutsOpen, toggle: toggleShortcuts } = useShortcutHelp();
  const { trackShortcut } = useShortcutTracking();
  
  const [currentConflict, setCurrentConflict] = useState<Conflict | null>(null);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  
  const {
    selectedIds,
    selectedCount,
    isMultiSelectMode,
    toggleSelect,
    selectAll,
    clearSelection,
    isSelected,
  } = useMultiSelect();

  const {
    searchQuery,
    setSearchQuery,
    selectedTypes,
    toggleType,
    selectedTags,
    toggleTag,
    clearFilters,
    filteredItems,
    availableTypes,
    availableTags,
    hasActiveFilters,
    getCurrentFilters,
    applyFilters,
  } = useSearchFilter(items);

  const {
    presets,
    activePresetId,
    setActivePresetId,
    createPreset,
    deletePreset,
  } = useFilterPresets('knowledge', user?.id);

  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  
  const { handleClick, resetLastClicked } = useRangeSelection();

  // Track items in history for conflict detection
  const itemsInHistory = React.useMemo(() => {
    return undoStack.flatMap(action => action.data.itemIds || []);
  }, [undoStack]);

  const { conflicts } = useConflictDetection('knowledge_base', itemsInHistory);

  const { draggedId, dragOverId, handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd } = useDragAndDrop({
    items: filteredItems,
    onReorder: async (reorderedItems) => {
      const updates = reorderedItems.map((item, idx) => ({
        id: item.id,
        order_index: idx,
      }));
      await updateKnowledgeOrder(updates);
    },
    getId: (item) => item.id,
    disabled: isMultiSelectMode,
  });

  const { focusedIndex, setItemRef, handleArrowDown, handleArrowUp, handleHome, handleEnd, handleEnter } = useKeyboardNavigation({
    items: filteredItems,
    onSelect: () => {},
    onActivate: (index) => {
      console.log('Activated:', filteredItems[index]);
    },
    enabled: !isMultiSelectMode,
  });

  const handleBulkDelete = async () => { 
    if (selectedIds.length === 0) return;
    
    const itemsToDelete = items.filter(item => selectedIds.includes(item.id));
    
    try {
      await softDeleteBulkKnowledgeItems!(selectedIds);
      
      // Add undo action
      addAction({
        id: `bulk-delete-${Date.now()}`,
        type: 'delete',
        timestamp: Date.now(),
        data: {
          itemIds: selectedIds,
          beforeState: itemsToDelete,
          afterState: [],
        },
        undo: async () => {
          await restoreBulkKnowledgeItems!(selectedIds);
        },
        redo: async () => {
          await softDeleteBulkKnowledgeItems!(selectedIds);
        },
        description: `Deleted ${selectedIds.length} item${selectedIds.length > 1 ? 's' : ''}`,
      });
      
      enhancedToast.success(
        'Items Deleted',
        `${selectedIds.length} item${selectedIds.length > 1 ? 's' : ''} deleted. Press Ctrl+Z to undo.`
      );
      
      clearSelection(); 
      resetLastClicked(); 
    } catch (error) {
      enhancedToast.error('Error', 'Failed to delete items');
    }
  };

  const handleSavePreset = async () => {
    const filters = getCurrentFilters();
    await createPreset({
      name: `Filter ${presets.length + 1}`,
      description: '',
      filters,
      scope: 'knowledge',
      is_default: false,
    });
  };

  const handleApplyPreset = (preset: any) => {
    applyFilters(preset.filters);
    setActivePresetId(preset.id);
    enhancedToast.success('Preset Applied', `"${preset.name}" filters applied`);
  };

  const handleDeletePreset = async (presetId: string) => {
    await deletePreset(presetId);
    if (activePresetId === presetId) {
      setActivePresetId(null);
    }
  };

  useKeyboardShortcuts([
    { id: 'select-all', key: 'a', ctrlKey: true, callback: (e) => { e.preventDefault(); if (filteredItems.length > 0) { selectAll(filteredItems.map(item => item.id)); enhancedToast.info('All Selected', `${filteredItems.length} items selected`); } } },
    { id: 'select-clear', key: 'Escape', callback: () => { if (isMultiSelectMode) { clearSelection(); resetLastClicked(); enhancedToast.info('Selection Cleared', 'Multi-select mode deactivated'); } } },
    { id: 'action-delete', key: 'Delete', callback: () => { if (selectedCount > 0) handleBulkDelete(); } },
    { id: 'action-save-filter', key: 's', ctrlKey: true, callback: (e) => { if (hasActiveFilters) { e.preventDefault(); handleSavePreset(); } } },
    { id: 'action-undo', key: 'z', ctrlKey: true, shiftKey: false, callback: async (e) => { e.preventDefault(); if (canUndo) { await undo(); enhancedToast.success('Undo', 'Action undone'); } } },
    { id: 'action-redo', key: 'z', ctrlKey: true, shiftKey: true, callback: async (e) => { e.preventDefault(); if (canRedo) { await redo(); enhancedToast.success('Redo', 'Action redone'); } } },
    { id: 'action-tag', key: 't', callback: () => { if (selectedCount > 0) { setTagDialogOpen(true); } } },
    { id: 'help-shortcuts', key: '?', callback: toggleShortcuts },
    { id: 'help-shortcuts-alt', key: '/', ctrlKey: true, callback: toggleShortcuts },
    { id: 'nav-up', key: 'ArrowDown', callback: (e) => { if (!isMultiSelectMode) { e.preventDefault(); handleArrowDown(); } } },
    { id: 'nav-down', key: 'ArrowUp', callback: (e) => { if (!isMultiSelectMode) { e.preventDefault(); handleArrowUp(); } } },
    { id: 'nav-home', key: 'Home', callback: (e) => { if (!isMultiSelectMode) { e.preventDefault(); handleHome(); } } },
    { id: 'nav-end', key: 'End', callback: (e) => { if (!isMultiSelectMode) { e.preventDefault(); handleEnd(); } } },
    { id: 'nav-enter', key: 'Enter', callback: () => { if (!isMultiSelectMode) handleEnter(); } },
  ], { enabled: true, onShortcutUsed: trackShortcut });

  const handleItemClick = (index: number, itemId: string, e: React.MouseEvent) => {
    if (isMultiSelectMode) {
      handleClick(index, itemId, e.shiftKey, filteredItems.map(item => item.id), isSelected, toggleSelect, selectAll);
    } else {
      toggleSelect(itemId);
    }
  };

  const handleExport = async (format: ExportFormat, selectedFields: string[]) => {
    const itemsToExport = selectedCount > 0 ? items.filter(item => selectedIds.includes(item.id)) : filteredItems;
    const data = itemsToExport.map(item => {
      const filtered: any = { id: item.id };
      selectedFields.forEach(field => { 
        filtered[field] = item[field as keyof typeof item]; 
      });
      return filtered;
    });

    try {
      let blob: Blob;
      if (format === 'json') blob = exportToJSON(data);
      else if (format === 'csv') blob = exportToCSV(data, selectedFields);
      else blob = exportToPDF(data, selectedFields, 'Knowledge Base Export');

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${getExportFilename('knowledge', format)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);

      enhancedToast.success('Export Complete', `Exported ${data.length} items as ${format.toUpperCase()}`);
      setExportDialogOpen(false);
    } catch (error) {
      enhancedToast.error('Export Failed', 'Failed to export items');
    }
  };

  const handleAddTags = async (tags: string[]) => {
    const itemsToUpdate = items.filter(item => selectedIds.includes(item.id));
    
    // Capture before state
    const beforeState = itemsToUpdate.map(item => ({
      id: item.id,
      title: item.title,
      tags: [...(item.tags || [])],
      version: item.version,
    }));
    
    const result = await updateBulkTags(selectedIds, tags, []);
    
    if (result.success) {
      // Add to undo stack
      addAction({
        id: crypto.randomUUID(),
        type: 'tag_add',
        timestamp: Date.now(),
        description: `Added ${tags.length} tag${tags.length > 1 ? 's' : ''} to ${selectedIds.length} item${selectedIds.length > 1 ? 's' : ''}`,
        data: {
          itemIds: selectedIds,
          beforeState: { items: beforeState },
          afterState: { tagsAdded: tags },
        },
        undo: async () => {
          await restoreBulkTags(result.previousState);
        },
        redo: async () => {
          await updateBulkTags(selectedIds, tags, []);
        },
      });
      
      enhancedToast.success(
        'Tags Added',
        `Added ${tags.join(', ')} to ${selectedIds.length} items. Press Ctrl+Z to undo.`
      );
    }
    
    setTagDialogOpen(false);
    clearSelection();
  };
  
  const handleRemoveTags = async (tags: string[]) => {
    const itemsToUpdate = items.filter(item => selectedIds.includes(item.id));
    
    // Capture before state
    const beforeState = itemsToUpdate.map(item => ({
      id: item.id,
      title: item.title,
      tags: [...(item.tags || [])],
      version: item.version,
    }));
    
    const result = await updateBulkTags(selectedIds, [], tags);
    
    if (result.success) {
      // Add to undo stack
      addAction({
        id: crypto.randomUUID(),
        type: 'tag_remove',
        timestamp: Date.now(),
        description: `Removed ${tags.length} tag${tags.length > 1 ? 's' : ''} from ${selectedIds.length} item${selectedIds.length > 1 ? 's' : ''}`,
        data: {
          itemIds: selectedIds,
          beforeState: { items: beforeState },
          afterState: { tagsRemoved: tags },
        },
        undo: async () => {
          await restoreBulkTags(result.previousState);
        },
        redo: async () => {
          await updateBulkTags(selectedIds, [], tags);
        },
      });
      
      enhancedToast.success(
        'Tags Removed',
        `Removed ${tags.join(', ')} from ${selectedIds.length} items. Press Ctrl+Z to undo.`
      );
    }
    
    setTagDialogOpen(false);
    clearSelection();
  };

  const allTags = items.flatMap(item => item.tags || []);
  const selectedItemTags = items.filter(item => selectedIds.includes(item.id)).map(item => item.tags || []);

  if (loading) return <div className="flex items-center justify-center p-8">Loading...</div>;

  return (
    <div className="space-y-4">
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTypes={selectedTypes}
        availableTypes={availableTypes}
        onToggleType={toggleType}
        selectedTags={selectedTags}
        availableTags={availableTags}
        onToggleTag={toggleTag}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        resultCount={filteredItems.length}
        totalCount={items.length}
        presets={presets}
        activePresetId={activePresetId}
        onApplyPreset={handleApplyPreset}
        onDeletePreset={handleDeletePreset}
        onSavePreset={handleSavePreset}
        currentFilters={getCurrentFilters()}
        scope="knowledge"
      />

      {filteredItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Database className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>No knowledge items found</p>
        </div>
      ) : filteredItems.length > 50 ? (
        <VirtualList
          items={filteredItems}
          estimateSize={100}
          className="h-[calc(100vh-16rem)] overflow-auto"
          renderItem={(item, index) => {
            const Icon = typeIcons[item.type];
            const isFocused = focusedIndex === index;
            const isDragging = draggedId === item.id;
            const isDropTarget = dragOverId === item.id;

            return (
              <div key={item.id} className="relative mb-2">
                <DragIndicator visible={isDropTarget} className="-top-1" />
                <Card
                  ref={(el) => setItemRef(index, el)}
                  draggable={!isMultiSelectMode}
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={(e) => handleDragOver(e, item)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, item)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "p-4 cursor-pointer transition-all",
                    isSelected(item.id) && "ring-2 ring-primary",
                    isFocused && "ring-2 ring-primary/50",
                    isDragging && "opacity-50",
                    "hover:shadow-md"
                  )}
                  onClick={(e) => !isMultiSelectMode && handleItemClick(index, item.id, e)}
                >
                  <div className="flex items-start gap-3">
                    {!isMultiSelectMode && (
                      <div className="cursor-move pt-1" onMouseDown={(e) => e.stopPropagation()}>
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    {isMultiSelectMode && (
                      <Checkbox checked={isSelected(item.id)} onCheckedChange={() => handleItemClick(index, item.id, {} as any)} onClick={(e) => e.stopPropagation()} />
                    )}
                    <Icon className="h-5 w-5 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <h3 className="font-medium">{item.title}</h3>
                      {item.content && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.content}</p>}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.map(tag => (
                            <span key={tag} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {!isMultiSelectMode && (
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteKnowledgeItem(item.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              </div>
            );
          }}
        />
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item, index) => {
            const Icon = typeIcons[item.type];
            const isFocused = focusedIndex === index;
            const isDragging = draggedId === item.id;
            const isDropTarget = dragOverId === item.id;

            return (
              <div key={item.id} className="relative">
                <DragIndicator visible={isDropTarget} className="-top-1" />
                <Card
                  ref={(el) => setItemRef(index, el)}
                  draggable={!isMultiSelectMode}
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={(e) => handleDragOver(e, item)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, item)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "p-4 cursor-pointer transition-all",
                    isSelected(item.id) && "ring-2 ring-primary",
                    isFocused && "ring-2 ring-primary/50",
                    isDragging && "opacity-50",
                    "hover:shadow-md"
                  )}
                  onClick={(e) => !isMultiSelectMode && handleItemClick(index, item.id, e)}
                >
                  <div className="flex items-start gap-3">
                    {!isMultiSelectMode && (
                      <div className="cursor-move pt-1" onMouseDown={(e) => e.stopPropagation()}>
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    {isMultiSelectMode && (
                      <Checkbox checked={isSelected(item.id)} onCheckedChange={() => handleItemClick(index, item.id, {} as any)} onClick={(e) => e.stopPropagation()} />
                    )}
                    <Icon className="h-5 w-5 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <h3 className="font-medium">{item.title}</h3>
                      {item.content && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.content}</p>}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.map(tag => (
                            <span key={tag} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {!isMultiSelectMode && (
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteKnowledgeItem(item.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      <BulkActionBar 
        selectedCount={selectedCount} 
        onDelete={handleBulkDelete} 
        onExport={() => setExportDialogOpen(true)} 
        onManageTags={() => setTagDialogOpen(true)} 
        onCancel={() => { clearSelection(); resetLastClicked(); }}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      
      <ExportDialog 
        open={exportDialogOpen} 
        onOpenChange={setExportDialogOpen} 
        onExport={handleExport} 
        availableFields={['title', 'content', 'type', 'tags', 'source_url', 'created_at', 'updated_at']} 
        itemCount={selectedCount > 0 ? selectedCount : filteredItems.length} 
      />
      
      <BulkTagDialog 
        open={tagDialogOpen} 
        onOpenChange={setTagDialogOpen} 
        selectedCount={selectedCount} 
        existingTags={allTags} 
        selectedItemTags={selectedItemTags} 
        onAddTags={handleAddTags} 
        onRemoveTags={handleRemoveTags} 
      />
      
      <ConflictDialog
        conflict={currentConflict}
        open={conflictDialogOpen}
        onResolve={(resolution) => {
          setConflictDialogOpen(false);
          setCurrentConflict(null);
        }}
      />

      <ShortcutsHelpDialog
        open={shortcutsOpen}
        onOpenChange={toggleShortcuts}
        context={{
          page: 'knowledge',
          hasSelection: selectedCount > 0,
          bulkMode: isMultiSelectMode,
        }}
      />
    </div>
  );
};
