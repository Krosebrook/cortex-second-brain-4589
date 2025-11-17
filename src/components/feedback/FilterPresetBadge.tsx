import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FilterPreset } from '@/types/filter-preset';
import { X, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterPresetBadgeProps {
  preset: FilterPreset;
  isActive: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export const FilterPresetBadge: React.FC<FilterPresetBadgeProps> = ({
  preset,
  isActive,
  onClick,
  onDelete,
}) => {
  return (
    <Badge
      variant={isActive ? 'default' : 'outline'}
      className={cn(
        'cursor-pointer pl-2 pr-1 py-1 gap-1 hover:bg-accent transition-colors',
        preset.color,
        isActive && 'ring-2 ring-primary'
      )}
      onClick={onClick}
    >
      {preset.is_default && <Star className="w-3 h-3" />}
      <span>{preset.name}</span>
      <button
        onClick={onDelete}
        className="ml-1 hover:bg-background/20 rounded-sm p-0.5"
      >
        <X className="w-3 h-3" />
      </button>
    </Badge>
  );
};
