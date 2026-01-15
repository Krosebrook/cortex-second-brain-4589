import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Upload, 
  FileJson, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  AlertTriangle,
  FileUp
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ImportData {
  exportDate?: string;
  userId?: string;
  chats?: any[];
  messages?: any[];
  knowledge?: any[];
}

interface ImportStats {
  chatsImported: number;
  messagesImported: number;
  knowledgeImported: number;
  errors: string[];
}

interface ImportProgress {
  status: 'idle' | 'validating' | 'importing' | 'complete' | 'error';
  message: string;
  progress: number;
}

export const DataImport: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [importData, setImportData] = useState<ImportData | null>(null);
  const [progress, setProgress] = useState<ImportProgress>({
    status: 'idle',
    message: '',
    progress: 0
  });
  const [stats, setStats] = useState<ImportStats>({
    chatsImported: 0,
    messagesImported: 0,
    knowledgeImported: 0,
    errors: []
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Please select a JSON backup file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as ImportData;
        
        // Validate the data structure
        if (!data.chats && !data.knowledge) {
          toast.error('Invalid backup file: No data found');
          return;
        }

        setImportData(data);
        setIsDialogOpen(true);
      } catch (error) {
        toast.error('Failed to parse backup file');
        console.error('Parse error:', error);
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    if (!user || !importData) {
      toast.error('Please log in to import data');
      return;
    }

    const importStats: ImportStats = {
      chatsImported: 0,
      messagesImported: 0,
      knowledgeImported: 0,
      errors: []
    };

    try {
      setProgress({ status: 'validating', message: 'Validating data...', progress: 10 });

      // Import knowledge base items
      if (importData.knowledge && importData.knowledge.length > 0) {
        setProgress({ status: 'importing', message: 'Importing knowledge base...', progress: 30 });

        for (const item of importData.knowledge) {
          try {
            const { error } = await supabase.from('knowledge_base').insert({
              user_id: user.id,
              title: item.title,
              content: item.content || null,
              type: item.type || 'note',
              tags: item.tags || [],
              source_url: item.source_url || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

            if (error) {
              importStats.errors.push(`Knowledge: ${item.title} - ${error.message}`);
            } else {
              importStats.knowledgeImported++;
            }
          } catch (err) {
            importStats.errors.push(`Knowledge: ${item.title} - ${String(err)}`);
          }
        }
      }

      // Import chats
      if (importData.chats && importData.chats.length > 0) {
        setProgress({ status: 'importing', message: 'Importing chats...', progress: 50 });

        const chatIdMap = new Map<string, string>(); // Old ID -> New ID

        for (const chat of importData.chats) {
          try {
            const { data: newChat, error } = await supabase
              .from('chats')
              .insert({
                user_id: user.id,
                title: chat.title,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select('id')
              .single();

            if (error) {
              importStats.errors.push(`Chat: ${chat.title} - ${error.message}`);
            } else if (newChat) {
              chatIdMap.set(chat.id, newChat.id);
              importStats.chatsImported++;
            }
          } catch (err) {
            importStats.errors.push(`Chat: ${chat.title} - ${String(err)}`);
          }
        }

        // Import messages
        if (importData.messages && importData.messages.length > 0) {
          setProgress({ status: 'importing', message: 'Importing messages...', progress: 70 });

          for (const message of importData.messages) {
            const newChatId = chatIdMap.get(message.chat_id);
            if (!newChatId) continue;

            try {
              const { error } = await supabase.from('messages').insert({
                chat_id: newChatId,
                role: message.role,
                content: message.content,
                created_at: new Date().toISOString()
              });

              if (error) {
                importStats.errors.push(`Message in ${message.chat_id} - ${error.message}`);
              } else {
                importStats.messagesImported++;
              }
            } catch (err) {
              importStats.errors.push(`Message - ${String(err)}`);
            }
          }
        }
      }

      setStats(importStats);
      setProgress({ status: 'complete', message: 'Import complete!', progress: 100 });

      const totalImported = importStats.chatsImported + importStats.knowledgeImported;
      if (importStats.errors.length > 0) {
        toast.warning(`Imported ${totalImported} items with ${importStats.errors.length} errors`);
      } else {
        toast.success(`Successfully imported ${totalImported} items`);
      }

    } catch (error) {
      console.error('Import error:', error);
      setProgress({ status: 'error', message: String(error), progress: 0 });
      toast.error('Failed to import data');
    }
  };

  const resetImport = () => {
    setImportData(null);
    setProgress({ status: 'idle', message: '', progress: 0 });
    setStats({ chatsImported: 0, messagesImported: 0, knowledgeImported: 0, errors: [] });
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetImport();
  };

  const getDataSummary = () => {
    if (!importData) return null;

    return {
      chats: importData.chats?.length || 0,
      messages: importData.messages?.length || 0,
      knowledge: importData.knowledge?.length || 0,
      exportDate: importData.exportDate ? new Date(importData.exportDate).toLocaleString() : 'Unknown'
    };
  };

  const summary = getDataSummary();

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Upload size={20} />
          Import Data
        </CardTitle>
        <CardDescription>
          Restore your data from a previously exported JSON backup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload Area */}
        <div 
          className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <FileUp size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">Click to select backup file</p>
          <p className="text-xs text-muted-foreground mt-1">Only JSON backup files are supported</p>
        </div>

        {/* Import Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileJson size={20} />
                Import Backup
              </DialogTitle>
              <DialogDescription>
                Review and confirm data import
              </DialogDescription>
            </DialogHeader>

            {progress.status === 'idle' && summary && (
              <>
                {/* Data Summary */}
                <div className="space-y-4 py-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This will add data to your account. Existing data will not be replaced.
                    </AlertDescription>
                  </Alert>

                  <div className="p-4 rounded-lg border border-border bg-card/50">
                    <p className="text-xs text-muted-foreground mb-3">
                      Backup from: {summary.exportDate}
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-foreground">{summary.chats}</p>
                        <p className="text-xs text-muted-foreground">Chats</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{summary.messages}</p>
                        <p className="text-xs text-muted-foreground">Messages</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{summary.knowledge}</p>
                        <p className="text-xs text-muted-foreground">Knowledge</p>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                  <Button onClick={handleImport}>
                    <Upload size={16} className="mr-2" />
                    Import Data
                  </Button>
                </DialogFooter>
              </>
            )}

            {(progress.status === 'validating' || progress.status === 'importing') && (
              <div className="py-8 space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <Loader2 size={20} className="animate-spin text-primary" />
                  <span className="text-sm font-medium">{progress.message}</span>
                </div>
                <Progress value={progress.progress} className="h-2" />
              </div>
            )}

            {progress.status === 'complete' && (
              <div className="py-8 space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle size={20} className="text-green-500" />
                  <span className="text-sm font-medium">Import Complete!</span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xl font-bold text-green-500">{stats.chatsImported}</p>
                    <p className="text-xs text-muted-foreground">Chats</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-green-500">{stats.messagesImported}</p>
                    <p className="text-xs text-muted-foreground">Messages</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-green-500">{stats.knowledgeImported}</p>
                    <p className="text-xs text-muted-foreground">Knowledge</p>
                  </div>
                </div>

                {stats.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {stats.errors.length} item(s) failed to import
                    </AlertDescription>
                  </Alert>
                )}

                <DialogFooter>
                  <Button onClick={closeDialog}>Done</Button>
                </DialogFooter>
              </div>
            )}

            {progress.status === 'error' && (
              <div className="py-8 space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <AlertCircle size={20} className="text-destructive" />
                  <span className="text-sm font-medium">Import Failed</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">{progress.message}</p>
                <DialogFooter>
                  <Button variant="outline" onClick={resetImport}>Try Again</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Info Note */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
          <FileJson size={16} className="text-amber-500 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Import from JSON backups created with the Export feature. 
            Your existing data will be preserved, and imported items will be added as new entries.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataImport;
