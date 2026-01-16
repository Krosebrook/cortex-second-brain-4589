import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  Check, 
  X, 
  GitMerge, 
  RefreshCw,
  Clock,
  Server,
  Smartphone,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Conflict, ConflictResolution } from '@/types/conflict';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ConflictResolutionPanelProps {
  conflicts: Conflict[];
  onResolve: (conflictId: string, resolution: ConflictResolution, mergedData?: any) => Promise<void>;
  onResolveAll: (resolution: ConflictResolution) => Promise<void>;
  onRefresh: () => void;
}

export const ConflictResolutionPanel: React.FC<ConflictResolutionPanelProps> = ({
  conflicts,
  onResolve,
  onResolveAll,
  onRefresh
}) => {
  const [expandedConflict, setExpandedConflict] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'local' | 'server'>('local');

  if (conflicts.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-8 text-center">
          <Check size={32} className="mx-auto text-green-500 mb-3" />
          <h3 className="font-medium text-foreground">No Conflicts</h3>
          <p className="text-sm text-muted-foreground mt-1">
            All your data is synchronized
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleResolve = async (conflictId: string, resolution: ConflictResolution, mergedData?: any) => {
    setResolvingId(conflictId);
    try {
      await onResolve(conflictId, resolution, mergedData);
      toast.success(`Conflict resolved: ${resolution}`);
    } catch (error: any) {
      toast.error(`Failed to resolve: ${error.message}`);
    } finally {
      setResolvingId(null);
    }
  };

  const getConflictTypeLabel = (type: Conflict['type']) => {
    switch (type) {
      case 'delete': return 'Deleted Item';
      case 'update': return 'Modified Content';
      case 'tag': return 'Tag Changes';
      case 'reorder': return 'Order Changed';
      default: return 'Conflict';
    }
  };

  const getConflictIcon = (type: Conflict['type']) => {
    switch (type) {
      case 'delete': return <X size={16} className="text-destructive" />;
      case 'update': return <RefreshCw size={16} className="text-yellow-500" />;
      case 'tag': return <GitMerge size={16} className="text-blue-500" />;
      default: return <AlertTriangle size={16} className="text-yellow-500" />;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const renderDiff = (expected: any, actual: any) => {
    if (!expected || !actual) return null;

    const expectedStr = typeof expected === 'string' ? expected : JSON.stringify(expected, null, 2);
    const actualStr = typeof actual === 'string' ? actual : JSON.stringify(actual, null, 2);

    return (
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as 'local' | 'server')}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="local" className="flex items-center gap-2">
            <Smartphone size={14} />
            Your Version
          </TabsTrigger>
          <TabsTrigger value="server" className="flex items-center gap-2">
            <Server size={14} />
            Server Version
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="local">
          <ScrollArea className="h-48 rounded-md border border-border p-3 bg-muted/30">
            <pre className="text-xs font-mono whitespace-pre-wrap">{expectedStr}</pre>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="server">
          <ScrollArea className="h-48 rounded-md border border-border p-3 bg-muted/30">
            <pre className="text-xs font-mono whitespace-pre-wrap">{actualStr}</pre>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground flex items-center gap-2">
              <AlertTriangle size={20} className="text-yellow-500" />
              Sync Conflicts
            </CardTitle>
            <CardDescription>
              {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} detected
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw size={14} className="mr-1" />
              Refresh
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => onResolveAll('skip')}
            >
              Skip All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="max-h-[500px]">
          <div className="space-y-3">
            {conflicts.map((conflict) => (
              <div 
                key={`${conflict.actionId}-${conflict.itemId}`}
                className={cn(
                  "rounded-lg border border-border overflow-hidden",
                  expandedConflict === conflict.itemId && "ring-1 ring-primary"
                )}
              >
                {/* Conflict Header */}
                <button
                  className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
                  onClick={() => setExpandedConflict(
                    expandedConflict === conflict.itemId ? null : conflict.itemId
                  )}
                >
                  <div className="flex items-center gap-3">
                    {getConflictIcon(conflict.type)}
                    <div className="text-left">
                      <p className="font-medium text-sm">
                        {conflict.itemTitle || `Item ${conflict.itemId.slice(0, 8)}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getConflictTypeLabel(conflict.type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock size={10} />
                          {formatTimestamp(conflict.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {expandedConflict === conflict.itemId ? (
                    <ChevronUp size={16} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={16} className="text-muted-foreground" />
                  )}
                </button>

                {/* Expanded Content */}
                {expandedConflict === conflict.itemId && (
                  <div className="border-t border-border p-4 space-y-4 bg-card/50">
                    {/* Diff View */}
                    {conflict.type === 'update' && renderDiff(conflict.expected, conflict.actual)}

                    {/* Conflict Description */}
                    {conflict.type === 'delete' && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-sm text-destructive">
                          This item was deleted on the server but you have local changes.
                        </p>
                      </div>
                    )}

                    {conflict.type === 'tag' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Your tags:</span>
                          <div className="flex gap-1">
                            {(conflict.expected?.tags || []).map((tag: string) => (
                              <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Server tags:</span>
                          <div className="flex gap-1">
                            {(conflict.actual?.tags || []).map((tag: string) => (
                              <Badge key={tag} variant="outline">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Resolution Actions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolve(conflict.itemId, 'skip')}
                        disabled={resolvingId === conflict.itemId}
                      >
                        <X size={14} className="mr-1" />
                        Skip
                      </Button>
                      
                      {conflict.type !== 'delete' && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleResolve(conflict.itemId, 'apply', conflict.expected)}
                            disabled={resolvingId === conflict.itemId}
                          >
                            <Smartphone size={14} className="mr-1" />
                            Keep Mine
                          </Button>
                          
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleResolve(conflict.itemId, 'apply', conflict.actual)}
                            disabled={resolvingId === conflict.itemId}
                          >
                            <Server size={14} className="mr-1" />
                            Keep Server
                          </Button>
                        </>
                      )}
                      
                      {conflict.type === 'update' && (
                        <Button
                          size="sm"
                          onClick={() => handleResolve(conflict.itemId, 'merge')}
                          disabled={resolvingId === conflict.itemId}
                        >
                          <GitMerge size={14} className="mr-1" />
                          Merge Both
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Bulk Actions */}
        {conflicts.length > 1 && (
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3">
              Resolve all conflicts at once:
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onResolveAll('skip')}
              >
                Skip All
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onResolveAll('apply')}
              >
                Keep All Local
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConflictResolutionPanel;
