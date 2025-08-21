
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
  enableSafeArea = false // Désactivé par défaut
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
        // Suppression du safe area support
        paddingTop: '0px',
        paddingBottom: '0px',
        paddingLeft: '0px',
        paddingRight: '0px',
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
