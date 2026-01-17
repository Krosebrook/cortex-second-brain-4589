import { useRef } from 'react';
import { Check, Square } from 'lucide-react';
import { CortexItem } from '../cortex-data';
import { cn } from '@/lib/utils';
import { useVirtualScroll } from '@/hooks/useVirtualScroll';

interface ListViewProps {
  items: CortexItem[];
  selectedItems?: string[];
  onSelectItem?: (id: string) => void;
}

const VIRTUALIZATION_THRESHOLD = 50;
const ITEM_HEIGHT = 120;

const ListView = ({ 
  items, 
  selectedItems = [], 
  onSelectItem = () => {} 
}: ListViewProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const enableVirtualization = items.length > VIRTUALIZATION_THRESHOLD;

  const virtualizer = useVirtualScroll({
    count: items.length,
    parentRef,
    estimateSize: ITEM_HEIGHT,
    overscan: 5,
    enabled: enableVirtualization,
  });

  const renderItem = (item: CortexItem) => {
    const isSelected = selectedItems.includes(item.id);
    
    return (
      <div 
        key={item.id} 
        className={cn(
          "flex border-b border-border/50 pb-3 relative pl-10",
          isSelected && "bg-primary/5"
        )}
      >
        <div 
          className="absolute left-0 top-1 cursor-pointer"
          onClick={() => onSelectItem(item.id)}
        >
          {isSelected ? (
            <div className="rounded-md bg-primary text-white p-0.5">
              <Check size={16} />
            </div>
          ) : (
            <div className="rounded-md border border-border p-0.5">
              <Square size={16} />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold">{item.title}</h3>
          <div className="flex items-center gap-3 mt-1 mb-2">
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-xs font-medium">
              {item.type}
            </span>
            <span className="text-sm text-muted-foreground">{item.source}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{item.pitch}</p>
          <div className="flex flex-wrap gap-1">
            {item.keywords.map((keyword, idx) => (
              <span 
                key={idx} 
                className="px-2 py-0.5 rounded-full bg-secondary/20 text-xs"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center">
          <a href={item.url} className="text-sm text-blue-500 hover:underline">{item.url}</a>
        </div>
      </div>
    );
  };

  if (!enableVirtualization) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {items.map((item) => renderItem(item))}
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
          const item = items[virtualRow.index];
          
          return (
            <div
              key={virtualRow.key}
              className="mb-3"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderItem(item)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ListView;
