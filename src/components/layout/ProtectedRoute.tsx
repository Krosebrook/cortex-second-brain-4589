import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { WaitlistModal } from '@/components/waitlist/WaitlistModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const hasCompletedOnboarding = localStorage.getItem('onboardingComplete');
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true);
      }
    } else {
      setShowWaitlist(true);
    }
  }, [isAuthenticated]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const handleWaitlistClose = () => {
    setShowWaitlist(false);
  };

  if (!isAuthenticated) {
    return (
      <>
        {children}
        <WaitlistModal isOpen={showWaitlist} onClose={handleWaitlistClose} />
      </>
    );
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return <>{children}</>;
};