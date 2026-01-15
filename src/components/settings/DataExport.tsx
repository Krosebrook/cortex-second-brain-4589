import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  FileText,
  MessageSquare,
  BookOpen,
  Loader2,
  CheckCircle,
  AlertCircle,
  Archive
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { exportToCSV, exportToPDF, ExportFormat } from '@/utils/exportUtils';

interface ExportOptions {
  includeChats: boolean;
  includeMessages: boolean;
  includeKnowledge: boolean;
  format: ExportFormat;
}

interface ExportProgress {
  status: 'idle' | 'loading' | 'exporting' | 'complete' | 'error';
  message: string;
  progress: number;
}

const FORMAT_OPTIONS = [
  {
    value: 'json' as ExportFormat,
    label: 'JSON',
    icon: <FileJson size={18} className="text-amber-500" />,
    description: 'Full data with structure preserved'
  },
  {
    value: 'csv' as ExportFormat,
    label: 'CSV',
    icon: <FileSpreadsheet size={18} className="text-green-500" />,
    description: 'Spreadsheet compatible format'
  },
  {
    value: 'pdf' as ExportFormat,
    label: 'PDF',
    icon: <FileText size={18} className="text-red-500" />,
    description: 'Printable document format'
  }
];

export const DataExport: React.FC = () => {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    includeChats: true,
    includeMessages: true,
    includeKnowledge: true,
    format: 'json'
  });
  const [progress, setProgress] = useState<ExportProgress>({
    status: 'idle',
    message: '',
    progress: 0
  });

  const handleExport = async () => {
    if (!user) {
      toast.error('Please log in to export data');
      return;
    }

    if (!options.includeChats && !options.includeKnowledge) {
      toast.error('Please select at least one data type to export');
      return;
    }

    try {
      setProgress({ status: 'loading', message: 'Preparing export...', progress: 10 });

      const exportData: {
        exportDate: string;
        userId: string;
        chats?: any[];
        messages?: any[];
        knowledge?: any[];
      } = {
        exportDate: new Date().toISOString(),
        userId: user.id
      };

      // Fetch chats
      if (options.includeChats) {
        setProgress({ status: 'loading', message: 'Loading chats...', progress: 20 });
        
        const { data: chats, error: chatsError } = await supabase
          .from('chats')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (chatsError) throw chatsError;
        exportData.chats = chats || [];

        // Fetch messages if requested
        if (options.includeMessages && chats && chats.length > 0) {
          setProgress({ status: 'loading', message: 'Loading messages...', progress: 40 });
          
          const chatIds = chats.map(c => c.id);
          const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select('*')
            .in('chat_id', chatIds)
            .order('created_at', { ascending: true });

          if (messagesError) throw messagesError;
          exportData.messages = messages || [];
        }
      }

      // Fetch knowledge base
      if (options.includeKnowledge) {
        setProgress({ status: 'loading', message: 'Loading knowledge base...', progress: 60 });
        
        const { data: knowledge, error: knowledgeError } = await supabase
          .from('knowledge_base')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (knowledgeError) throw knowledgeError;
        exportData.knowledge = knowledge || [];
      }

      setProgress({ status: 'exporting', message: 'Creating export file...', progress: 80 });

      // Generate export based on format
      const timestamp = new Date().toISOString().split('T')[0];
      let blob: Blob;
      let filename: string;

      switch (options.format) {
        case 'json':
          blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          filename = `cortex-backup-${timestamp}.json`;
          break;

        case 'csv':
          // For CSV, we'll create a zip-like structure with multiple files
          // or combine data into a single CSV
          const csvData: any[] = [];
          
          if (exportData.chats) {
            exportData.chats.forEach(chat => {
              csvData.push({
                type: 'chat',
                id: chat.id,
                title: chat.title,
                content: '',
                created_at: chat.created_at,
                updated_at: chat.updated_at
              });
            });
          }
          
          if (exportData.messages) {
            exportData.messages.forEach(msg => {
              csvData.push({
                type: 'message',
                id: msg.id,
                title: `Message (${msg.role})`,
                content: msg.content,
                created_at: msg.created_at,
                updated_at: ''
              });
            });
          }
          
          if (exportData.knowledge) {
            exportData.knowledge.forEach(item => {
              csvData.push({
                type: 'knowledge',
                id: item.id,
                title: item.title,
                content: item.content || '',
                tags: item.tags?.join('; ') || '',
                source_url: item.source_url || '',
                created_at: item.created_at,
                updated_at: item.updated_at
              });
            });
          }
          
          blob = exportToCSV(csvData, ['type', 'id', 'title', 'content', 'tags', 'source_url', 'created_at', 'updated_at']);
          filename = `cortex-backup-${timestamp}.csv`;
          break;

        case 'pdf':
          // Create PDF with all data
          const pdfItems: any[] = [];
          
          if (exportData.knowledge) {
            pdfItems.push(...exportData.knowledge.map(item => ({
              ...item,
              type: 'Knowledge'
            })));
          }
          
          if (exportData.chats) {
            pdfItems.push(...exportData.chats.map(chat => ({
              ...chat,
              type: 'Chat',
              content: exportData.messages
                ?.filter(m => m.chat_id === chat.id)
                .map(m => `[${m.role}]: ${m.content}`)
                .join('\n\n') || ''
            })));
          }
          
          blob = exportToPDF(pdfItems, ['title', 'type', 'created_at'], 'Cortex Data Export');
          filename = `cortex-backup-${timestamp}.pdf`;
          break;

        default:
          throw new Error('Invalid export format');
      }

      // Download the file
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setProgress({ status: 'complete', message: 'Export complete!', progress: 100 });
      
      const totalItems = (exportData.chats?.length || 0) + 
                         (exportData.messages?.length || 0) + 
                         (exportData.knowledge?.length || 0);
      
      toast.success(`Exported ${totalItems} items successfully`);

      // Reset after delay
      setTimeout(() => {
        setProgress({ status: 'idle', message: '', progress: 0 });
        setIsDialogOpen(false);
      }, 2000);

    } catch (error) {
      console.error('Export error:', error);
      setProgress({ status: 'error', message: String(error), progress: 0 });
      toast.error('Failed to export data');
    }
  };

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'loading':
      case 'exporting':
        return <Loader2 size={20} className="animate-spin text-primary" />;
      case 'complete':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={20} className="text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Archive size={20} />
          Data Export & Backup
        </CardTitle>
        <CardDescription>
          Download your data for backup or migration purposes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Export Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => {
              setOptions({ ...options, format: 'json' });
              setIsDialogOpen(true);
            }}
          >
            <FileJson size={24} className="text-amber-500" />
            <span className="font-medium">Export as JSON</span>
            <span className="text-xs text-muted-foreground">Full data backup</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => {
              setOptions({ ...options, format: 'csv' });
              setIsDialogOpen(true);
            }}
          >
            <FileSpreadsheet size={24} className="text-green-500" />
            <span className="font-medium">Export as CSV</span>
            <span className="text-xs text-muted-foreground">Spreadsheet format</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => {
              setOptions({ ...options, format: 'pdf' });
              setIsDialogOpen(true);
            }}
          >
            <FileText size={24} className="text-red-500" />
            <span className="font-medium">Export as PDF</span>
            <span className="text-xs text-muted-foreground">Printable document</span>
          </Button>
        </div>

        {/* Export Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Download size={20} />
                Export Your Data
              </DialogTitle>
              <DialogDescription>
                Choose what data to include in your export
              </DialogDescription>
            </DialogHeader>

            {progress.status === 'idle' ? (
              <>
                {/* Data Selection */}
                <div className="space-y-4 py-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Include in export:</Label>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3 p-3 rounded-lg border border-border">
                        <Checkbox
                          id="include-chats"
                          checked={options.includeChats}
                          onCheckedChange={(checked) => 
                            setOptions({ ...options, includeChats: checked as boolean })
                          }
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <MessageSquare size={18} className="text-primary" />
                          <Label htmlFor="include-chats" className="cursor-pointer flex-1">
                            <span className="font-medium">Chats</span>
                            <p className="text-xs text-muted-foreground">Your conversation history</p>
                          </Label>
                        </div>
                      </div>

                      {options.includeChats && (
                        <div className="flex items-center space-x-3 p-3 rounded-lg border border-border ml-6">
                          <Checkbox
                            id="include-messages"
                            checked={options.includeMessages}
                            onCheckedChange={(checked) => 
                              setOptions({ ...options, includeMessages: checked as boolean })
                            }
                          />
                          <Label htmlFor="include-messages" className="cursor-pointer">
                            <span className="font-medium">Include messages</span>
                            <p className="text-xs text-muted-foreground">Full message content</p>
                          </Label>
                        </div>
                      )}

                      <div className="flex items-center space-x-3 p-3 rounded-lg border border-border">
                        <Checkbox
                          id="include-knowledge"
                          checked={options.includeKnowledge}
                          onCheckedChange={(checked) => 
                            setOptions({ ...options, includeKnowledge: checked as boolean })
                          }
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <BookOpen size={18} className="text-accent" />
                          <Label htmlFor="include-knowledge" className="cursor-pointer flex-1">
                            <span className="font-medium">Knowledge Base</span>
                            <p className="text-xs text-muted-foreground">Saved items and notes</p>
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Format Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Export format:</Label>
                    <RadioGroup
                      value={options.format}
                      onValueChange={(value) => setOptions({ ...options, format: value as ExportFormat })}
                      className="space-y-2"
                    >
                      {FORMAT_OPTIONS.map((format) => (
                        <div
                          key={format.value}
                          className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            options.format === format.value 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setOptions({ ...options, format: format.value })}
                        >
                          <RadioGroupItem value={format.value} id={`format-${format.value}`} />
                          <div className="flex items-center gap-2 flex-1">
                            {format.icon}
                            <Label htmlFor={`format-${format.value}`} className="cursor-pointer flex-1">
                              <span className="font-medium">{format.label}</span>
                              <p className="text-xs text-muted-foreground">{format.description}</p>
                            </Label>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleExport}>
                    <Download size={16} className="mr-2" />
                    Export Data
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <div className="py-8 space-y-4">
                <div className="flex items-center justify-center gap-3">
                  {getStatusIcon()}
                  <span className="text-sm font-medium">{progress.message}</span>
                </div>
                <Progress value={progress.progress} className="h-2" />
                {progress.status === 'error' && (
                  <div className="flex justify-center">
                    <Button variant="outline" onClick={() => setProgress({ status: 'idle', message: '', progress: 0 })}>
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Info Note */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
          <Download size={16} className="text-primary mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Your exported data includes all your chats, messages, and knowledge base items. 
            This backup can be used for personal records or data portability.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataExport;
