
import React, { useState, useRef } from 'react';
import { Upload, FileText, Globe, Database, Type, CheckCircle2, Loader2 } from 'lucide-react';
import { ImportSource } from '@/lib/types';
import AnimatedTransition from './AnimatedTransition';
import { cn } from '@/lib/utils';
import { useKnowledge } from '@/hooks/useKnowledge';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

const importSources: ImportSource[] = [
  { id: 'csv', name: 'CSV File', type: 'csv', icon: 'FileText', description: 'Import structured data from CSV files' },
  { id: 'file', name: 'Document Upload', type: 'file', icon: 'Upload', description: 'Upload documents, PDFs, and text files' },
  { id: 'url', name: 'Web URL', type: 'url', icon: 'Globe', description: 'Import content from websites and articles' },
  { id: 'text', name: 'Text Input', type: 'text', icon: 'Type', description: 'Directly input or paste text content' },
];

interface ImportSourceCardProps {
  source: ImportSource;
  onClick: () => void;
  isActive: boolean;
}

const ImportSourceCard: React.FC<ImportSourceCardProps> = ({ source, onClick, isActive }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const getIcon = () => {
    switch (source.icon) {
      case 'FileText': return <FileText size={24} />;
      case 'Database': return <Database size={24} />;
      case 'Globe': return <Globe size={24} />;
      case 'Upload': return <Upload size={24} />;
      case 'Type': return <Type size={24} />;
      default: return <FileText size={24} />;
    }
  };
  
  return (
    <div 
      className={cn(
        "glass-panel p-4 rounded-xl cursor-pointer transition-all duration-300",
        isActive ? "ring-2 ring-primary" : "",
        isHovered ? "translate-y-[-4px] shadow-md" : ""
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
          {getIcon()}
        </div>
        <div>
          <h3 className="font-medium">{source.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{source.description}</p>
        </div>
      </div>
    </div>
  );
};

// ---- CSV Import Panel ----
const CsvImportPanel: React.FC<{ onImport: (title: string, content: string) => Promise<void> }> = ({ onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }
    setUploading(true);
    setFileName(file.name);
    try {
      const text = await file.text();
      await onImport(file.name.replace('.csv', ''), text);
      toast.success(`Imported ${file.name} successfully`);
      setFileName(null);
    } catch {
      toast.error('Failed to import CSV file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-medium">Import CSV File</h3>
      <p className="text-muted-foreground">Upload a CSV file to import structured data into your knowledge base.</p>
      <div
        className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const file = e.dataTransfer.files[0];
          if (file && fileInputRef.current) {
            const dt = new DataTransfer();
            dt.items.add(file);
            fileInputRef.current.files = dt.files;
            fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }}
      >
        {uploading ? (
          <Loader2 size={40} className="mx-auto text-primary mb-4 animate-spin" />
        ) : fileName ? (
          <CheckCircle2 size={40} className="mx-auto text-green-500 mb-4" />
        ) : (
          <Upload size={40} className="mx-auto text-muted-foreground mb-4" />
        )}
        <p className="text-muted-foreground">
          {uploading ? `Importing ${fileName}...` : 'Drag and drop a CSV file here, or click to browse'}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFile}
        />
        <Button variant="default" className="mt-4" disabled={uploading}>
          Browse Files
        </Button>
      </div>
    </div>
  );
};

// ---- Helper: Convert file to base64 ----
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ---- Helper: Parse PDF via edge function ----
async function parsePdfFile(file: File): Promise<string> {
  const base64 = await fileToBase64(file);
  const { data, error } = await supabase.functions.invoke('parse-pdf', {
    body: { file_base64: base64, file_name: file.name },
  });
  if (error) throw new Error(error.message || 'PDF parsing failed');
  if (data?.warning && !data?.text) throw new Error(data.warning);
  return data?.text || '';
}

// ---- Helper: Parse DOCX via edge function ----
async function parseDocxFile(file: File): Promise<string> {
  const base64 = await fileToBase64(file);
  const { data, error } = await supabase.functions.invoke('parse-docx', {
    body: { file_base64: base64, file_name: file.name },
  });
  if (error) throw new Error(error.message || 'DOCX parsing failed');
  if (data?.warning && !data?.text) throw new Error(data.warning);
  return data?.text || '';
}

// ---- Document Upload Panel ----
const FileImportPanel: React.FC<{ onImport: (title: string, content: string) => Promise<void> }> = ({ onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const title = file.name.replace(/\.[^.]+$/, '');
        const lowerName = file.name.toLowerCase();
        if (lowerName.endsWith('.pdf')) {
          const text = await parsePdfFile(file);
          if (!text) {
            toast.warning(`No text extracted from ${file.name}. It may contain only images.`);
            continue;
          }
          await onImport(title, text);
        } else if (lowerName.endsWith('.docx')) {
          const text = await parseDocxFile(file);
          if (!text) {
            toast.warning(`No text extracted from ${file.name}.`);
            continue;
          }
          await onImport(title, text);
        } else {
          const text = await file.text();
          await onImport(title, text);
        }
      }
      toast.success(`Imported ${files.length} file(s) successfully`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to import file(s)');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-medium">Document Upload</h3>
      <p className="text-muted-foreground">Upload documents, PDFs, and text files to import into your knowledge base.</p>
      <div
        className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer.files.length && fileInputRef.current) {
            const dt = new DataTransfer();
            Array.from(e.dataTransfer.files).forEach(f => dt.items.add(f));
            fileInputRef.current.files = dt.files;
            fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }}
      >
        {uploading ? (
          <Loader2 size={40} className="mx-auto text-primary mb-4 animate-spin" />
        ) : (
          <Upload size={40} className="mx-auto text-muted-foreground mb-4" />
        )}
        <p className="text-muted-foreground">
          {uploading ? 'Importing...' : 'Drag and drop files here, or click to browse'}
        </p>
        <p className="text-xs text-muted-foreground mt-2">Supported: PDF, DOCX, TXT, MD, CSV, JSON</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md,.csv,.json,.log"
          multiple
          className="hidden"
          onChange={handleFiles}
        />
        <Button variant="default" className="mt-4" disabled={uploading}>
          Browse Files
        </Button>
      </div>
    </div>
  );
};

// ---- URL Import Panel ----
const UrlImportPanel: React.FC<{ onImport: (title: string, content: string, sourceUrl: string) => Promise<void> }> = ({ onImport }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }
    setLoading(true);
    try {
      await onImport(url, `Imported from: ${url}`, url);
      toast.success('URL saved to knowledge base');
      setUrl('');
    } catch {
      toast.error('Failed to import URL');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-medium">Import from URL</h3>
      <p className="text-muted-foreground">Save a website or article URL to your knowledge base.</p>
      <div className="space-y-2">
        <Label>Website URL</Label>
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/article"
        />
      </div>
      <Button onClick={handleImport} disabled={loading || !url.trim()}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Import URL
      </Button>
    </div>
  );
};

// ---- Text Input Panel ----
const TextImportPanel: React.FC<{ onImport: (title: string, content: string) => Promise<void> }> = ({ onImport }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please enter both a title and content');
      return;
    }
    setLoading(true);
    try {
      await onImport(title, content);
      toast.success('Saved to knowledge base');
      setTitle('');
      setContent('');
    } catch {
      toast.error('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-medium">Text Input</h3>
      <p className="text-muted-foreground">Directly input or paste text content.</p>
      <div className="space-y-2">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter a title for this content" />
      </div>
      <div className="space-y-2">
        <Label>Content</Label>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Enter or paste your content here..." className="min-h-32" />
      </div>
      <Button onClick={handleSave} disabled={loading || !title.trim() || !content.trim()}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Save to Knowledge Base
      </Button>
    </div>
  );
};

// ---- Main ImportPanel ----
export const ImportPanel: React.FC = () => {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const { addKnowledgeItem } = useKnowledge();

  const handleImport = async (title: string, content: string, sourceUrl?: string) => {
    await addKnowledgeItem({
      title,
      content,
      source_url: sourceUrl || null,
      tags: null,
      is_favorite: false,
    });
  };

  const handleUrlImport = async (title: string, content: string, sourceUrl: string) => {
    await handleImport(title, content, sourceUrl);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {importSources.map(source => (
          <ImportSourceCard
            key={source.id}
            source={source}
            onClick={() => setSelectedSource(source.id)}
            isActive={selectedSource === source.id}
          />
        ))}
      </div>
      
      <AnimatedTransition
        show={!!selectedSource}
        animation="slide-up"
        className="mt-8 glass-panel p-6 rounded-xl"
      >
        {selectedSource === 'csv' && <CsvImportPanel onImport={handleImport} />}
        {selectedSource === 'file' && <FileImportPanel onImport={handleImport} />}
        {selectedSource === 'url' && <UrlImportPanel onImport={handleUrlImport} />}
        {selectedSource === 'text' && <TextImportPanel onImport={handleImport} />}
      </AnimatedTransition>
    </div>
  );
};

export default ImportPanel;
