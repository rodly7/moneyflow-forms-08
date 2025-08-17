
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
  maxHeight,
  padding = true 
}: ScrollableContainerProps) => {
  return (
    <div 
      className={cn(
        "w-full overflow-y-auto overflow-x-hidden",
        padding && "p-2 sm:p-4",
        className
      )}
      style={{ 
        maxHeight: maxHeight || 'none',
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
    <div className={cn("min-h-screen w-full overflow-y-auto animate-fade-in", className)}>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};
