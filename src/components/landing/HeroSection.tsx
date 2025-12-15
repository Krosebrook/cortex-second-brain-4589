/**
 * Hero Section Component
 * Main landing hero with animated title, description, and interactive diagram
 */

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WaitlistModal } from '../waitlist/WaitlistModal';
import DiagramComponent from './DiagramComponent';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

interface HeroSectionProps {
  showTitle: boolean;
}

type DiagramSection = 'scattered' | 'convergence' | 'organized';

// ============================================
// Constants
// ============================================

const HERO_TEXTS: Record<DiagramSection, string> = {
  scattered: 'All your notes, bookmarks, inspirations, articles and images in one single, private second brain, accessible anywhere, anytime.',
  convergence: 'Watch as AI intelligently organizes and connects your scattered thoughts into meaningful patterns.',
  organized: 'Access your perfectly organized knowledge base with smart search and instant recall.',
};

// ============================================
// Component
// ============================================

export const HeroSection = ({ showTitle }: HeroSectionProps) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<DiagramSection>('scattered');

  const handleSectionClick = (section: DiagramSection) => {
    setActiveSection(section);
  };

  const handleCtaClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="py-20 md:py-28 flex flex-col items-center text-center">
      <AnimatedTransition show={showTitle} animation="slide-up" duration={600}>
        {/* Main Title */}
        <h1 className={cn(
          'text-4xl sm:text-5xl md:text-7xl',
          'font-bold mb-6',
          'bg-gradient-to-r from-primary to-info bg-clip-text text-transparent'
        )}>
          Your Personal AI Engine
        </h1>

        {/* Interactive Description */}
        <p 
          className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in"
          key={activeSection}
        >
          {HERO_TEXTS[activeSection]}
        </p>

        {/* Interactive Diagram */}
        <div className="mb-8 w-full max-w-3xl">
          <DiagramComponent 
            onSectionClick={(section) => handleSectionClick(section)} 
            activeSection={activeSection} 
          />
        </div>

        {/* CTA Button */}
        <Button
          size="lg"
          onClick={handleCtaClick}
          className={cn(
            'rounded-full px-8 py-6 text-base font-medium',
            'bg-primary hover:bg-primary/90',
            'transition-all duration-300',
            'shadow-lg hover:shadow-xl hover:-translate-y-0.5'
          )}
        >
          {isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        {/* Waitlist Modal */}
        <WaitlistModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      </AnimatedTransition>
    </div>
  );
};
