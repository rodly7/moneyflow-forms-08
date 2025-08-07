
import React from 'react';
import { cn } from '@/lib/utils';

interface ScrollableContainerProps {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
  padding?: boolean;
}

export const ScrollableContainer = ({ 
  children, 
  className, 
  maxHeight = "calc(var(--vh, 1vh) * 100 - 80px)",
  padding = true 
}: ScrollableContainerProps) => {
  return (
    <div 
      className={cn(
        "scrollable overflow-y-auto overflow-x-hidden",
        "w-full",
        padding && "p-2 sm:p-4",
        className
      )}
      style={{ 
        maxHeight,
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'smooth'
      }}
    >
      <div className="space-y-4 pb-4">
        {children}
      </div>
    </div>
  );
};

export const PageWrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={cn("page-container animate-fade-in", className)}>
      <ScrollableContainer>
        {children}
      </ScrollableContainer>
    </div>
  );
};
