
import React from 'react';
import { cn } from '@/lib/utils';

interface PWAOptimizedLayoutProps {
  children: React.ReactNode;
  className?: string;
  allowScroll?: boolean;
}

export const PWAOptimizedLayout = ({ 
  children, 
  className,
  allowScroll = true 
}: PWAOptimizedLayoutProps) => {
  return (
    <div 
      className={cn(
        "min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100",
        allowScroll && "overflow-y-auto",
        className
      )}
      style={{
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'smooth'
      }}
    >
      {children}
    </div>
  );
};

export default PWAOptimizedLayout;
