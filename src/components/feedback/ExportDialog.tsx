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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileJson, FileSpreadsheet, FileText, Download } from 'lucide-react';
import { ExportFormat } from '@/utils/exportUtils';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (format: ExportFormat, selectedFields: string[]) => void;
  itemCount: number;
  availableFields: string[];
  itemType?: string;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onOpenChange,
  onExport,
  itemCount,
  availableFields,
  itemType = 'items',
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
  const [selectedFields, setSelectedFields] = useState<string[]>(availableFields);

  const handleExport = () => {
    onExport(selectedFormat, selectedFields);
    onOpenChange(false);
  };

  const toggleField = (field: string) => {
    setSelectedFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
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

        <div className="space-y-4 py-4">
          <div>
            <h4 className="text-sm font-medium mb-3">Export Format</h4>
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

          <div>
            <h4 className="text-sm font-medium mb-3">Fields to Export</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
              {availableFields.map(field => (
                <div key={field} className="flex items-center space-x-2">
                  <Checkbox 
                    id={field}
                    checked={selectedFields.includes(field)}
                    onCheckedChange={() => toggleField(field)}
                  />
                  <Label 
                    htmlFor={field}
                    className="text-sm cursor-pointer capitalize"
                  >
                    {field.replace(/_/g, ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>
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
