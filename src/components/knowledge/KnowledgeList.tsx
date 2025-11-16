import React from 'react';
import { useKnowledge } from '@/hooks/useKnowledge';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { BulkActionBar } from '@/components/feedback/BulkActionBar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Globe, Database, File, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    clearSelection,
    isSelected,
  } = useMultiSelect();

  const handleBulkDelete = () => {
    deleteBulkKnowledgeItems(selectedIds);
    clearSelection();
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
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = typeIcons[item.type] || FileText;
          const selected = isSelected(item.id);

          return (
            <Card
              key={item.id}
              className={cn(
                "p-4 cursor-pointer transition-all hover:shadow-md",
                selected && "ring-2 ring-primary"
              )}
              onClick={() => isMultiSelectMode && toggleSelect(item.id)}
            >
              <div className="flex items-start gap-3">
                {isMultiSelectMode && (
                  <Checkbox
                    checked={selected}
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

      {!isMultiSelectMode && items.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => {
              // Enter multi-select mode
              toggleSelect(items[0].id);
              clearSelection();
            }}
          >
            Select Multiple Items
          </Button>
        </div>
      )}

      <BulkActionBar
        selectedCount={selectedCount}
        onDelete={handleBulkDelete}
        onCancel={clearSelection}
      />
    </div>
  );
};
