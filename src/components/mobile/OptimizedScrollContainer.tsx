
import React from 'react';
import { cn } from '@/lib/utils';

interface OptimizedScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
  showScrollbar?: boolean;
}

export const OptimizedScrollContainer = ({
  children,
  className,
  maxHeight,
  showScrollbar = true
}: OptimizedScrollContainerProps) => {
  return (
    <div
      className={cn(
        "w-full h-full",
        !showScrollbar && "scrollbar-hide",
        className
      )}
      style={{
        maxHeight: maxHeight || 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {children}
    </div>
  );
};

// Container pour le contenu principal des pages
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
        padding && "p-4",
        className
      )}
    >
      <div className="space-y-4">
        {children}
      </div>
    </OptimizedScrollContainer>
  );
};
