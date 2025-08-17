
import React from 'react';
import { cn } from '@/lib/utils';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

interface AdaptiveTextProps {
  children: React.ReactNode;
  variant?: 'heading' | 'subheading' | 'body' | 'small' | 'tiny';
  baseSize?: number;
  className?: string;
  truncate?: boolean;
  maxLines?: number;
}

export const AdaptiveText = ({
  children,
  variant = 'body',
  baseSize,
  className,
  truncate = false,
  maxLines,
}: AdaptiveTextProps) => {
  const { isVerySmallMobile, isSmallMobile, isMediumMobile, getAdaptiveSize } = useResponsiveLayout();

  const getTextClasses = () => {
    const baseClasses = [];

    // Si baseSize est fourni, l'utiliser avec getAdaptiveSize
    if (baseSize) {
      const adaptiveSize = getAdaptiveSize(baseSize);
      baseClasses.push(`text-[${adaptiveSize}px]`);
    } else {
      // Tailles considérablement augmentées pour une meilleure visibilité
      if (variant === 'heading') {
        if (isVerySmallMobile) {
          baseClasses.push('text-3xl font-bold'); // Augmenté de text-2xl à text-3xl
        } else if (isSmallMobile) {
          baseClasses.push('text-4xl font-bold'); // Augmenté de text-3xl à text-4xl
        } else if (isMediumMobile) {
          baseClasses.push('text-5xl font-bold'); // Augmenté de text-4xl à text-5xl
        } else {
          baseClasses.push('text-6xl font-bold'); // Augmenté de text-5xl à text-6xl
        }
      } else if (variant === 'subheading') {
        if (isVerySmallMobile) {
          baseClasses.push('text-2xl font-semibold'); // Augmenté de text-xl à text-2xl
        } else if (isSmallMobile) {
          baseClasses.push('text-3xl font-semibold'); // Augmenté de text-2xl à text-3xl
        } else if (isMediumMobile) {
          baseClasses.push('text-4xl font-semibold'); // Augmenté de text-3xl à text-4xl
        } else {
          baseClasses.push('text-5xl font-semibold'); // Augmenté de text-4xl à text-5xl
        }
      } else if (variant === 'body') {
        if (isVerySmallMobile) {
          baseClasses.push('text-xl'); // Augmenté de text-lg à text-xl
        } else if (isSmallMobile) {
          baseClasses.push('text-2xl'); // Augmenté de text-xl à text-2xl
        } else {
          baseClasses.push('text-3xl'); // Augmenté de text-2xl à text-3xl
        }
      } else if (variant === 'small') {
        if (isVerySmallMobile) {
          baseClasses.push('text-lg'); // Augmenté de text-base à text-lg
        } else if (isSmallMobile) {
          baseClasses.push('text-xl'); // Augmenté de text-lg à text-xl
        } else {
          baseClasses.push('text-2xl'); // Augmenté de text-xl à text-2xl
        }
      } else if (variant === 'tiny') {
        if (isVerySmallMobile) {
          baseClasses.push('text-lg'); // Augmenté de text-base à text-lg
        } else {
          baseClasses.push('text-xl'); // Augmenté de text-lg à text-xl
        }
      }
    }

    // Truncation classes
    if (truncate) {
      baseClasses.push('truncate');
    }

    if (maxLines) {
      baseClasses.push(`line-clamp-${maxLines}`);
    }

    // Responsive line height
    if (isVerySmallMobile) {
      baseClasses.push('leading-snug');
    } else if (isSmallMobile) {
      baseClasses.push('leading-normal');
    } else {
      baseClasses.push('leading-relaxed');
    }

    return baseClasses.join(' ');
  };

  const adaptiveStyle = baseSize ? {
    fontSize: `${getAdaptiveSize(baseSize)}px`
  } : {};

  return (
    <span className={cn(getTextClasses(), className)} style={adaptiveStyle}>
      {children}
    </span>
  );
};
