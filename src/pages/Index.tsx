/**
 * Landing Page
 * Main entry point with hero, features, and call-to-action sections
 */

import { useState, useEffect } from 'react';
import { useAnimateIn } from '@/lib/animations';
import { HeroSection } from '@/components/landing/HeroSection';
import { ManageSection } from '@/components/landing/ManageSection';
import { DesignSection } from '@/components/landing/DesignSection';
import { DeploySection } from '@/components/landing/DeploySection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { CallToAction } from '@/components/landing/CallToAction';
import { LoadingScreen } from '@/components/landing/LoadingScreen';
import UseCasesSection from '@/components/landing/UseCasesSection';
import { Container } from '@/components/ui/container';
import { cn } from '@/lib/utils';

// ============================================
// Background Decoration Component
// ============================================

const BackgroundDecorations = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
    {/* Top gradient */}
    <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent" />
    
    {/* Floating orbs */}
    <div className="absolute top-1/3 right-0 w-[300px] h-[300px] rounded-full bg-primary/5 blur-3xl" />
    <div className="absolute bottom-1/3 left-0 w-[250px] h-[250px] rounded-full bg-accent/5 blur-3xl" />
    <div className="absolute top-2/3 right-1/4 w-[200px] h-[200px] rounded-full bg-secondary/10 blur-2xl" />
  </div>
);

// ============================================
// Section Wrapper Component
// ============================================

interface SectionWrapperProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}

const SectionWrapper = ({ children, className, animate = true }: SectionWrapperProps) => (
  <section
    className={cn(
      'relative',
      animate && 'transition-all duration-500 ease-out',
      className
    )}
  >
    {children}
  </section>
);

// ============================================
// Main Component
// ============================================

const Index = () => {
  const [loading, setLoading] = useState(true);
  
  // Staggered animation triggers
  const showHero = useAnimateIn(false, 300);
  const showManage = useAnimateIn(false, 600);
  const showDesign = useAnimateIn(false, 900);
  const showDeploy = useAnimateIn(false, 1200);
  const showUseCases = useAnimateIn(false, 1500);
  const showTestimonials = useAnimateIn(false, 1800);
  const showCallToAction = useAnimateIn(false, 2100);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <BackgroundDecorations />
      
      <Container size="xl" className="pt-12 pb-24">
        <div className="flex flex-col gap-16 md:gap-24">
          {/* Hero Section */}
          <SectionWrapper>
            <HeroSection showTitle={showHero} />
          </SectionWrapper>

          {/* Manage Section */}
          <SectionWrapper>
            <ManageSection show={showManage} />
          </SectionWrapper>

          {/* Design Section */}
          <SectionWrapper>
            <DesignSection show={showDesign} />
          </SectionWrapper>

          {/* Deploy Section */}
          <SectionWrapper>
            <DeploySection show={showDeploy} />
          </SectionWrapper>

          {/* Use Cases Section */}
          <SectionWrapper>
            <UseCasesSection show={showUseCases} />
          </SectionWrapper>

          {/* Testimonials Section */}
          <SectionWrapper>
            <TestimonialsSection showTestimonials={showTestimonials} />
          </SectionWrapper>

          {/* Call to Action */}
          <SectionWrapper>
            <CallToAction show={showCallToAction} />
          </SectionWrapper>
        </div>
      </Container>
    </main>
  );
};

export default Index;
