import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileUp, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  FileJson,
  FileText,
  ArrowRight,
  Download,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type SourceApp = 'notion' | 'evernote' | 'obsidian' | 'roam' | 'bear';

interface MigrationStep {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  itemsProcessed?: number;
  totalItems?: number;
}

interface ParsedItem {
  title: string;
  content: string;
  tags: string[];
  sourceUrl?: string;
  createdAt?: string;
}

const sourceApps: { id: SourceApp; name: string; icon: string; formats: string[]; description: string }[] = [
  { 
    id: 'notion', 
    name: 'Notion', 
    icon: '📝',
    formats: ['HTML', 'Markdown', 'CSV'],
    description: 'Export your Notion workspace and import pages as knowledge items'
  },
  { 
    id: 'evernote', 
    name: 'Evernote', 
    icon: '🐘',
    formats: ['ENEX'],
    description: 'Import your Evernote notes from .enex export files'
  },
  { 
    id: 'obsidian', 
    name: 'Obsidian', 
    icon: '💎',
    formats: ['Markdown'],
    description: 'Import markdown files from your Obsidian vault'
  },
  { 
    id: 'roam', 
    name: 'Roam Research', 
    icon: '🔮',
    formats: ['JSON', 'Markdown'],
    description: 'Import your Roam Research graph export'
  },
  { 
    id: 'bear', 
    name: 'Bear Notes', 
    icon: '🐻',
    formats: ['Markdown'],
    description: 'Import notes exported from Bear app'
  }
];

export const DataMigrationWizard: React.FC = () => {
  const [selectedSource, setSelectedSource] = useState<SourceApp | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [steps, setSteps] = useState<MigrationStep[]>([]);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [importProgress, setImportProgress] = useState(0);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  }, []);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const parseNotionExport = async (file: File): Promise<ParsedItem[]> => {
    const text = await file.text();
    const items: ParsedItem[] = [];
    
    if (file.name.endsWith('.md')) {
      // Parse markdown file
      const lines = text.split('\n');
      const title = lines[0]?.replace(/^#\s*/, '') || file.name.replace('.md', '');
      const content = lines.slice(1).join('\n').trim();
      
      // Extract tags from content (look for #tag patterns)
      const tagMatches = content.match(/#[\w-]+/g) || [];
      const tags = tagMatches.map(t => t.replace('#', ''));
      
      items.push({ title, content, tags });
    } else if (file.name.endsWith('.html')) {
      // Simple HTML parsing
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const title = doc.querySelector('title')?.textContent || file.name;
      const content = doc.body?.textContent || '';
      
      items.push({ title, content: content.trim(), tags: ['notion-import'] });
    } else if (file.name.endsWith('.csv')) {
      // CSV parsing
      const lines = text.split('\n');
      const headers = lines[0]?.split(',').map(h => h.trim().toLowerCase());
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const titleIndex = headers?.findIndex(h => h.includes('title') || h.includes('name'));
        const contentIndex = headers?.findIndex(h => h.includes('content') || h.includes('body'));
        
        if (titleIndex !== undefined && titleIndex >= 0) {
          items.push({
            title: values[titleIndex] || `Item ${i}`,
            content: contentIndex !== undefined ? values[contentIndex] || '' : '',
            tags: ['notion-import']
          });
        }
      }
    }
    
    return items;
  };

  const parseEvernoteExport = async (file: File): Promise<ParsedItem[]> => {
    const text = await file.text();
    const items: ParsedItem[] = [];
    
    // Simple ENEX parsing (XML-based)
    const noteRegex = /<note>[\s\S]*?<\/note>/g;
    const notes = text.match(noteRegex) || [];
    
    for (const note of notes) {
      const titleMatch = note.match(/<title>(.*?)<\/title>/);
      const contentMatch = note.match(/<content>[\s\S]*?<!\[CDATA\[([\s\S]*?)\]\]>[\s\S]*?<\/content>/);
      const tagMatches = note.match(/<tag>(.*?)<\/tag>/g);
      
      const title = titleMatch?.[1] || 'Untitled Note';
      let content = contentMatch?.[1] || '';
      
      // Strip HTML from content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      content = tempDiv.textContent || tempDiv.innerText || '';
      
      const tags = tagMatches?.map(t => t.replace(/<\/?tag>/g, '')) || ['evernote-import'];
      
      items.push({ title, content: content.trim(), tags });
    }
    
    return items;
  };

  const parseObsidianExport = async (file: File): Promise<ParsedItem[]> => {
    const text = await file.text();
    const items: ParsedItem[] = [];
    
    const lines = text.split('\n');
    const title = lines[0]?.replace(/^#\s*/, '') || file.name.replace('.md', '');
    
    // Parse frontmatter for tags
    let content = text;
    let tags: string[] = ['obsidian-import'];
    
    if (text.startsWith('---')) {
      const frontmatterEnd = text.indexOf('---', 3);
      if (frontmatterEnd > 0) {
        const frontmatter = text.slice(3, frontmatterEnd);
        content = text.slice(frontmatterEnd + 3).trim();
        
        // Extract tags from frontmatter
        const tagsMatch = frontmatter.match(/tags:\s*\[(.*?)\]/);
        if (tagsMatch) {
          tags = tagsMatch[1].split(',').map(t => t.trim().replace(/["']/g, ''));
        }
      }
    }
    
    // Also look for inline tags
    const inlineTags = content.match(/#[\w-]+/g) || [];
    tags = [...new Set([...tags, ...inlineTags.map(t => t.replace('#', ''))])];
    
    // Convert wikilinks to regular text
    content = content.replace(/\[\[(.*?)\]\]/g, '$1');
    
    items.push({ title, content, tags });
    
    return items;
  };

  const parseRoamExport = async (file: File): Promise<ParsedItem[]> => {
    const text = await file.text();
    const items: ParsedItem[] = [];
    
    if (file.name.endsWith('.json')) {
      try {
        const data = JSON.parse(text);
        
        // Roam JSON structure has pages array
        const pages = Array.isArray(data) ? data : data.pages || [];
        
        for (const page of pages) {
          const title = page.title || page['page-title'] || 'Untitled';
          const children = page.children || page.content || [];
          
          // Flatten children to content
          const content = flattenRoamChildren(children);
          
          items.push({ title, content, tags: ['roam-import'] });
        }
      } catch {
        console.error('Failed to parse Roam JSON');
      }
    } else {
      // Markdown export
      const parsed = await parseObsidianExport(file);
      return parsed.map(item => ({ ...item, tags: ['roam-import'] }));
    }
    
    return items;
  };

  const flattenRoamChildren = (children: any[], depth = 0): string => {
    if (!Array.isArray(children)) return '';
    
    return children.map(child => {
      const indent = '  '.repeat(depth);
      const text = child.string || child.text || '';
      const nested = flattenRoamChildren(child.children || [], depth + 1);
      return `${indent}- ${text}${nested ? '\n' + nested : ''}`;
    }).join('\n');
  };

  const parseBearExport = async (file: File): Promise<ParsedItem[]> => {
    // Bear uses markdown with specific format
    return parseObsidianExport(file).then(items => 
      items.map(item => ({ ...item, tags: [...item.tags.filter(t => t !== 'obsidian-import'), 'bear-import'] }))
    );
  };

  const processFiles = async () => {
    if (!selectedSource || files.length === 0) return;
    
    setIsProcessing(true);
    setSteps([
      { id: 'parse', title: 'Parsing files', status: 'processing' },
      { id: 'validate', title: 'Validating data', status: 'pending' },
      { id: 'import', title: 'Importing to Cortex', status: 'pending' }
    ]);
    
    try {
      // Step 1: Parse files
      const allItems: ParsedItem[] = [];
      
      for (const file of files) {
        let parsed: ParsedItem[] = [];
        
        switch (selectedSource) {
          case 'notion':
            parsed = await parseNotionExport(file);
            break;
          case 'evernote':
            parsed = await parseEvernoteExport(file);
            break;
          case 'obsidian':
            parsed = await parseObsidianExport(file);
            break;
          case 'roam':
            parsed = await parseRoamExport(file);
            break;
          case 'bear':
            parsed = await parseBearExport(file);
            break;
        }
        
        allItems.push(...parsed);
      }
      
      setParsedItems(allItems);
      setSteps(prev => prev.map(s => 
        s.id === 'parse' ? { ...s, status: 'completed', itemsProcessed: allItems.length } : s
      ));
      
      // Step 2: Validate
      setSteps(prev => prev.map(s => 
        s.id === 'validate' ? { ...s, status: 'processing' } : s
      ));
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const validItems = allItems.filter(item => item.title && item.title.trim());
      setSteps(prev => prev.map(s => 
        s.id === 'validate' ? { ...s, status: 'completed', itemsProcessed: validItems.length } : s
      ));
      
      // Step 3: Import
      setSteps(prev => prev.map(s => 
        s.id === 'import' ? { ...s, status: 'processing', totalItems: validItems.length } : s
      ));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to import data');
      }
      
      let imported = 0;
      for (const item of validItems) {
        const { error } = await supabase.from('knowledge_base').insert({
          user_id: user.id,
          title: item.title,
          content: item.content,
          tags: item.tags,
          type: 'note',
          source_url: item.sourceUrl
        });
        
        if (!error) {
          imported++;
          setImportProgress(Math.round((imported / validItems.length) * 100));
          setSteps(prev => prev.map(s => 
            s.id === 'import' ? { ...s, itemsProcessed: imported } : s
          ));
        }
      }
      
      setSteps(prev => prev.map(s => 
        s.id === 'import' ? { ...s, status: 'completed' } : s
      ));
      
      toast.success(`Successfully imported ${imported} items!`);
    } catch (error: any) {
      console.error('Migration error:', error);
      toast.error(`Migration failed: ${error.message}`);
      setSteps(prev => prev.map(s => 
        s.status === 'processing' ? { ...s, status: 'error' } : s
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const resetWizard = () => {
    setSelectedSource(null);
    setFiles([]);
    setSteps([]);
    setParsedItems([]);
    setImportProgress(0);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <FileUp size={20} />
          Data Migration Wizard
        </CardTitle>
        <CardDescription>
          Import your data from other note-taking apps
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!selectedSource ? (
          // Source Selection
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select the app you want to import from:
            </p>
            <div className="grid gap-3">
              {sourceApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => setSelectedSource(app.id)}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-colors text-left"
                >
                  <span className="text-2xl">{app.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{app.name}</span>
                      <div className="flex gap-1">
                        {app.formats.map(f => (
                          <Badge key={f} variant="outline" className="text-xs">
                            {f}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {app.description}
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        ) : steps.length === 0 ? (
          // File Upload
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {sourceApps.find(a => a.id === selectedSource)?.icon}
                </span>
                <span className="font-medium">
                  {sourceApps.find(a => a.id === selectedSource)?.name}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={resetWizard}>
                Change Source
              </Button>
            </div>

            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload size={32} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop your export files here, or click to browse
              </p>
              <input
                type="file"
                id="migration-files"
                className="hidden"
                multiple
                accept=".md,.html,.csv,.enex,.json,.txt"
                onChange={handleFileSelect}
              />
              <Button asChild variant="outline">
                <label htmlFor="migration-files" className="cursor-pointer">
                  <Download size={16} className="mr-2" />
                  Select Files
                </label>
              </Button>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selected Files</Label>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-2 rounded border border-border"
                      >
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-muted-foreground" />
                          <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {formatFileSize(file.size)}
                          </Badge>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <Button
              className="w-full"
              onClick={processFiles}
              disabled={files.length === 0}
            >
              <FileUp size={16} className="mr-2" />
              Start Migration
            </Button>
          </div>
        ) : (
          // Processing Steps
          <div className="space-y-4">
            <div className="space-y-3">
              {steps.map((step) => (
                <div 
                  key={step.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    {step.status === 'completed' && (
                      <CheckCircle size={18} className="text-green-500" />
                    )}
                    {step.status === 'processing' && (
                      <Loader2 size={18} className="text-primary animate-spin" />
                    )}
                    {step.status === 'pending' && (
                      <div className="w-[18px] h-[18px] rounded-full border-2 border-muted-foreground" />
                    )}
                    {step.status === 'error' && (
                      <AlertCircle size={18} className="text-destructive" />
                    )}
                    <span className="text-sm font-medium">{step.title}</span>
                  </div>
                  {step.itemsProcessed !== undefined && (
                    <Badge variant="outline">
                      {step.itemsProcessed}
                      {step.totalItems ? ` / ${step.totalItems}` : ''} items
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            {importProgress > 0 && importProgress < 100 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Importing...</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="h-2" />
              </div>
            )}

            {steps.every(s => s.status === 'completed') && (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle size={18} />
                  <span className="font-medium">Migration Complete!</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Your data has been successfully imported into Cortex.
                </p>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={resetWizard}
            >
              Start New Migration
            </Button>
          </div>
        )}

        {/* Help Text */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
          <AlertCircle size={16} className="text-muted-foreground mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium mb-1">How to export your data:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li><strong>Notion:</strong> Settings → Export → Markdown or HTML</li>
              <li><strong>Evernote:</strong> File → Export Notes → ENEX format</li>
              <li><strong>Obsidian:</strong> Select your vault's .md files</li>
              <li><strong>Roam:</strong> Export → JSON or Markdown</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Need to add Label import
import { Label } from "@/components/ui/label";

export default DataMigrationWizard;
