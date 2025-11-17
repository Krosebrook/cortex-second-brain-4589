import React, { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FilterOptions } from '@/types/filter-preset';

interface FilterPresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, description: string, icon?: string, color?: string) => void;
  currentFilters: FilterOptions;
}

const presetIcons = ['Star', 'Bookmark', 'Tag', 'Filter', 'Heart', 'Flag'];
const presetColors = [
  { name: 'Blue', class: 'text-blue-500' },
  { name: 'Green', class: 'text-green-500' },
  { name: 'Red', class: 'text-red-500' },
  { name: 'Yellow', class: 'text-yellow-500' },
  { name: 'Purple', class: 'text-purple-500' },
  { name: 'Pink', class: 'text-pink-500' },
];

export const FilterPresetDialog: React.FC<FilterPresetDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  currentFilters,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Filter');
  const [color, setColor] = useState('text-blue-500');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name, description, icon, color);
    setName('');
    setDescription('');
    setIcon('Filter');
    setColor('text-blue-500');
    onOpenChange(false);
  };

  const filterSummary = [];
  if (currentFilters.searchQuery) filterSummary.push(`Search: "${currentFilters.searchQuery}"`);
  if (currentFilters.types?.length) filterSummary.push(`Types: ${currentFilters.types.length}`);
  if (currentFilters.tags?.length) filterSummary.push(`Tags: ${currentFilters.tags.length}`);
  if (currentFilters.dateFrom || currentFilters.dateTo) filterSummary.push('Date range');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Filter Preset</DialogTitle>
          <DialogDescription>
            Save your current filters for quick access later
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="preset-name">Name *</Label>
            <Input
              id="preset-name"
              placeholder="e.g., Urgent Documents"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preset-description">Description</Label>
            <Textarea
              id="preset-description"
              placeholder="Optional description of this filter preset"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preset-icon">Icon</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger id="preset-icon">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {presetIcons.map((iconName) => (
                    <SelectItem key={iconName} value={iconName}>
                      {iconName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preset-color">Color</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger id="preset-color">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {presetColors.map(({ name, class: colorClass }) => (
                    <SelectItem key={colorClass} value={colorClass}>
                      <span className={colorClass}>● {name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Current filters:
            </p>
            <p className="text-sm">
              {filterSummary.length > 0 ? filterSummary.join(' • ') : 'No filters applied'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            Save Preset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
