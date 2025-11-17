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
import { BulkActionBar } from '@/components/feedback/BulkActionBar';
import { BulkTagDialog } from '@/components/feedback/BulkTagDialog';
import { SearchFilterBar } from '@/components/feedback/SearchFilterBar';
import { ExportDialog } from '@/components/feedback/ExportDialog';
import { DragIndicator } from '@/components/ui/drag-indicator';
import { VirtualList } from '@/components/ui/virtual-list';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Globe, Database, File, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToJSON, exportToCSV, exportToPDF, ExportFormat, getExportFilename } from '@/utils/exportUtils';
import { enhancedToast } from '@/components/feedback/EnhancedToast';

const typeIcons = {
  note: FileText,
  document: File,
  web_page: Globe,
  file: Database,
};

export const KnowledgeList: React.FC = () => {
  const { user } = useAuth();
  const { items, loading, deleteKnowledgeItem, deleteBulkKnowledgeItems, updateKnowledgeOrder, updateBulkTags } = useKnowledge();
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

  const handleBulkDelete = () => { 
    deleteBulkKnowledgeItems(selectedIds); 
    clearSelection(); 
    resetLastClicked(); 
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
    { key: 'a', ctrlKey: true, callback: (e) => { e.preventDefault(); if (filteredItems.length > 0) { selectAll(filteredItems.map(item => item.id)); enhancedToast.info('All Selected', `${filteredItems.length} items selected`); } } },
    { key: 'Escape', callback: () => { if (isMultiSelectMode) { clearSelection(); resetLastClicked(); enhancedToast.info('Selection Cleared', 'Multi-select mode deactivated'); } } },
    { key: 'Delete', callback: () => { if (selectedCount > 0) handleBulkDelete(); } },
    { key: 's', ctrlKey: true, callback: (e) => { if (hasActiveFilters) { e.preventDefault(); handleSavePreset(); } } },
    { key: 'ArrowDown', callback: (e) => { if (!isMultiSelectMode) { e.preventDefault(); handleArrowDown(); } } },
    { key: 'ArrowUp', callback: (e) => { if (!isMultiSelectMode) { e.preventDefault(); handleArrowUp(); } } },
    { key: 'Home', callback: (e) => { if (!isMultiSelectMode) { e.preventDefault(); handleHome(); } } },
    { key: 'End', callback: (e) => { if (!isMultiSelectMode) { e.preventDefault(); handleEnd(); } } },
    { key: 'Enter', callback: () => { if (!isMultiSelectMode) handleEnter(); } },
  ], { enabled: true });

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

  const handleAddTags = async (tags: string[]) => { await updateBulkTags(selectedIds, tags, []); setTagDialogOpen(false); clearSelection(); };
  const handleRemoveTags = async (tags: string[]) => { await updateBulkTags(selectedIds, [], tags); setTagDialogOpen(false); clearSelection(); };

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

      <BulkActionBar selectedCount={selectedCount} onDelete={handleBulkDelete} onExport={() => setExportDialogOpen(true)} onManageTags={() => setTagDialogOpen(true)} onCancel={() => { clearSelection(); resetLastClicked(); }} />
      <ExportDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} onExport={handleExport} availableFields={['title', 'content', 'type', 'tags', 'source_url', 'created_at', 'updated_at']} itemCount={selectedCount > 0 ? selectedCount : filteredItems.length} />
      <BulkTagDialog open={tagDialogOpen} onOpenChange={setTagDialogOpen} selectedCount={selectedCount} existingTags={allTags} selectedItemTags={selectedItemTags} onAddTags={handleAddTags} onRemoveTags={handleRemoveTags} />
    </div>
  );
};
