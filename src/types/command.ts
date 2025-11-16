import { LucideIcon } from 'lucide-react';

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  category: 'navigation' | 'action' | 'search' | 'preference';
  keywords: string[];
  shortcut?: string;
  action: () => void | Promise<void>;
  visible?: boolean;
}

export interface CommandGroup {
  category: string;
  commands: Command[];
}
