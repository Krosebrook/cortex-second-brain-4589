/**
 * Page Transition Component
 * Wraps route content with framer-motion animations for smooth navigation.
 *
 * Variants:
 *  - "fade"       → simple opacity crossfade (default, good for most pages)
 *  - "slide-up"   → content rises into view (detail / sub-pages)
 *  - "slide-left" → horizontal slide (wizard / step flows)
 *  - "scale"      → subtle zoom-in (modal-style overlays)
 */

import { motion, type Variants } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export type TransitionVariant = 'fade' | 'slide-up' | 'slide-left' | 'scale';

const variants: Record<TransitionVariant, Variants> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  'slide-up': {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
  },
  'slide-left': {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
  },
};

interface PageTransitionProps {
  children: React.ReactNode;
  variant?: TransitionVariant;
  className?: string;
  /** Duration in seconds */
  duration?: number;
}

export const PageTransition = ({
  children,
  variant = 'fade',
  className,
  duration = 0.3,
}: PageTransitionProps) => {
  const location = useLocation();
  const v = variants[variant];

  return (
    <motion.div
      key={location.pathname}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={v}
      transition={{ duration, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn('min-h-0', className)}
      onAnimationStart={() => window.scrollTo(0, 0)}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
