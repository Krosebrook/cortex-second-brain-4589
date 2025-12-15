import { useState } from 'react';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { FeatureIllustration } from './FeatureIllustration';
import { FeatureIcon } from './FeatureIllustrations/FeatureIcon';
import { cn } from '@/lib/utils';

interface ManageSectionProps {
  show: boolean;
}

const features = [
  {
    title: "Add Cells",
    description: "Seamlessly import data (CSV, HTML, AI scraping, or clipping) or create new entries effortlessly."
  },
  {
    title: "Plug & Play",
    description: "Fully customizable with an open-source framework that adapts to your workflow."
  },
  {
    title: "Spatial Thinking",
    description: "Visualize ideas with brain cells, lists, galleries, tables, maps, or timelines."
  },
  {
    title: "Contextual",
    description: "Say goodbye to folders—create sub-brains tailored to specific projects or tasks."
  },
  {
    title: "Intelligence",
    description: "AI-powered insights that extract what they mention from every pinned topic."
  },
  {
    title: "Clip",
    description: "Collect data from any source or device directly into your second brain."
  },
  {
    title: "Agnostic",
    description: "Clip any type of content with built-in extraction tools."
  },
  {
    title: "Search",
    description: "Find what you're looking for with intelligent, precision-focused search capabilities."
  },
  {
    title: "Private",
    description: "Keep all your work secure in a private, controlled space."
  },
  {
    title: "Recognition",
    description: "Identify and extract text from images, videos, and more."
  },
  {
    title: "Share",
    description: "Share thoughts and ideas to collaborate seamlessly."
  },
  {
    title: "D/L mode",
    description: "Toggle between dark and simplified interface with custom color modes for focus."
  }
];

export const ManageSection = ({ show }: ManageSectionProps) => {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);

  const handleFeatureClick = (index: number) => {
    setActiveFeature(index === activeFeature ? null : index);
  };

  return (
    <AnimatedTransition show={show} animation="slide-up" duration={600}>
      <div className="py-16 md:py-24">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2 mb-12">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent md:text-8xl">
            Manage
          </h2>
          <p className="text-foreground max-w-3xl text-xl md:text-2xl mt-2">
            The first and only extension for your real mind.
          </p>
        </div>

        {/* Feature Illustration */}
        <FeatureIllustration 
          featureIndex={activeFeature} 
          className="transition-all duration-500" 
        />

        {/* Feature Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={cn(
                "flex flex-col items-center text-center cursor-pointer",
                "transition-all duration-300",
                activeFeature === index ? "scale-105" : "hover:scale-[1.02]"
              )}
              onClick={() => handleFeatureClick(index)}
            >
              <div
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center mb-4",
                  "transition-all duration-300",
                  activeFeature === index
                    ? "bg-primary/20 ring-2 ring-primary/50"
                    : "bg-primary/10 hover:bg-primary/15"
                )}
              >
                <FeatureIcon index={index} size={32} />
              </div>
              <h3 className="font-bold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </AnimatedTransition>
  );
};
