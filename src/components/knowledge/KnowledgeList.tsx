import React, { useState } from 'react';
import { useKnowledge } from '@/hooks/useKnowledge';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useRangeSelection } from '@/hooks/useRangeSelection';
import { useSearchFilter } from '@/hooks/useSearchFilter';
import { BulkActionBar } from '@/components/feedback/BulkActionBar';
import { SearchFilterBar } from '@/components/feedback/SearchFilterBar';
import { ExportDialog } from '@/components/feedback/ExportDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Globe, Database, File, Trash2 } from 'lucide-react';
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
  const { items, loading, deleteKnowledgeItem, deleteBulkKnowledgeItems } = useKnowledge();
  const {
    selectedIds,
    selectedCount,
    isMultiSelectMode,
    toggleSelect,
    selectAll,
    selectRange,
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
  } = useSearchFilter(items);

  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  const { handleClick, resetLastClicked } = useRangeSelection();

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'a',
      ctrlKey: true,
      callback: (e) => {
        e.preventDefault();
        if (filteredItems.length > 0) {
          selectAll(filteredItems.map(item => item.id));
          enhancedToast.info('All Selected', `${filteredItems.length} items selected`);
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
  ], { enabled: true });

  const handleBulkDelete = () => {
    deleteBulkKnowledgeItems(selectedIds);
    clearSelection();
    resetLastClicked();
  };

  const handleItemClick = (index: number, itemId: string, e: React.MouseEvent) => {
    if (isMultiSelectMode) {
      handleClick(
        index,
        itemId,
        e.shiftKey,
        filteredItems.map(item => item.id),
        isSelected,
        toggleSelect,
        selectRange
      );
    }
  };

  const handleExport = (format: ExportFormat) => {
    const itemsToExport = selectedCount > 0
      ? items.filter(item => selectedIds.includes(item.id))
      : filteredItems;

    const filename = getExportFilename('knowledge-items', format);

    try {
      if (format === 'json') {
        exportToJSON(itemsToExport, filename);
      } else if (format === 'csv') {
        exportToCSV(itemsToExport, filename);
      } else if (format === 'pdf') {
        exportToPDF(itemsToExport, filename, 'Knowledge Base Export');
      }
      enhancedToast.success('Export Successful', `Exported ${itemsToExport.length} items as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      enhancedToast.error('Export Failed', 'Failed to export items');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading knowledge base...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Database size={48} className="text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No knowledge items yet</h3>
        <p className="text-sm text-muted-foreground">
          Start importing data to build your knowledge base
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        availableTypes={availableTypes}
        selectedTypes={selectedTypes}
        onToggleType={toggleType}
        availableTags={availableTags}
        selectedTags={selectedTags}
        onToggleTag={toggleTag}
        onClearFilters={clearFilters}
        hasActiveFilters={!!hasActiveFilters}
        resultCount={filteredItems.length}
        totalCount={items.length}
        placeholder="Search knowledge base..."
      />

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item, index) => {
          const Icon = typeIcons[item.type] || FileText;
          const selected = isSelected(item.id);

          return (
            <Card
              key={item.id}
              className={cn(
                "p-4 cursor-pointer transition-all hover:shadow-md",
                selected && "ring-2 ring-primary"
              )}
              onClick={(e) => handleItemClick(index, item.id, e)}
            >
              <div className="flex items-start gap-3">
                {isMultiSelectMode && (
                  <Checkbox
                    checked={!!selected}
                    onCheckedChange={() => toggleSelect(item.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                <Icon size={20} className="text-muted-foreground mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{item.title}</h3>
                  {item.content && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {item.content}
                    </p>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-muted px-2 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {!isMultiSelectMode && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteKnowledgeItem(item.id);
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
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
        itemCount={selectedCount > 0 ? selectedCount : filteredItems.length}
        itemType="knowledge items"
      />
    </div>
  );
};
