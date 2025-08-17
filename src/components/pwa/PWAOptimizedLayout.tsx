
import React from 'react';
import { cn } from '@/lib/utils';

interface PWAOptimizedLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const PWAOptimizedLayout = ({ children, className }: PWAOptimizedLayoutProps) => {
  return (
    <div 
      className={cn(
        "full-screen-container",
        "min-h-screen w-full",
        "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100",
        className
      )}
      style={{
        minHeight: '100vh',
        width: '100vw',
        position: 'relative',
        fontSize: '16px',
        lineHeight: '1.5',
      }}
    >
      <div 
        className="h-full w-full overflow-y-auto overflow-x-hidden"
        style={{
          fontSize: '16px',
          lineHeight: '1.5',
          minHeight: '100vh',
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
          overscrollBehavior: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PWAOptimizedLayout;
