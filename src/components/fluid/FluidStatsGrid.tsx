
import React from 'react';
import { cn } from '@/lib/utils';
import { FluidCard, SmoothTransition } from '@/components/ui/smooth-transitions';
import { LucideIcon } from 'lucide-react';

interface FluidStatItem {
  label: string;
  value: string | number;
  icon: LucideIcon;
  gradient: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

interface FluidStatsGridProps {
  stats: FluidStatItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export const FluidStatsGrid = ({ 
  stats, 
  columns = 4, 
  className 
}: FluidStatsGridProps) => {
  const gridClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  };

  const changeColors = {
    positive: 'text-emerald-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <div className={cn(
      'grid gap-4',
      gridClasses[columns],
      className
    )}>
      {stats.map((stat, index) => (
        <SmoothTransition key={index} delay={index * 100}>
          <FluidCard 
            className={cn(
              "overflow-hidden group",
              stat.gradient,
              "text-white"
            )}
            hoverEffect={false}
          >
            <div className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                {stat.change && (
                  <span className={cn(
                    "text-sm font-medium px-2 py-1 rounded-full bg-white/20",
                    changeColors[stat.changeType || 'neutral']
                  )}>
                    {stat.change}
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                <p className="text-2xl font-bold group-hover:scale-105 transition-transform duration-200">
                  {stat.value}
                </p>
                <p className="text-white/80 text-sm font-medium">
                  {stat.label}
                </p>
              </div>
              
              {/* Animated background effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
            </div>
          </FluidCard>
        </SmoothTransition>
      ))}
    </div>
  );
};
