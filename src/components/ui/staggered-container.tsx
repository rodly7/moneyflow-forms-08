import React from 'react';
import { cn } from '@/lib/utils';
import { useStaggeredAnimation } from '@/hooks/useFluidAnimations';

interface StaggeredContainerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  layout?: 'grid' | 'flex' | 'stack';
  columns?: number;
}

export const StaggeredContainer = ({ 
  children, 
  className, 
  delay = 100,
  layout = 'stack',
  columns = 2
}: StaggeredContainerProps) => {
  const childrenArray = React.Children.toArray(children);
  const visibleItems = useStaggeredAnimation(childrenArray.length, delay);

  const layouts = {
    grid: `grid grid-cols-1 md:grid-cols-${columns} gap-6`,
    flex: 'flex flex-wrap gap-6',
    stack: 'space-y-6'
  };

  return (
    <div className={cn(layouts[layout], className)}>
      {childrenArray.map((child, index) => (
        <div
          key={index}
          className={cn(
            'transform transition-all duration-600 ease-out',
            visibleItems.includes(index) 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 translate-y-8 scale-95'
          )}
        >
          {child}
        </div>
      ))}
    </div>
  );
};