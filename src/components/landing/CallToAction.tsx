/**
 * Call To Action Component
 * Final CTA section with prominent buttons
 */

import { Button } from '@/components/ui/button';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ArrowRight, BookOpen } from 'lucide-react';

// ============================================
// Types
// ============================================

interface CallToActionProps {
  show: boolean;
}

// ============================================
// Component
// ============================================

export const CallToAction = ({ show }: CallToActionProps) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const handleLearnMore = () => {
    navigate('/how');
  };

  return (
    <AnimatedTransition show={show} animation="slide-up" duration={600}>
      <div 
        className={cn(
          'py-16 md:py-24 rounded-2xl text-center',
          'bg-gradient-to-br from-primary to-primary/80',
          'text-primary-foreground',
          'shadow-xl'
        )}
      >
        {/* Heading */}
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4">
          Get Started Today!
        </h2>
        
        {/* Subheading */}
        <p className="text-xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto px-4">
          Ready to transform your productivity? Join thousands of users who have already upgraded their second brain.
        </p>

        {/* Button Group */}
        <div className="flex flex-wrap justify-center gap-4 px-4">
          <Button
            size="lg"
            onClick={handleGetStarted}
            className={cn(
              'rounded-full px-8 py-6 text-base font-medium',
              'bg-background text-foreground',
              'hover:bg-background/90',
              'transition-all duration-300',
              'shadow-lg hover:shadow-xl hover:-translate-y-0.5'
            )}
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Start Free Trial'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={handleLearnMore}
            className={cn(
              'rounded-full px-8 py-6 text-base font-medium',
              'bg-transparent text-primary-foreground',
              'border-primary-foreground/50 hover:border-primary-foreground',
              'hover:bg-primary-foreground/10',
              'transition-all duration-300'
            )}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            See How it Works
          </Button>
        </div>
      </div>
    </AnimatedTransition>
  );
};
