
import React from 'react';
import { cn } from '@/lib/utils';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

interface MobileResponsiveWrapperProps {
  children: React.ReactNode;
  className?: string;
  enableSafeArea?: boolean;
}

export const MobileResponsiveWrapper = ({ 
  children, 
  className, 
  enableSafeArea = true 
}: MobileResponsiveWrapperProps) => {
  const { isMobile, isSmallMobile } = useDeviceDetection();

  return (
    <div 
      className={cn(
        "w-full h-full",
        isMobile && "mobile-optimized",
        isSmallMobile && "small-mobile-optimized",
        enableSafeArea && "safe-area-optimized",
        className
      )}
      style={{
        // Use CSS custom properties for dynamic viewport units
        minHeight: isMobile ? 'calc(var(--vh, 1vh) * 100)' : '100vh',
        maxHeight: isMobile ? 'calc(var(--vh, 1vh) * 100)' : 'none',
        // Safe area support for modern mobile devices
        ...(enableSafeArea && {
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        })
      }}
    >
      <div className={cn(
        "w-full h-full overflow-hidden",
        isMobile ? "mobile-scroll" : "desktop-scroll"
      )}>
        {children}
      </div>
    </div>
  );
};

// Mobile-specific scrollable content container
export const MobileScrollableContent = ({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) => {
  const { isMobile } = useDeviceDetection();
  
  return (
    <div 
      className={cn(
        "w-full h-full overflow-y-auto overflow-x-hidden",
        isMobile && "mobile-scroll-optimized",
        className
      )}
      style={{
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'smooth',
        // Prevent rubber band scrolling on iOS
        overscrollBehavior: 'none'
      }}
    >
      {children}
    </div>
  );
};
