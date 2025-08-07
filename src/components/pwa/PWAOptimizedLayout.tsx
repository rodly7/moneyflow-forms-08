
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
        "h-screen w-screen overflow-hidden",
        "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100",
        className
      )}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: 'calc(var(--vh, 1vh) * 100)',
        width: '100vw',
        minHeight: 'calc(var(--vh, 1vh) * 100)',
        maxHeight: 'calc(var(--vh, 1vh) * 100)',
        minWidth: '100vw',
        maxWidth: '100vw',
        contain: 'layout style paint',
        zIndex: 0,
        fontSize: '14px',
        lineHeight: '1.2',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div 
        className="h-full w-full overflow-y-auto overflow-x-hidden mobile-scroll ultra-compact-scroll space-y-2"
        style={{
          fontSize: '14px',
          lineHeight: '1.2',
          paddingBottom: '10px',
          height: 'calc(100% - env(safe-area-inset-top) - env(safe-area-inset-bottom))'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PWAOptimizedLayout;
