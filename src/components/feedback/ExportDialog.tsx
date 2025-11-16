import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FileJson, FileSpreadsheet, FileText, Download } from 'lucide-react';
import { ExportFormat } from '@/utils/exportUtils';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (format: ExportFormat) => void;
  itemCount: number;
  itemType?: string;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onOpenChange,
  onExport,
  itemCount,
  itemType = 'items',
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');

  const handleExport = () => {
    onExport(selectedFormat);
    onOpenChange(false);
  };

  const formats = [
    {
      value: 'json' as ExportFormat,
      label: 'JSON',
      description: 'Full data structure with all fields',
      icon: FileJson,
    },
    {
      value: 'csv' as ExportFormat,
      label: 'CSV',
      description: 'Spreadsheet format for Excel or Google Sheets',
      icon: FileSpreadsheet,
    },
    {
      value: 'pdf' as ExportFormat,
      label: 'PDF',
      description: 'Formatted document for printing or sharing',
      icon: FileText,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export {itemType}</DialogTitle>
          <DialogDescription>
            Export {itemCount} {itemCount === 1 ? 'item' : 'items'} in your preferred format.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as ExportFormat)}>
            <div className="space-y-3">
              {formats.map((format) => {
                const Icon = format.icon;
                return (
                  <div
                    key={format.value}
                    className="flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => setSelectedFormat(format.value)}
                  >
                    <RadioGroupItem value={format.value} id={format.value} />
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor={format.value}
                        className="flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <Icon className="h-4 w-4" />
                        {format.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {format.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
