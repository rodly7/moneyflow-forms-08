
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
        "min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100",
        className
      )}
    >
      <div className="h-full w-full">
        {children}
      </div>
    </div>
  );
};

export default PWAOptimizedLayout;
