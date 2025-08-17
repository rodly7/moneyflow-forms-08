
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
  baseSize = 16, // Force 16px comme taille de base par défaut
  className,
  truncate = false,
  maxLines,
}: AdaptiveTextProps) => {
  const { isVerySmallMobile, isSmallMobile, isMediumMobile, getAdaptiveSize } = useResponsiveLayout();

  const getTextClasses = () => {
    const baseClasses = [];

    // Forcer une taille de base de 16px minimum
    if (baseSize) {
      const adaptiveSize = Math.max(16, getAdaptiveSize(baseSize));
      baseClasses.push(`text-[${adaptiveSize}px]`);
    } else {
      // Tailles mises à jour pour avoir 16px minimum
      if (variant === 'heading') {
        if (isVerySmallMobile) {
          baseClasses.push('text-2xl font-bold'); // 24px
        } else if (isSmallMobile) {
          baseClasses.push('text-3xl font-bold'); // 30px
        } else if (isMediumMobile) {
          baseClasses.push('text-4xl font-bold'); // 36px
        } else {
          baseClasses.push('text-5xl font-bold'); // 48px
        }
      } else if (variant === 'subheading') {
        if (isVerySmallMobile) {
          baseClasses.push('text-xl font-semibold'); // 20px
        } else if (isSmallMobile) {
          baseClasses.push('text-2xl font-semibold'); // 24px
        } else if (isMediumMobile) {
          baseClasses.push('text-3xl font-semibold'); // 30px
        } else {
          baseClasses.push('text-4xl font-semibold'); // 36px
        }
      } else if (variant === 'body') {
        // Force 16px pour le corps de texte
        baseClasses.push('text-base'); // 16px
      } else if (variant === 'small') {
        // Force 16px minimum même pour "small"
        baseClasses.push('text-base'); // 16px
      } else if (variant === 'tiny') {
        // Force 16px minimum même pour "tiny"
        baseClasses.push('text-base'); // 16px
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
    fontSize: `${Math.max(16, getAdaptiveSize(baseSize))}px` // Force 16px minimum
  } : {
    fontSize: '16px' // Force 16px par défaut
  };

  return (
    <span className={cn(getTextClasses(), 'text-16', className)} style={adaptiveStyle}>
      {children}
    </span>
  );
};
