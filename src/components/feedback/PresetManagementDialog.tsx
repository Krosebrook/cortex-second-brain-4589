import React, { useState } from 'react';
import { useFilterPresets } from '@/hooks/useFilterPresets';
import { usePresetReorder } from '@/hooks/usePresetReorder';
import { FilterPreset } from '@/types/filter-preset';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PresetCard } from './PresetCard';
import { PresetEditDialog } from './PresetEditDialog';
import { Search, Grid3x3, List } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PresetManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: 'knowledge' | 'chats';
}

export const PresetManagementDialog: React.FC<PresetManagementDialogProps> = ({
  open,
  onOpenChange,
  scope,
}) => {
const { presets, updatePreset, deletePreset, duplicatePreset } = useFilterPresets(scope);
  const { orderedPresets } = usePresetReorder(presets);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editPreset, setEditPreset] = useState<FilterPreset | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const filteredPresets = orderedPresets.filter(preset =>
    preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    preset.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (preset: FilterPreset) => {
    setEditPreset(preset);
    setEditDialogOpen(true);
  };

  const handleDuplicate = async (preset: FilterPreset) => {
    try {
      await duplicatePreset(preset.id);
      toast({
        title: 'Preset duplicated',
        description: `Created a copy of "${preset.name}"`,
      });
    } catch (error) {
      toast({
        title: 'Duplication failed',
        description: 'Could not duplicate preset',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (preset: FilterPreset) => {
    try {
      await deletePreset(preset.id);
      toast({
        title: 'Preset deleted',
        description: `Deleted "${preset.name}"`,
      });
    } catch (error) {
      toast({
        title: 'Deletion failed',
        description: 'Could not delete preset',
        variant: 'destructive',
      });
    }
  };

  const handleToggleDefault = async (preset: FilterPreset) => {
    try {
      await updatePreset(preset.id, { is_default: !preset.is_default });
      toast({
        title: preset.is_default ? 'Removed default' : 'Set as default',
        description: preset.is_default 
          ? `"${preset.name}" is no longer the default`
          : `"${preset.name}" is now the default preset`,
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Could not update default preset',
        variant: 'destructive',
      });
    }
  };

  const handleSaveEdit = async (updates: Partial<FilterPreset>) => {
    if (!editPreset) return;
    
    try {
      await updatePreset(editPreset.id, updates);
      toast({
        title: 'Preset updated',
        description: `Updated "${updates.name || editPreset.name}"`,
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Could not update preset',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Presets</DialogTitle>
            <DialogDescription>
              Organize, edit, and customize your filter presets
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 py-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search presets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1 border rounded-md p-1">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                onClick={() => setViewMode('grid')}
                className="px-2"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                onClick={() => setViewMode('list')}
                className="px-2"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredPresets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">No presets found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery ? 'Try a different search term' : 'Create your first preset to get started'}
                </p>
              </div>
            ) : (
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                  : 'space-y-2'
              }>
                {filteredPresets.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    onEdit={handleEdit}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                    onToggleDefault={handleToggleDefault}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PresetEditDialog
        preset={editPreset}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveEdit}
      />
    </>
  );
};
