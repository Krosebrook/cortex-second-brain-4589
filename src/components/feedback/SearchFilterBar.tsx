import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Filter } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  availableTypes?: string[];
  selectedTypes?: string[];
  onToggleType?: (type: string) => void;
  availableTags?: string[];
  selectedTags?: string[];
  onToggleTag?: (tag: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  resultCount: number;
  totalCount: number;
  placeholder?: string;
  className?: string;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  availableTypes = [],
  selectedTypes = [],
  onToggleType,
  availableTags = [],
  selectedTags = [],
  onToggleTag,
  onClearFilters,
  hasActiveFilters,
  resultCount,
  totalCount,
  placeholder = 'Search...',
  className,
}) => {
  const hasTypeFilters = availableTypes.length > 0 && onToggleType;
  const hasTagFilters = availableTags.length > 0 && onToggleTag;
  const showFilters = hasTypeFilters || hasTagFilters;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {showFilters && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Filter className="h-4 w-4" />
                {(selectedTypes.length > 0 || selectedTags.length > 0) && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                    {selectedTypes.length + selectedTags.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Filters</h4>

                {hasTypeFilters && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Type</Label>
                    <div className="space-y-2">
                      {availableTypes.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`type-${type}`}
                            checked={selectedTypes.includes(type)}
                            onCheckedChange={() => onToggleType!(type)}
                          />
                          <label
                            htmlFor={`type-${type}`}
                            className="text-sm capitalize cursor-pointer"
                          >
                            {type.replace('_', ' ')}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {hasTagFilters && availableTags.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => onToggleTag!(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Clear
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing {resultCount} of {totalCount} {resultCount === 1 ? 'item' : 'items'}
        </span>
        {hasActiveFilters && (
          <span className="text-primary">Filters active</span>
        )}
      </div>
    </div>
  );
};
