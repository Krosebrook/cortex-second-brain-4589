import { useRef } from 'react';
import { ArrowUpDown, Check, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CortexItem, columns } from '../cortex-data';
import { cn } from '@/lib/utils';
import { useVirtualScroll } from '@/hooks/useVirtualScroll';

interface TableViewProps {
  items: CortexItem[];
  selectedItems?: string[];
  onSelectItem?: (id: string) => void;
}

const VIRTUALIZATION_THRESHOLD = 50;
const ROW_HEIGHT = 64;

const TableView = ({ 
  items, 
  selectedItems = [], 
  onSelectItem = () => {} 
}: TableViewProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const enableVirtualization = items.length > VIRTUALIZATION_THRESHOLD;

  const virtualizer = useVirtualScroll({
    count: items.length,
    parentRef,
    estimateSize: ROW_HEIGHT,
    overscan: 10,
    enabled: enableVirtualization,
  });

  const renderRow = (item: CortexItem, style?: React.CSSProperties) => {
    const isSelected = selectedItems.includes(item.id);
    
    return (
      <TableRow 
        key={item.id} 
        className={cn(
          "hover:bg-muted/30",
          isSelected && "bg-primary/5"
        )}
        style={style}
      >
        <TableCell className="w-10">
          <div 
            className="cursor-pointer"
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
        </TableCell>
        <TableCell className="font-medium">{item.title}</TableCell>
        <TableCell className="text-blue-500 hover:underline">
          <a href={item.url}>{item.url}</a>
        </TableCell>
        <TableCell>
          <span className="px-2 py-1 rounded-full bg-primary/10 text-xs font-medium">
            {item.type}
          </span>
        </TableCell>
        <TableCell>{item.createdDate}</TableCell>
        <TableCell>
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
        </TableCell>
        <TableCell>{item.source}</TableCell>
        <TableCell>{item.pitch}</TableCell>
        <TableCell>{item.writer}</TableCell>
      </TableRow>
    );
  };

  if (!enableVirtualization) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            {columns.map((column) => (
              <TableHead key={column.id} className="py-2">
                <div className="flex items-center">
                  {column.name}
                  {column.sortable && (
                    <Button variant="ghost" size="sm" className="ml-1 h-6 w-6 p-0">
                      <ArrowUpDown size={14} />
                    </Button>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => renderRow(item))}
        </TableBody>
      </Table>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            {columns.map((column) => (
              <TableHead key={column.id} className="py-2">
                <div className="flex items-center">
                  {column.name}
                  {column.sortable && (
                    <Button variant="ghost" size="sm" className="ml-1 h-6 w-6 p-0">
                      <ArrowUpDown size={14} />
                    </Button>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
      </Table>
      
      <div 
        ref={parentRef} 
        className="flex-1 overflow-auto"
        style={{ maxHeight: 'calc(100vh - 300px)' }}
      >
        <Table>
          <TableBody>
            <tr style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
              <td style={{ padding: 0 }}>
                <div style={{ position: 'relative', height: '100%' }}>
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const item = items[virtualRow.index];
                    return (
                      <div
                        key={virtualRow.key}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <Table>
                          <TableBody>
                            {renderRow(item)}
                          </TableBody>
                        </Table>
                      </div>
                    );
                  })}
                </div>
              </td>
            </tr>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TableView;
