import React, { useState } from 'react';
import { FilterPreset } from '@/types/filter-preset';
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

interface PresetEditDialogProps {
  preset: FilterPreset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (preset: Partial<FilterPreset>) => Promise<void>;
}

const EMOJI_OPTIONS = ['🔥', '⭐', '📌', '🎯', '💡', '🚀', '📊', '🔍', '💼', '🎨'];
const COLOR_OPTIONS = [
  'blue', 'green', 'red', 'yellow', 'purple', 'pink', 'orange', 'gray'
];

export const PresetEditDialog: React.FC<PresetEditDialogProps> = ({
  preset,
  open,
  onOpenChange,
  onSave,
}) => {
  const [name, setName] = useState(preset?.name || '');
  const [description, setDescription] = useState(preset?.description || '');
  const [icon, setIcon] = useState(preset?.icon || '📌');
  const [color, setColor] = useState(preset?.color || 'blue');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (preset) {
      setName(preset.name);
      setDescription(preset.description || '');
      setIcon(preset.icon || '📌');
      setColor(preset.color || 'blue');
    }
  }, [preset]);

  const handleSave = async () => {
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onSave({
        ...(preset?.id && { id: preset.id }),
        name: name.trim(),
        description: description.trim() || null,
        icon,
        color,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving preset:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {preset ? 'Edit Preset' : 'Create Preset'}
          </DialogTitle>
          <DialogDescription>
            Customize your filter preset appearance and details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Preset"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this preset filter for?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex gap-2 flex-wrap">
              {EMOJI_OPTIONS.map((emoji) => (
                <Button
                  key={emoji}
                  type="button"
                  variant={icon === emoji ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIcon(emoji)}
                  className="text-lg px-3"
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <Button
                  key={c}
                  type="button"
                  variant={color === c ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setColor(c)}
                  className="capitalize"
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || loading}>
            {loading ? 'Saving...' : 'Save Preset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
