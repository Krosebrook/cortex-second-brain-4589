import { Activity, TrendingUp, Layout, Maximize } from 'lucide-react';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { cn } from '@/lib/utils';

interface DeploySectionProps {
  show: boolean;
}

const deployFeatures = [
  {
    icon: Activity,
    title: "Seamless",
    description: "Publish your work effortlessly across various platforms and devices."
  },
  {
    icon: TrendingUp,
    title: "Insights",
    description: "Gain insights with built-in analytics to track impact and engagement."
  },
  {
    icon: Layout,
    title: "Optimize",
    description: "Leverage AI to identify areas for improvement and refine your outputs."
  },
  {
    icon: Maximize,
    title: "Scale",
    description: "Adapt and grow your AI solutions as your needs evolve."
  }
];

export const DeploySection = ({ show }: DeploySectionProps) => {
  return (
    <AnimatedTransition show={show} animation="slide-up" duration={600}>
      <div className="py-16 md:py-24">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2 mb-12">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent md:text-8xl">
            Deploy
          </h2>
          <p className="text-foreground max-w-3xl text-xl md:text-2xl mt-2">
            Take your AI-driven work to the next level.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {deployFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className={cn(
                  "flex flex-col items-center text-center",
                  "group transition-all duration-300 hover:scale-[1.02]"
                )}
              >
                <div
                  className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center mb-4",
                    "bg-primary/10 group-hover:bg-primary/20",
                    "transition-all duration-300"
                  )}
                >
                  <IconComponent 
                    size={32} 
                    className="text-primary transition-transform duration-300 group-hover:scale-110" 
                  />
                </div>
                <h3 className="font-bold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </AnimatedTransition>
  );
};
