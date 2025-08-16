
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
        "full-screen-container ultra-compact-mode",
        "h-screen w-screen",
        "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100",
        className
      )}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100vh',
        width: '100vw',
        minHeight: '100vh',
        maxHeight: '100vh',
        minWidth: '100vw',
        maxWidth: '100vw',
        contain: 'layout style paint',
        zIndex: 0,
        fontSize: '16px',
        lineHeight: '1.5',
        overflow: 'hidden',
      }}
    >
      <div 
        className="h-full w-full overflow-y-auto overflow-x-hidden"
        style={{
          fontSize: '16px',
          lineHeight: '1.5',
          height: '100vh',
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
          overscrollBehavior: 'contain',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PWAOptimizedLayout;
