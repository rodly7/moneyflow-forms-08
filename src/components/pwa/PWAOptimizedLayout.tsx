
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
        height: 'calc(var(--vh, 1vh) * 100)',
        width: '100vw',
        minHeight: 'calc(var(--vh, 1vh) * 100)',
        maxHeight: 'calc(var(--vh, 1vh) * 100)',
        minWidth: '100vw',
        maxWidth: '100vw',
        contain: 'layout style paint',
        zIndex: 0,
        fontSize: '16px',
        lineHeight: '1.5',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: '0px',
        overflow: 'hidden',
      }}
    >
      <div 
        className="h-full w-full overflow-y-auto overflow-x-hidden mobile-scroll ultra-compact-scroll"
        style={{
          fontSize: '16px',
          lineHeight: '1.5',
          paddingTop: '34px', // Marge en haut de 34px
          paddingBottom: '0px', // Pas de marge en bas
          paddingLeft: '0px',
          paddingRight: '0px',
          height: '100%',
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
