import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Calendar, Link, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface KnowledgeItem {
  id: string;
  title: string;
  content?: string | null;
  type?: string | null;
  category?: string | null;
  tags?: string[] | null;
  source_url?: string | null;
  created_at: string;
  updated_at: string;
}

interface KnowledgeDetailDialogProps {
  item: KnowledgeItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const KnowledgeDetailDialog: React.FC<KnowledgeDetailDialogProps> = ({
  item,
  open,
  onOpenChange,
}) => {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <span className="break-words">{item.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {item.type && (
            <span className="flex items-center gap-1">
              <Badge variant="secondary" className="text-xs">{item.type}</Badge>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
          </span>
          {item.source_url && (
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <Link className="h-3 w-3" />
              Source
            </a>
          )}
        </div>

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">Content</span>
          {item.content && <CopyButton content={item.content} />}
        </div>
        <ScrollArea className="flex-1 min-h-0 max-h-[50vh] rounded-md border p-4 bg-muted/30">
          {item.content ? (
            <pre className="whitespace-pre-wrap break-words text-sm text-foreground font-sans leading-relaxed">
              {item.content}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground italic">No content available</p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
