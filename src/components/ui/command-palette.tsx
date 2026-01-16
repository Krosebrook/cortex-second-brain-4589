import React from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Command } from '@/types/command';
import { Badge } from '@/components/ui/badge';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  search: string;
  onSearchChange: (search: string) => void;
  commands: Command[];
  onExecute: (command: Command) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpenChange,
  search,
  onSearchChange,
  commands,
  onExecute,
}) => {
  // Group commands by category
  const groupedCommands = commands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  const categoryLabels = {
    navigation: 'Navigation',
    action: 'Actions',
    search: 'Search',
    preference: 'Preferences',
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={onSearchChange}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {Object.entries(groupedCommands).map(([category, cmds]) => (
          <CommandGroup
            key={category}
            heading={categoryLabels[category as keyof typeof categoryLabels] || category}
          >
            {cmds.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <CommandItem
                  key={cmd.id}
                  value={`${cmd.label} ${cmd.keywords.join(' ')}`}
                  onSelect={() => onExecute(cmd)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4" />}
                    <div>
                      <div className="font-medium">{cmd.label}</div>
                      {cmd.description && (
                        <div className="text-xs text-muted-foreground">
                          {cmd.description}
                        </div>
                      )}
                    </div>
                  </div>
                  {cmd.shortcut && (
                    <Badge variant="secondary" className="text-xs">
                      {cmd.shortcut}
                    </Badge>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
};
