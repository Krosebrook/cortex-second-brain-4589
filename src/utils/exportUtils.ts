import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type ExportFormat = 'json' | 'csv' | 'pdf';

interface ExportItem {
  id: string;
  title: string;
  content?: string | null;
  type?: string | null;
  tags?: string[] | null;
  created_at: string;
  updated_at?: string;
  [key: string]: any;
}

export const exportToJSON = (items: ExportItem[], filename: string) => {
  const dataStr = JSON.stringify(items, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  downloadBlob(dataBlob, `${filename}.json`);
};

export const exportToCSV = (items: ExportItem[], filename: string) => {
  if (items.length === 0) {
    throw new Error('No items to export');
  }

  // Get all unique keys from all items
  const allKeys = new Set<string>();
  items.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });

  // Create headers
  const headers = Array.from(allKeys);
  
  // Create CSV content
  const csvRows = [headers.join(',')];
  
  items.forEach(item => {
    const values = headers.map(header => {
      const value = item[header];
      
      // Handle arrays (like tags)
      if (Array.isArray(value)) {
        return `"${value.join('; ')}"`;
      }
      
      // Handle strings with commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      return value ?? '';
    });
    csvRows.push(values.join(','));
  });

  const csvContent = csvRows.join('\n');
  const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(dataBlob, `${filename}.csv`);
};

export const exportToPDF = (items: ExportItem[], filename: string, title: string) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 20);
  
  // Add metadata
  doc.setFontSize(10);
  doc.text(`Exported: ${new Date().toLocaleString()}`, 14, 28);
  doc.text(`Total items: ${items.length}`, 14, 34);
  
  // Prepare table data
  const tableData = items.map(item => [
    item.title,
    item.type || '-',
    item.tags?.join(', ') || '-',
    new Date(item.created_at).toLocaleDateString(),
  ]);
  
  // Add table
  autoTable(doc, {
    head: [['Title', 'Type', 'Tags', 'Created']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 66, 66] },
  });
  
  // Add content details on separate pages if available
  let currentY = (doc as any).lastAutoTable.finalY + 10;
  
  items.forEach((item, index) => {
    if (item.content) {
      // Add new page for each item with content
      if (index > 0 || currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(item.title, 14, currentY);
      currentY += 8;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      // Split content into lines that fit the page
      const contentLines = doc.splitTextToSize(item.content, 180);
      contentLines.forEach((line: string) => {
        if (currentY > 280) {
          doc.addPage();
          currentY = 20;
        }
        doc.text(line, 14, currentY);
        currentY += 5;
      });
      
      currentY += 10;
    }
  });
  
  doc.save(`${filename}.pdf`);
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const getExportFilename = (baseFilename: string, format: ExportFormat): string => {
  const timestamp = new Date().toISOString().split('T')[0];
  return `${baseFilename}-${timestamp}`;
};
