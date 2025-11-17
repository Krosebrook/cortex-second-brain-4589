import React from 'react';
import { FilterPreset } from '@/types/filter-preset';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Star, Edit, Copy, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PresetCardProps {
  preset: FilterPreset & { usage_count?: number; last_used_at?: string };
  onEdit: (preset: FilterPreset) => void;
  onDuplicate: (preset: FilterPreset) => void;
  onDelete: (preset: FilterPreset) => void;
  onToggleDefault: (preset: FilterPreset) => void;
}

export const PresetCard: React.FC<PresetCardProps> = ({
  preset,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleDefault,
}) => {
  const filters = preset.filters as any;
  const filterCount = [
    filters.searchQuery && 'Search',
    filters.types?.length && `${filters.types.length} types`,
    filters.tags?.length && `${filters.tags.length} tags`,
    filters.dateRange && 'Date range',
  ].filter(Boolean);

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {preset.icon && (
              <span className="text-2xl" role="img" aria-label="preset icon">
                {preset.icon}
              </span>
            )}
            <div>
              <h3 className="font-semibold text-base">{preset.name}</h3>
              {preset.description && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {preset.description}
                </p>
              )}
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onToggleDefault(preset)}
            className={cn(
              'shrink-0',
              preset.is_default && 'text-yellow-500 hover:text-yellow-600'
            )}
          >
            <Star className={cn('h-4 w-4', preset.is_default && 'fill-current')} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="flex flex-wrap gap-1">
          {filterCount.length > 0 ? (
            filterCount.map((filter, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {filter}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">No filters</span>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex items-center justify-between pt-3 border-t">
        <span className="text-xs text-muted-foreground">
          {preset.usage_count ? `Used ${preset.usage_count} times` : 'Not used yet'}
        </span>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(preset)}
            className="h-8 px-2"
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDuplicate(preset)}
            className="h-8 px-2"
          >
            <Copy className="h-3 w-3 mr-1" />
            Duplicate
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(preset)}
            className="h-8 px-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
