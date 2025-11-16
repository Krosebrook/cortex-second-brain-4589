import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  value: number;
  variant?: 'linear' | 'circular';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { circular: 40, stroke: 3, text: 'text-xs' },
  md: { circular: 60, stroke: 4, text: 'text-sm' },
  lg: { circular: 80, stroke: 5, text: 'text-base' },
};

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  value,
  variant = 'linear',
  size = 'md',
  label,
  showPercentage = true,
  className,
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  if (variant === 'circular') {
    const { circular: circleSize, stroke: strokeWidth, text: textSize } = sizeMap[size];
    const radius = (circleSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (clampedValue / 100) * circumference;

    return (
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <div className="relative inline-flex items-center justify-center">
          <svg
            width={circleSize}
            height={circleSize}
            className="transform -rotate-90"
          >
            {/* Background circle */}
            <circle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius}
              stroke="hsl(var(--muted))"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius}
              stroke="hsl(var(--primary))"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-300 ease-in-out"
            />
          </svg>
          {showPercentage && (
            <span
              className={cn(
                'absolute font-semibold text-foreground',
                textSize
              )}
            >
              {Math.round(clampedValue)}%
            </span>
          )}
        </div>
        {label && (
          <p className="text-sm text-muted-foreground text-center">{label}</p>
        )}
      </div>
    );
  }

  // Linear variant
  return (
    <div className={cn('w-full space-y-2', className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-sm text-muted-foreground">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm font-medium text-foreground">
              {Math.round(clampedValue)}%
            </span>
          )}
        </div>
      )}
      <Progress value={clampedValue} />
    </div>
  );
};
