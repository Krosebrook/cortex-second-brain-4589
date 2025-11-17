import React from 'react';
import { ShortcutKey } from '@/components/ui/shortcut-key';
import { Separator } from '@/components/ui/separator';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

interface ShortcutCheatSheetProps {
  shortcuts: Shortcut[];
  title?: string;
}

export const ShortcutCheatSheet: React.FC<ShortcutCheatSheetProps> = ({
  shortcuts,
  title = 'Keyboard Shortcuts',
}) => {
  // Group shortcuts by category
  const grouped = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <div className="print:p-8 print:bg-white">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
      
      <div className="print-content space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground">
            Quick reference for all keyboard shortcuts
          </p>
        </div>

        {Object.entries(grouped).map(([category, categoryShortcuts]) => (
          <div key={category} className="break-inside-avoid">
            <h2 className="text-xl font-semibold mb-3 capitalize">
              {category}
            </h2>
            <div className="space-y-2 mb-6">
              {categoryShortcuts.map((shortcut, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 print:hover:bg-transparent"
                >
                  <span className="text-sm">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, j) => (
                      <React.Fragment key={j}>
                        <ShortcutKey className="text-xs">{key}</ShortcutKey>
                        {j < shortcut.keys.length - 1 && (
                          <span className="text-xs text-muted-foreground">+</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {Object.keys(grouped).indexOf(category) < Object.keys(grouped).length - 1 && (
              <Separator className="my-4" />
            )}
          </div>
        ))}

        <div className="text-center text-sm text-muted-foreground mt-8 print:mt-12">
          <p>Generated on {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};
