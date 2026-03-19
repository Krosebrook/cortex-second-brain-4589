import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { FileText, Calendar, Link, Copy, Check, Pencil, Save, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

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
  onUpdate?: (id: string, updates: { title?: string; content?: string | null }) => Promise<void>;
}

const CopyButton: React.FC<{ content: string }> = ({ content }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 gap-1.5 text-xs text-muted-foreground">
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
};

export const KnowledgeDetailDialog: React.FC<KnowledgeDetailDialogProps> = ({
  item,
  open,
  onOpenChange,
  onUpdate,
}) => {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setEditTitle(item.title);
      setEditContent(item.content || '');
    }
    setEditing(false);
  }, [item]);

  if (!item) return null;

  const handleSave = async () => {
    if (!onUpdate) return;
    setSaving(true);
    try {
      await onUpdate(item.id, { title: editTitle, content: editContent || null });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditTitle(item.title);
    setEditContent(item.content || '');
    setEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            {editing ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-lg font-semibold"
              />
            ) : (
              <span className="break-words">{item.title}</span>
            )}
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
          <div className="flex items-center gap-1">
            {!editing && item.content && <CopyButton content={item.content} />}
            {onUpdate && !editing && (
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="h-7 gap-1.5 text-xs text-muted-foreground">
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
            {editing && (
              <>
                <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving} className="h-7 gap-1.5 text-xs text-muted-foreground">
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={handleSave} disabled={saving} className="h-7 gap-1.5 text-xs">
                  <Save className="h-3.5 w-3.5" />
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </>
            )}
          </div>
        </div>

        {editing ? (
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="flex-1 min-h-[200px] max-h-[50vh] font-sans text-sm leading-relaxed resize-none"
            placeholder="Enter content…"
          />
        ) : (
          <ScrollArea className="flex-1 min-h-0 max-h-[50vh] rounded-md border p-4 bg-muted/30">
            {item.content ? (
              <pre className="whitespace-pre-wrap break-words text-sm text-foreground font-sans leading-relaxed">
                {item.content}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground italic">No content available</p>
            )}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};