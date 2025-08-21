import { Brain, Settings, Building, Shield, TrendingUp, Code, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TessaSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const TessaSidebar = ({ activeSection, onSectionChange }: TessaSidebarProps) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: Brain },
    { id: 'components', label: 'Core Components', icon: Settings },
    { id: 'architecture', label: 'System Architecture', icon: Building },
    { id: 'guardrails', label: 'Guardrails', icon: Shield },
    { id: 'viability', label: 'Viability Analysis', icon: TrendingUp },
    { id: 'implementation', label: 'Implementation', icon: Code },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border flex-shrink-0 flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-primary">Tessa AI</h1>
            <p className="text-sm text-muted-foreground">Interactive Blueprint</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-grow p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors",
                activeSection === item.id
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border text-center text-xs text-muted-foreground">
        <p>Tessa Blueprint v1.0</p>
        <p>&copy; 2025. All Rights Reserved.</p>
      </div>
    </aside>
  );
};