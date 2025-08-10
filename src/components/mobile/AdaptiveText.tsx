
import React from 'react';
import { cn } from '@/lib/utils';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

interface AdaptiveTextProps {
  children: React.ReactNode;
  variant?: 'heading' | 'subheading' | 'body' | 'small' | 'tiny';
  className?: string;
  truncate?: boolean;
  maxLines?: number;
}

export const AdaptiveText = ({
  children,
  variant = 'body',
  className,
  truncate = false,
  maxLines,
}: AdaptiveTextProps) => {
  const { isVerySmallMobile, isSmallMobile, isMediumMobile } = useResponsiveLayout();

  const getTextClasses = () => {
    const baseClasses = [];

    // Size classes based on variant and screen size
    if (variant === 'heading') {
      if (isVerySmallMobile) {
        baseClasses.push('text-lg font-bold');
      } else if (isSmallMobile) {
        baseClasses.push('text-xl font-bold');
      } else if (isMediumMobile) {
        baseClasses.push('text-2xl font-bold');
      } else {
        baseClasses.push('text-3xl font-bold');
      }
    } else if (variant === 'subheading') {
      if (isVerySmallMobile) {
        baseClasses.push('text-base font-semibold');
      } else if (isSmallMobile) {
        baseClasses.push('text-lg font-semibold');
      } else if (isMediumMobile) {
        baseClasses.push('text-xl font-semibold');
      } else {
        baseClasses.push('text-2xl font-semibold');
      }
    } else if (variant === 'body') {
      if (isVerySmallMobile) {
        baseClasses.push('text-sm');
      } else if (isSmallMobile) {
        baseClasses.push('text-base');
      } else {
        baseClasses.push('text-lg');
      }
    } else if (variant === 'small') {
      if (isVerySmallMobile) {
        baseClasses.push('text-xs');
      } else if (isSmallMobile) {
        baseClasses.push('text-sm');
      } else {
        baseClasses.push('text-base');
      }
    } else if (variant === 'tiny') {
      if (isVerySmallMobile) {
        baseClasses.push('text-xs');
      } else {
        baseClasses.push('text-sm');
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
      baseClasses.push('leading-tight');
    } else if (isSmallMobile) {
      baseClasses.push('leading-snug');
    } else {
      baseClasses.push('leading-normal');
    }

    return baseClasses.join(' ');
  };

  return (
    <span className={cn(getTextClasses(), className)}>
      {children}
    </span>
  );
};
