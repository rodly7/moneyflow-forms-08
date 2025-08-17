
import React from 'react';
import { cn } from '@/lib/utils';
import { SmoothTransition, FluidCard } from '@/components/ui/smooth-transitions';

interface FluidDashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export const FluidDashboardLayout = ({ 
  children, 
  className, 
  title, 
  subtitle 
}: FluidDashboardLayoutProps) => {
  return (
    <div className={cn(
      "min-h-screen w-full",
      "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100",
      "animated-gradient",
      className
    )}>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {(title || subtitle) && (
          <SmoothTransition delay={100}>
            <FluidCard className="p-6 text-center">
              {title && (
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-gray-600">{subtitle}</p>
              )}
            </FluidCard>
          </SmoothTransition>
        )}
        
        <SmoothTransition delay={200}>
          {children}
        </SmoothTransition>
      </div>
    </div>
  );
};
