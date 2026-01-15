import { useState, useRef, useEffect, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { shouldLoadHighQuality } from '@/lib/performance-optimizations';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  lowQualitySrc?: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  onLoadComplete?: () => void;
}

/**
 * Optimized Image Component
 * 
 * Features:
 * - Lazy loading with Intersection Observer
 * - Progressive loading with low-quality placeholder
 * - Network-aware quality selection
 * - Proper aspect ratio to prevent CLS
 */
export function OptimizedImage({
  src,
  lowQualitySrc,
  alt,
  width,
  height,
  priority = false,
  className,
  onLoadComplete,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [currentSrc, setCurrentSrc] = useState<string | null>(priority ? src : null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  // Load image when in view
  useEffect(() => {
    if (!isInView || currentSrc === src) return;

    // Decide quality based on network
    const useHighQuality = shouldLoadHighQuality();
    const targetSrc = useHighQuality ? src : (lowQualitySrc || src);

    // Preload the image
    const img = new Image();
    img.src = targetSrc;
    img.onload = () => {
      setCurrentSrc(targetSrc);
      setIsLoaded(true);
      onLoadComplete?.();
    };
    img.onerror = () => {
      // Fallback to original src on error
      setCurrentSrc(src);
      setIsLoaded(true);
    };
  }, [isInView, src, lowQualitySrc, currentSrc, onLoadComplete]);

  // Compute aspect ratio for placeholder
  const aspectRatio = width && height ? height / width : undefined;

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted',
        className
      )}
      style={aspectRatio ? { aspectRatio: `${width}/${height}` } : undefined}
    >
      {/* Low quality placeholder */}
      {lowQualitySrc && !isLoaded && (
        <img
          src={lowQualitySrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-lg scale-110"
        />
      )}
      
      {/* Main image */}
      <img
        ref={imgRef}
        src={currentSrc || undefined}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        onLoad={() => {
          setIsLoaded(true);
          onLoadComplete?.();
        }}
        {...props}
      />
      
      {/* Loading skeleton */}
      {!isLoaded && !lowQualitySrc && (
        <div className="absolute inset-0 skeleton" aria-hidden="true" />
      )}
    </div>
  );
}
