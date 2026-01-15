import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TourStep } from '@/hooks/useFeatureTour';

interface SpotlightProps {
  isActive: boolean;
  step: TourStep | null;
  targetElement: HTMLElement | null;
  currentStepIndex: number;
  totalSteps: number;
  progress: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

interface TooltipPosition {
  top: number;
  left: number;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right';
}

export const Spotlight: React.FC<SpotlightProps> = ({
  isActive,
  step,
  targetElement,
  currentStepIndex,
  totalSteps,
  progress,
  onNext,
  onPrevious,
  onSkip,
  isFirstStep,
  isLastStep
}) => {
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  const calculatePositions = useCallback(() => {
    if (!targetElement || !step) return;

    const rect = targetElement.getBoundingClientRect();
    const padding = step.spotlightPadding || 8;
    
    setSpotlightRect(rect);

    const tooltipWidth = 320;
    const tooltipHeight = 180;
    const arrowOffset = 12;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;
    let arrowPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';

    const placement = step.placement || 'bottom';

    switch (placement) {
      case 'bottom':
        top = rect.bottom + arrowOffset + padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        arrowPosition = 'top';
        break;
      case 'top':
        top = rect.top - tooltipHeight - arrowOffset - padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        arrowPosition = 'bottom';
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - arrowOffset - padding;
        arrowPosition = 'right';
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + arrowOffset + padding;
        arrowPosition = 'left';
        break;
    }

    // Boundary checks
    if (left < 16) left = 16;
    if (left + tooltipWidth > viewportWidth - 16) left = viewportWidth - tooltipWidth - 16;
    if (top < 16) top = 16;
    if (top + tooltipHeight > viewportHeight - 16) top = viewportHeight - tooltipHeight - 16;

    setTooltipPosition({ top, left, arrowPosition });
  }, [targetElement, step]);

  useEffect(() => {
    if (isActive && targetElement) {
      calculatePositions();
      
      // Scroll target into view
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Recalculate on scroll/resize
      const handleUpdate = () => calculatePositions();
      window.addEventListener('scroll', handleUpdate, true);
      window.addEventListener('resize', handleUpdate);

      return () => {
        window.removeEventListener('scroll', handleUpdate, true);
        window.removeEventListener('resize', handleUpdate);
      };
    }
  }, [isActive, targetElement, calculatePositions]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        onNext();
      } else if (e.key === 'ArrowLeft') {
        onPrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onNext, onPrevious, onSkip]);

  if (!isActive || !step || !tooltipPosition || !spotlightRect) return null;

  const padding = step.spotlightPadding || 8;

  const overlay = (
    <div className="fixed inset-0 z-[9998]" onClick={onSkip}>
      {/* Dark overlay with cutout */}
      <svg className="w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={spotlightRect.left - padding}
              y={spotlightRect.top - padding}
              width={spotlightRect.width + padding * 2}
              height={spotlightRect.height + padding * 2}
              rx="8"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.7)"
          mask="url(#spotlight-mask)"
          style={{ pointerEvents: 'auto' }}
        />
      </svg>

      {/* Spotlight border */}
      <div
        className="absolute border-2 border-primary rounded-lg shadow-lg animate-pulse"
        style={{
          top: spotlightRect.top - padding,
          left: spotlightRect.left - padding,
          width: spotlightRect.width + padding * 2,
          height: spotlightRect.height + padding * 2,
          pointerEvents: 'none'
        }}
      />
    </div>
  );

  const tooltip = (
    <Card
      className="fixed z-[9999] w-80 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{
        top: tooltipPosition.top,
        left: tooltipPosition.left
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Arrow */}
      <div
        className={cn(
          "absolute w-3 h-3 bg-card border rotate-45",
          tooltipPosition.arrowPosition === 'top' && "top-[-7px] left-1/2 -translate-x-1/2 border-t border-l",
          tooltipPosition.arrowPosition === 'bottom' && "bottom-[-7px] left-1/2 -translate-x-1/2 border-b border-r",
          tooltipPosition.arrowPosition === 'left' && "left-[-7px] top-1/2 -translate-y-1/2 border-t border-l",
          tooltipPosition.arrowPosition === 'right' && "right-[-7px] top-1/2 -translate-y-1/2 border-b border-r"
        )}
      />

      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Step {currentStepIndex + 1} of {totalSteps}
            </p>
            <h3 className="font-semibold text-foreground">{step.title}</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mt-1 -mr-2"
            onClick={onSkip}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <p className="text-sm text-muted-foreground mb-4">
          {step.content}
        </p>

        {/* Progress */}
        <Progress value={progress} className="h-1 mb-4" />

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrevious}
            disabled={isFirstStep}
            className="text-muted-foreground"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-muted-foreground"
            >
              Skip
            </Button>
            <Button size="sm" onClick={onNext}>
              {isLastStep ? 'Finish' : 'Next'}
              {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return createPortal(
    <>
      {!step.disableOverlay && overlay}
      {tooltip}
    </>,
    document.body
  );
};
