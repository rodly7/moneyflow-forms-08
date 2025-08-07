
import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

interface OptimizedScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
  showScrollbar?: boolean;
  bounceEffect?: boolean;
}

export const OptimizedScrollContainer = ({
  children,
  className,
  maxHeight = "calc(var(--vh, 1vh) * 100 - 60px)",
  showScrollbar = false,
  bounceEffect = false
}: OptimizedScrollContainerProps) => {
  const { isMobile } = useDeviceDetection();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Optimisation pour le scroll mobile
    if (isMobile && scrollRef.current) {
      const container = scrollRef.current;
      
      // Prévention du bounce scroll sur iOS si désactivé
      if (!bounceEffect) {
        let startY = 0;
        
        container.addEventListener('touchstart', (e) => {
          startY = e.touches[0].clientY;
        }, { passive: true });
        
        container.addEventListener('touchmove', (e) => {
          const currentY = e.touches[0].clientY;
          const scrollTop = container.scrollTop;
          const scrollHeight = container.scrollHeight;
          const height = container.offsetHeight;
          
          // Empêcher le bounce en haut
          if (scrollTop <= 0 && currentY > startY) {
            e.preventDefault();
          }
          
          // Empêcher le bounce en bas
          if (scrollTop >= scrollHeight - height && currentY < startY) {
            e.preventDefault();
          }
        }, { passive: false });
      }
    }
  }, [isMobile, bounceEffect]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        "w-full overflow-y-auto overflow-x-hidden",
        isMobile && "mobile-scroll-optimized",
        !showScrollbar && "scrollbar-hide",
        "scroll-smooth",
        className
      )}
      style={{
        maxHeight,
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'smooth',
        overscrollBehavior: bounceEffect ? 'auto' : 'contain',
        // Optimisation GPU pour performance
        transform: 'translateZ(0)',
        willChange: 'scroll-position',
        // Momentum scrolling pour iOS
        WebkitScrollSnapType: 'y proximity'
      }}
    >
      <div className="relative min-h-full">
        {children}
      </div>
    </div>
  );
};

// Container pour le contenu principal des pages avec padding réduit
export const PageScrollContainer = ({ 
  children, 
  className,
  padding = true 
}: { 
  children: React.ReactNode; 
  className?: string;
  padding?: boolean;
}) => {
  return (
    <OptimizedScrollContainer
      className={cn(
        padding && "p-1 pb-2",
        className
      )}
    >
      <div className="space-y-1">
        {children}
      </div>
    </OptimizedScrollContainer>
  );
};
