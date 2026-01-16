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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus, X, Tag } from 'lucide-react';
import { useTagAutocomplete } from '@/hooks/useTagAutocomplete';
import { validateTag } from '@/utils/security';
import { useToast } from '@/hooks/use-toast';

interface BulkTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  existingTags: string[];
  selectedItemTags: string[][];
  onAddTags: (tags: string[]) => void;
  onRemoveTags: (tags: string[]) => void;
}

export const BulkTagDialog: React.FC<BulkTagDialogProps> = ({
  open,
  onOpenChange,
  selectedCount,
  existingTags,
  selectedItemTags,
  onAddTags,
  onRemoveTags,
}) => {
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagsToRemove, setTagsToRemove] = useState<string[]>([]);
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const { toast } = useToast();

  const { inputValue, setInputValue, suggestions, commonTags, getTagFrequency, clearInput } =
    useTagAutocomplete({
      existingTags,
      selectedItemTags,
    });

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim();
    
    // Validate tag
    const validation = validateTag(trimmedTag);
    if (!validation.isValid) {
      toast({
        title: "Invalid Tag",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }
    
    if (!newTags.includes(trimmedTag)) {
      setNewTags([...newTags, trimmedTag]);
      clearInput();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(inputValue);
    } else if (e.key === ',' && inputValue) {
      e.preventDefault();
      handleAddTag(inputValue);
    }
  };

  const handleRemoveNewTag = (tag: string) => {
    setNewTags(newTags.filter((t) => t !== tag));
  };

  const handleToggleRemoveTag = (tag: string) => {
    setTagsToRemove((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleConfirm = () => {
    if (mode === 'add' && newTags.length > 0) {
      onAddTags(newTags);
    } else if (mode === 'remove' && tagsToRemove.length > 0) {
      onRemoveTags(tagsToRemove);
    }
    handleClose();
  };

  const handleClose = () => {
    setNewTags([]);
    setTagsToRemove([]);
    clearInput();
    onOpenChange(false);
  };

  const canConfirm = useMemo(() => {
    return mode === 'add' ? newTags.length > 0 : tagsToRemove.length > 0;
  }, [mode, newTags, tagsToRemove]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
          <DialogDescription>
            Add or remove tags from {selectedCount} selected {selectedCount === 1 ? 'item' : 'items'}.
            You can undo tag changes with Ctrl+Z.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'add' | 'remove')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add">Add Tags</TabsTrigger>
            <TabsTrigger value="remove">Remove Tags</TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tag-input">Add Tags</Label>
              <div className="relative">
                <Input
                  id="tag-input"
                  placeholder="Type and press Enter or comma..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pr-10"
                />
                <Plus className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && inputValue && (
                <div className="flex flex-wrap gap-2 p-2 bg-muted rounded-md max-h-32 overflow-y-auto">
                  {suggestions.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handleAddTag(tag)}
                    >
                      {tag} ({getTagFrequency(tag)})
                    </Badge>
                  ))}
                </div>
              )}

              {/* Selected tags to add */}
              {newTags.length > 0 && (
                <div className="space-y-2">
                  <Label>Tags to add:</Label>
                  <div className="flex flex-wrap gap-2">
                    {newTags.map((tag) => (
                      <Badge key={tag} variant="default" className="gap-1">
                        <Tag className="h-3 w-3" />
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleRemoveNewTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="remove" className="space-y-4">
            {commonTags.length > 0 ? (
              <div className="space-y-2">
                <Label>Select tags to remove:</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {commonTags.map((tag) => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag}`}
                        checked={tagsToRemove.includes(tag)}
                        onCheckedChange={() => handleToggleRemoveTag(tag)}
                      />
                      <Label
                        htmlFor={`tag-${tag}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {tag}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Tag className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No common tags found across selected items</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm}>
            {mode === 'add' ? 'Add Tags' : 'Remove Tags'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
