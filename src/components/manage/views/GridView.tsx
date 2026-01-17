import { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { CortexItem } from '../cortex-data';
import { Check, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVirtualScroll } from '@/hooks/useVirtualScroll';

interface GridViewProps {
  items: CortexItem[];
  selectedItems?: string[];
  onSelectItem?: (id: string) => void;
}

const VIRTUALIZATION_THRESHOLD = 50;
const ROW_HEIGHT = 240;
const COLUMNS_BY_BREAKPOINT = { sm: 1, md: 2, lg: 3 };

const GridView = ({ 
  items, 
  selectedItems = [], 
  onSelectItem = () => {} 
}: GridViewProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const enableVirtualization = items.length > VIRTUALIZATION_THRESHOLD;

  // Use 3 columns for virtualization calculations
  const columnsCount = COLUMNS_BY_BREAKPOINT.lg;
  const rowCount = Math.ceil(items.length / columnsCount);

  const virtualizer = useVirtualScroll({
    count: rowCount,
    parentRef,
    estimateSize: ROW_HEIGHT,
    overscan: 3,
    enabled: enableVirtualization,
  });

  const renderCard = (item: CortexItem) => {
    const isSelected = selectedItems.includes(item.id);
    
    return (
      <Card 
        key={item.id} 
        className={cn(
          "overflow-hidden hover:shadow-md transition-shadow relative",
          isSelected && "ring-2 ring-primary"
        )}
      >
        <div 
          className="absolute right-2 top-2 cursor-pointer"
          onClick={() => onSelectItem(item.id)}
        >
          {isSelected ? (
            <div className="rounded-md bg-primary text-white p-0.5">
              <Check size={16} />
            </div>
          ) : (
            <div className="rounded-md border border-border p-0.5 bg-background">
              <Square size={16} />
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
          <div className="mb-2">
            <span className="px-2 py-1 rounded-full bg-primary/10 text-xs font-medium">
              {item.type}
            </span>
            <span className="ml-2 text-sm text-muted-foreground">{item.source}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{item.pitch}</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {item.keywords.map((keyword, idx) => (
              <span 
                key={idx} 
                className="px-2 py-0.5 rounded-full bg-secondary/20 text-xs"
              >
                {keyword}
              </span>
            ))}
          </div>
          <a href={item.url} className="text-sm text-blue-500 hover:underline">{item.url}</a>
        </div>
      </Card>
    );
  };

  if (!enableVirtualization) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {items.map((item) => renderCard(item))}
      </div>
    );
  }

  return (
    <div 
      ref={parentRef} 
      className="overflow-auto p-4"
      style={{ maxHeight: 'calc(100vh - 200px)' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columnsCount;
          const rowItems = items.slice(startIndex, startIndex + columnsCount);
          
          return (
            <div
              key={virtualRow.key}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {rowItems.map((item) => renderCard(item))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GridView;
