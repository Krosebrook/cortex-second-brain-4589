import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  FileUp, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  FileText,
  ArrowRight,
  ArrowLeft,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Tag,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type SourceApp = 'notion' | 'evernote' | 'obsidian' | 'roam' | 'bear';
type WizardStep = 'source' | 'upload' | 'preview' | 'importing' | 'complete';

interface MigrationStep {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  itemsProcessed?: number;
  totalItems?: number;
}

interface ParsedItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  sourceUrl?: string;
  createdAt?: string;
  selected: boolean;
  valid: boolean;
  validationErrors: string[];
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
  const [wizardStep, setWizardStep] = useState<WizardStep>('source');
  const [selectedSource, setSelectedSource] = useState<SourceApp | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [steps, setSteps] = useState<MigrationStep[]>([]);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  }, []);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const generateId = () => Math.random().toString(36).substring(2, 11);

  const validateItem = (item: Omit<ParsedItem, 'id' | 'selected' | 'valid' | 'validationErrors'>): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!item.title || item.title.trim().length === 0) {
      errors.push('Title is required');
    } else if (item.title.length > 200) {
      errors.push('Title must be less than 200 characters');
    }
    
    if (item.content && item.content.length > 100000) {
      errors.push('Content exceeds maximum length (100KB)');
    }
    
    if (item.tags && item.tags.length > 20) {
      errors.push('Maximum 20 tags allowed');
    }
    
    return { valid: errors.length === 0, errors };
  };

  const parseNotionExport = async (file: File): Promise<ParsedItem[]> => {
    const text = await file.text();
    const items: ParsedItem[] = [];
    
    if (file.name.endsWith('.md')) {
      const lines = text.split('\n');
      const title = lines[0]?.replace(/^#\s*/, '') || file.name.replace('.md', '');
      const content = lines.slice(1).join('\n').trim();
      const tagMatches = content.match(/#[\w-]+/g) || [];
      const tags = tagMatches.map(t => t.replace('#', ''));
      
      const validation = validateItem({ title, content, tags });
      items.push({ 
        id: generateId(),
        title, 
        content, 
        tags: [...tags, 'notion-import'],
        selected: true,
        valid: validation.valid,
        validationErrors: validation.errors
      });
    } else if (file.name.endsWith('.html')) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const title = doc.querySelector('title')?.textContent || file.name;
      const content = doc.body?.textContent || '';
      
      const validation = validateItem({ title, content: content.trim(), tags: ['notion-import'] });
      items.push({ 
        id: generateId(),
        title, 
        content: content.trim(), 
        tags: ['notion-import'],
        selected: true,
        valid: validation.valid,
        validationErrors: validation.errors
      });
    } else if (file.name.endsWith('.csv')) {
      const lines = text.split('\n');
      const headers = lines[0]?.split(',').map(h => h.trim().toLowerCase());
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const titleIndex = headers?.findIndex(h => h.includes('title') || h.includes('name'));
        const contentIndex = headers?.findIndex(h => h.includes('content') || h.includes('body'));
        
        if (titleIndex !== undefined && titleIndex >= 0 && values[titleIndex]?.trim()) {
          const title = values[titleIndex] || `Item ${i}`;
          const content = contentIndex !== undefined ? values[contentIndex] || '' : '';
          const validation = validateItem({ title, content, tags: ['notion-import'] });
          
          items.push({
            id: generateId(),
            title,
            content,
            tags: ['notion-import'],
            selected: true,
            valid: validation.valid,
            validationErrors: validation.errors
          });
        }
      }
    }
    
    return items;
  };

  const parseEvernoteExport = async (file: File): Promise<ParsedItem[]> => {
    const text = await file.text();
    const items: ParsedItem[] = [];
    
    const noteRegex = /<note>[\s\S]*?<\/note>/g;
    const notes = text.match(noteRegex) || [];
    
    for (const note of notes) {
      const titleMatch = note.match(/<title>(.*?)<\/title>/);
      const contentMatch = note.match(/<content>[\s\S]*?<!\[CDATA\[([\s\S]*?)\]\]>[\s\S]*?<\/content>/);
      const tagMatches = note.match(/<tag>(.*?)<\/tag>/g);
      
      const title = titleMatch?.[1] || 'Untitled Note';
      let content = contentMatch?.[1] || '';
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      content = tempDiv.textContent || tempDiv.innerText || '';
      
      const tags = tagMatches?.map(t => t.replace(/<\/?tag>/g, '')) || [];
      const validation = validateItem({ title, content: content.trim(), tags: [...tags, 'evernote-import'] });
      
      items.push({ 
        id: generateId(),
        title, 
        content: content.trim(), 
        tags: [...tags, 'evernote-import'],
        selected: true,
        valid: validation.valid,
        validationErrors: validation.errors
      });
    }
    
    return items;
  };

  const parseObsidianExport = async (file: File): Promise<ParsedItem[]> => {
    const text = await file.text();
    const lines = text.split('\n');
    const title = lines[0]?.replace(/^#\s*/, '') || file.name.replace('.md', '');
    
    let content = text;
    let tags: string[] = [];
    
    if (text.startsWith('---')) {
      const frontmatterEnd = text.indexOf('---', 3);
      if (frontmatterEnd > 0) {
        const frontmatter = text.slice(3, frontmatterEnd);
        content = text.slice(frontmatterEnd + 3).trim();
        
        const tagsMatch = frontmatter.match(/tags:\s*\[(.*?)\]/);
        if (tagsMatch) {
          tags = tagsMatch[1].split(',').map(t => t.trim().replace(/["']/g, ''));
        }
      }
    }
    
    const inlineTags = content.match(/#[\w-]+/g) || [];
    tags = [...new Set([...tags, ...inlineTags.map(t => t.replace('#', '')), 'obsidian-import'])];
    content = content.replace(/\[\[(.*?)\]\]/g, '$1');
    
    const validation = validateItem({ title, content, tags });
    
    return [{ 
      id: generateId(),
      title, 
      content, 
      tags,
      selected: true,
      valid: validation.valid,
      validationErrors: validation.errors
    }];
  };

  const parseRoamExport = async (file: File): Promise<ParsedItem[]> => {
    const text = await file.text();
    const items: ParsedItem[] = [];
    
    if (file.name.endsWith('.json')) {
      try {
        const data = JSON.parse(text);
        const pages = Array.isArray(data) ? data : data.pages || [];
        
        for (const page of pages) {
          const title = page.title || page['page-title'] || 'Untitled';
          const children = page.children || page.content || [];
          const content = flattenRoamChildren(children);
          const validation = validateItem({ title, content, tags: ['roam-import'] });
          
          items.push({ 
            id: generateId(),
            title, 
            content, 
            tags: ['roam-import'],
            selected: true,
            valid: validation.valid,
            validationErrors: validation.errors
          });
        }
      } catch {
        console.error('Failed to parse Roam JSON');
      }
    } else {
      const parsed = await parseObsidianExport(file);
      return parsed.map(item => ({ 
        ...item, 
        tags: item.tags.filter(t => t !== 'obsidian-import').concat('roam-import')
      }));
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
    const items = await parseObsidianExport(file);
    return items.map(item => ({ 
      ...item, 
      tags: item.tags.filter(t => t !== 'obsidian-import').concat('bear-import')
    }));
  };

  const parseFiles = async () => {
    if (!selectedSource || files.length === 0) return;
    
    setIsProcessing(true);
    
    try {
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
      setWizardStep('preview');
      toast.success(`Parsed ${allItems.length} items from ${files.length} file(s)`);
    } catch (error: any) {
      console.error('Parse error:', error);
      toast.error(`Failed to parse files: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const importItems = async () => {
    const selectedItems = parsedItems.filter(item => item.selected && item.valid);
    
    if (selectedItems.length === 0) {
      toast.error('No valid items selected for import');
      return;
    }
    
    setWizardStep('importing');
    setSteps([
      { id: 'import', title: 'Importing items', status: 'processing', totalItems: selectedItems.length, itemsProcessed: 0 }
    ]);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to import data');
      }
      
      let imported = 0;
      for (const item of selectedItems) {
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
          setImportProgress(Math.round((imported / selectedItems.length) * 100));
          setSteps(prev => prev.map(s => ({ ...s, itemsProcessed: imported })));
        }
      }
      
      setSteps(prev => prev.map(s => ({ ...s, status: 'completed' })));
      setWizardStep('complete');
      toast.success(`Successfully imported ${imported} items!`);
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(`Import failed: ${error.message}`);
      setSteps(prev => prev.map(s => ({ ...s, status: 'error' })));
    }
  };

  const resetWizard = () => {
    setWizardStep('source');
    setSelectedSource(null);
    setFiles([]);
    setSteps([]);
    setParsedItems([]);
    setImportProgress(0);
    setSearchQuery('');
    setEditingItem(null);
    setExpandedItem(null);
  };

  const toggleItemSelection = (id: string) => {
    setParsedItems(prev => prev.map(item => 
      item.id === id ? { ...item, selected: !item.selected } : item
    ));
  };

  const toggleSelectAll = () => {
    const validItems = parsedItems.filter(i => i.valid);
    const allSelected = validItems.every(i => i.selected);
    setParsedItems(prev => prev.map(item => 
      item.valid ? { ...item, selected: !allSelected } : item
    ));
  };

  const updateItem = (id: string, updates: Partial<ParsedItem>) => {
    setParsedItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, ...updates };
      const validation = validateItem(updated);
      return { ...updated, valid: validation.valid, validationErrors: validation.errors };
    }));
  };

  const removeItem = (id: string) => {
    setParsedItems(prev => prev.filter(item => item.id !== id));
  };

  const filteredItems = parsedItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedCount = parsedItems.filter(i => i.selected && i.valid).length;
  const validCount = parsedItems.filter(i => i.valid).length;
  const invalidCount = parsedItems.filter(i => !i.valid).length;

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
        {/* Step Indicators */}
        <div className="flex items-center justify-between mb-4">
          {['source', 'upload', 'preview', 'importing'].map((step, index) => (
            <React.Fragment key={step}>
              <div className={`flex items-center gap-2 ${
                wizardStep === step ? 'text-primary' : 
                ['source', 'upload', 'preview', 'importing'].indexOf(wizardStep) > index ? 'text-green-500' : 'text-muted-foreground'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  wizardStep === step ? 'bg-primary text-primary-foreground' :
                  ['source', 'upload', 'preview', 'importing'].indexOf(wizardStep) > index ? 'bg-green-500 text-white' : 'bg-muted'
                }`}>
                  {['source', 'upload', 'preview', 'importing'].indexOf(wizardStep) > index ? <CheckCircle size={16} /> : index + 1}
                </div>
                <span className="text-xs hidden sm:inline capitalize">{step}</span>
              </div>
              {index < 3 && <div className="flex-1 h-0.5 bg-muted mx-2" />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Source Selection */}
        {wizardStep === 'source' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select the app you want to import from:
            </p>
            <div className="grid gap-3">
              {sourceApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => {
                    setSelectedSource(app.id);
                    setWizardStep('upload');
                  }}
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
        )}

        {/* Step 2: File Upload */}
        {wizardStep === 'upload' && (
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
              <Button variant="ghost" size="sm" onClick={() => setWizardStep('source')}>
                <ArrowLeft size={16} className="mr-1" />
                Back
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
                <Label className="text-sm font-medium">Selected Files ({files.length})</Label>
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
              onClick={parseFiles}
              disabled={files.length === 0 || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Eye size={16} className="mr-2" />
                  Preview Import
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step 3: Preview & Edit */}
        {wizardStep === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => setWizardStep('upload')}>
                  <ArrowLeft size={16} className="mr-1" />
                  Back
                </Button>
                <div className="text-sm">
                  <span className="text-green-500 font-medium">{validCount}</span> valid, 
                  <span className="text-destructive font-medium ml-1">{invalidCount}</span> invalid, 
                  <span className="text-primary font-medium ml-1">{selectedCount}</span> selected
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={toggleSelectAll}>
                {parsedItems.filter(i => i.valid).every(i => i.selected) ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[400px] border rounded-lg">
              <div className="p-2 space-y-2">
                {filteredItems.map((item) => (
                  <div 
                    key={item.id}
                    className={`rounded-lg border ${
                      !item.valid ? 'border-destructive/50 bg-destructive/5' : 
                      item.selected ? 'border-primary/50 bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start gap-3 p-3">
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={() => toggleItemSelection(item.id)}
                        disabled={!item.valid}
                      />
                      <div className="flex-1 min-w-0">
                        {editingItem === item.id ? (
                          <Input
                            value={item.title}
                            onChange={(e) => updateItem(item.id, { title: e.target.value })}
                            onBlur={() => setEditingItem(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingItem(null)}
                            autoFocus
                            className="h-7 text-sm"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{item.title}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => setEditingItem(item.id)}
                            >
                              <Edit size={12} />
                            </Button>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mt-1">
                          {item.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              <Tag size={10} className="mr-1" />
                              {tag}
                            </Badge>
                          ))}
                          {item.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{item.tags.length - 3}
                            </Badge>
                          )}
                        </div>

                        {!item.valid && item.validationErrors.length > 0 && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-destructive">
                            <AlertCircle size={12} />
                            {item.validationErrors.join(', ')}
                          </div>
                        )}

                        {expandedItem === item.id && (
                          <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
                            <p className="whitespace-pre-wrap line-clamp-6">
                              {item.content || '(No content)'}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Button
              className="w-full"
              onClick={importItems}
              disabled={selectedCount === 0}
            >
              <FileUp size={16} className="mr-2" />
              Import {selectedCount} Items
            </Button>
          </div>
        )}

        {/* Step 4: Importing */}
        {wizardStep === 'importing' && (
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
                    {step.status === 'error' && (
                      <AlertCircle size={18} className="text-destructive" />
                    )}
                    <span className="text-sm font-medium">{step.title}</span>
                  </div>
                  <Badge variant="outline">
                    {step.itemsProcessed} / {step.totalItems}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="h-2" />
            </div>
          </div>
        )}

        {/* Step 5: Complete */}
        {wizardStep === 'complete' && (
          <div className="space-y-4 text-center py-8">
            <CheckCircle size={48} className="mx-auto text-green-500" />
            <h3 className="text-lg font-semibold">Migration Complete!</h3>
            <p className="text-sm text-muted-foreground">
              Your data has been successfully imported into Cortex.
            </p>
            <Button onClick={resetWizard} variant="outline">
              Start New Migration
            </Button>
          </div>
        )}

        {/* Help Text */}
        {wizardStep !== 'complete' && (
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
        )}
      </CardContent>
    </Card>
  );
};

export default DataMigrationWizard;
