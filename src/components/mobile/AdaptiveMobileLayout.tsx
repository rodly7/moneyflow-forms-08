
import React from 'react';
import { cn } from '@/lib/utils';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

interface AdaptiveMobileLayoutProps {
  children: React.ReactNode;
  className?: string;
  enableSafeArea?: boolean;
  autoScrollPadding?: boolean;
}

export const AdaptiveMobileLayout = ({
  children,
  className,
  enableSafeArea = false, // Désactivé par défaut
  autoScrollPadding = true,
}: AdaptiveMobileLayoutProps) => {
  const {
    screenWidth,
    screenHeight,
    isVerySmallMobile,
    isSmallMobile,
    isMediumMobile,
    isPortrait,
    dynamicViewportHeight,
    safeAreaTop,
    safeAreaBottom,
  } = useResponsiveLayout();

  const getLayoutClasses = () => {
    const baseClasses = [
      'w-full h-full min-h-screen overflow-hidden',
      'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100',
    ];

    if (isVerySmallMobile) {
      baseClasses.push('text-xs leading-tight');
    } else if (isSmallMobile) {
      baseClasses.push('text-sm leading-snug');
    } else if (isMediumMobile) {
      baseClasses.push('text-base leading-normal');
    }

    return baseClasses.join(' ');
  };

  const getContentClasses = () => {
    const baseClasses = [
      'w-full h-full overflow-y-auto overflow-x-hidden',
      'mobile-scroll-optimized',
    ];

    if (autoScrollPadding) {
      if (isVerySmallMobile) {
        baseClasses.push('pb-4');
      } else if (isSmallMobile) {
        baseClasses.push('pb-6');
      } else {
        baseClasses.push('pb-8');
      }
    }

    return baseClasses.join(' ');
  };

  const layoutStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: isPortrait ? `${dynamicViewportHeight}px` : '100vh',
    maxWidth: '100vw',
    maxHeight: isPortrait ? `${dynamicViewportHeight}px` : '100vh',
    contain: 'layout style paint',
    // Suppression du padding top/bottom même si enableSafeArea est true
    paddingTop: '0px',
    paddingBottom: '0px',
  };

  return (
    <div
      className={cn(getLayoutClasses(), className)}
      style={layoutStyle}
    >
      <div
        className={getContentClasses()}
        style={{
          height: '100%', // Toujours 100% au lieu de calc avec safe areas
        }}
      >
        {children}
      </div>
    </div>
  );
};
