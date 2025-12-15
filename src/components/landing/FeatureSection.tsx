/**
 * Feature Section Component
 * Display key features in a responsive grid
 */

import { 
  BrainCircuit, 
  Search, 
  FileText, 
  LinkIcon, 
  Database, 
  Network, 
  Sparkles,
  LucideIcon 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

interface FeatureSectionProps {
  showFeatures: boolean;
}

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
}

// ============================================
// Data
// ============================================

const FEATURES: Feature[] = [
  {
    icon: BrainCircuit,
    title: 'Neural Connections',
    description: 'Build meaningful connections between your notes, files, and ideas with our visual network view.',
    gradient: 'from-info/60 to-info/40',
  },
  {
    icon: Search,
    title: 'Smart Search',
    description: 'Find anything instantly with our AI-powered semantic search that understands context and meaning.',
    gradient: 'from-primary/60 to-primary/40',
  },
  {
    icon: FileText,
    title: 'Rich Content',
    description: 'Store notes, links, files, images, and projects in one unified knowledge system.',
    gradient: 'from-success/60 to-success/40',
  },
  {
    icon: LinkIcon,
    title: 'Automatic Linking',
    description: 'Our AI suggests connections between related content to build your knowledge graph organically.',
    gradient: 'from-warning/60 to-warning/40',
  },
  {
    icon: Database,
    title: 'Multi-source Import',
    description: 'Import content from various sources including notes apps, bookmarks, and more.',
    gradient: 'from-destructive/60 to-destructive/40',
  },
  {
    icon: Network,
    title: 'Visual Thinking',
    description: 'Visualize your thoughts and connections in an interactive knowledge graph.',
    gradient: 'from-accent/60 to-primary/40',
  },
];

// ============================================
// Feature Card Component
// ============================================

interface FeatureCardProps {
  feature: Feature;
  index: number;
}

const FeatureCard = ({ feature, index }: FeatureCardProps) => {
  const Icon = feature.icon;
  
  return (
    <Card 
      className={cn(
        'border bg-card/50 backdrop-blur-sm overflow-hidden',
        'shadow-md hover:shadow-lg',
        'transition-all duration-300 hover:-translate-y-1',
        'group'
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Top accent bar */}
      <div className={cn('h-1.5 w-full bg-gradient-to-r', feature.gradient)} />
      
      <CardHeader>
        {/* Icon */}
        <div 
          className={cn(
            'w-14 h-14 rounded-xl flex items-center justify-center',
            'bg-gradient-to-br shadow-md',
            feature.gradient,
            'group-hover:scale-110 transition-transform duration-300'
          )}
        >
          <Icon size={24} className="text-primary-foreground" />
        </div>
        
        {/* Title */}
        <CardTitle className="mt-4 group-hover:text-primary transition-colors duration-300">
          {feature.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <CardDescription className="text-base">
          {feature.description}
        </CardDescription>
      </CardContent>
    </Card>
  );
};

// ============================================
// Main Component
// ============================================

export const FeatureSection = ({ showFeatures }: FeatureSectionProps) => {
  return (
    <AnimatedTransition show={showFeatures} animation="slide-up" duration={600}>
      <div className="mt-16">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-1.5 bg-muted rounded-xl mb-4">
            <div className="bg-background px-4 py-2 rounded-lg shadow-sm flex items-center">
              <Sparkles size={22} className="mr-2 text-primary" />
              <span className="font-semibold">Key Features</span>
            </div>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need to expand your mind
          </h2>
          
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Discover how our digital second brain transforms the way you capture, connect, and recall information.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </AnimatedTransition>
  );
};
