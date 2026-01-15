import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface TourStep {
  id: string;
  target: string; // CSS selector
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  spotlightPadding?: number;
  disableOverlay?: boolean;
}

export interface TourDefinition {
  id: string;
  name: string;
  steps: TourStep[];
}

// Pre-defined tours
export const TOURS: Record<string, TourDefinition> = {
  dashboard: {
    id: 'dashboard',
    name: 'Dashboard Tour',
    steps: [
      {
        id: 'stats',
        target: '[data-tour="stats"]',
        title: 'Your Knowledge Stats',
        content: 'See your knowledge base statistics at a glance - total items, searches, and your knowledge score.',
        placement: 'bottom'
      },
      {
        id: 'quick-actions',
        target: '[data-tour="quick-actions"]',
        title: 'Quick Actions',
        content: 'Jump into common tasks like importing content, chatting with Tessa, or managing your cortex.',
        placement: 'top'
      },
      {
        id: 'goals',
        target: '[data-tour="goals"]',
        title: 'Monthly Goals',
        content: 'Track your progress toward knowledge goals. Stay motivated and build your second brain!',
        placement: 'top'
      },
      {
        id: 'activity',
        target: '[data-tour="activity"]',
        title: 'Recent Activity',
        content: 'See your latest searches, imports, and cortex creations here.',
        placement: 'left'
      }
    ]
  },
  import: {
    id: 'import',
    name: 'Import Tour',
    steps: [
      {
        id: 'import-methods',
        target: '[data-tour="import-methods"]',
        title: 'Import Methods',
        content: 'Choose how to add content - paste text, upload files, or import from URLs.',
        placement: 'bottom'
      },
      {
        id: 'import-preview',
        target: '[data-tour="import-preview"]',
        title: 'Preview & Organize',
        content: 'Preview your content before importing. Add tags and organize into cortexes.',
        placement: 'top'
      }
    ]
  },
  search: {
    id: 'search',
    name: 'Chat with Tessa',
    steps: [
      {
        id: 'chat-input',
        target: '[data-tour="chat-input"]',
        title: 'Ask Tessa Anything',
        content: 'Type your question here. Tessa will search your knowledge base and provide intelligent answers.',
        placement: 'top'
      },
      {
        id: 'chat-history',
        target: '[data-tour="chat-history"]',
        title: 'Chat History',
        content: 'Your conversations are saved here. Click any chat to continue the conversation.',
        placement: 'right'
      }
    ]
  }
};

interface UseFeatureTourOptions {
  tourId: string;
  autoStart?: boolean;
}

export function useFeatureTour(options: UseFeatureTourOptions) {
  const { tourId, autoStart = false } = options;
  const [completedTours, setCompletedTours] = useLocalStorage<string[]>('completed-tours', []);
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  const tour = TOURS[tourId];
  const isCompleted = completedTours.includes(tourId);
  const currentStep = tour?.steps[currentStepIndex] || null;
  const totalSteps = tour?.steps.length || 0;
  const progress = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  // Find target element when step changes
  useEffect(() => {
    if (isActive && currentStep) {
      const element = document.querySelector(currentStep.target) as HTMLElement;
      setTargetElement(element);
    } else {
      setTargetElement(null);
    }
  }, [isActive, currentStep]);

  // Auto-start tour if enabled and not completed
  useEffect(() => {
    if (autoStart && !isCompleted && tour) {
      // Small delay to let page render
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoStart, isCompleted, tour]);

  const start = useCallback(() => {
    if (tour) {
      setCurrentStepIndex(0);
      setIsActive(true);
    }
  }, [tour]);

  const next = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      complete();
    }
  }, [currentStepIndex, totalSteps]);

  const previous = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const skip = useCallback(() => {
    setIsActive(false);
    setCurrentStepIndex(0);
  }, []);

  const complete = useCallback(() => {
    setIsActive(false);
    setCurrentStepIndex(0);
    if (!completedTours.includes(tourId)) {
      setCompletedTours([...completedTours, tourId]);
    }
  }, [tourId, completedTours, setCompletedTours]);

  const reset = useCallback(() => {
    setCompletedTours(completedTours.filter(id => id !== tourId));
    setCurrentStepIndex(0);
  }, [tourId, completedTours, setCompletedTours]);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < totalSteps) {
      setCurrentStepIndex(index);
    }
  }, [totalSteps]);

  return {
    // Tour state
    tour,
    isActive,
    isCompleted,
    currentStep,
    currentStepIndex,
    totalSteps,
    progress,
    targetElement,
    
    // Tour controls
    start,
    next,
    previous,
    skip,
    complete,
    reset,
    goToStep,
    
    // Helpers
    isFirstStep: currentStepIndex === 0,
    isLastStep: currentStepIndex === totalSteps - 1
  };
}

// Hook to manage all tours
export function useTourManager() {
  const [completedTours, setCompletedTours] = useLocalStorage<string[]>('completed-tours', []);

  const resetAllTours = useCallback(() => {
    setCompletedTours([]);
  }, [setCompletedTours]);

  const resetTour = useCallback((tourId: string) => {
    setCompletedTours(completedTours.filter(id => id !== tourId));
  }, [completedTours, setCompletedTours]);

  const isTourCompleted = useCallback((tourId: string) => {
    return completedTours.includes(tourId);
  }, [completedTours]);

  const getAvailableTours = useCallback(() => {
    return Object.values(TOURS);
  }, []);

  return {
    completedTours,
    resetAllTours,
    resetTour,
    isTourCompleted,
    getAvailableTours
  };
}
