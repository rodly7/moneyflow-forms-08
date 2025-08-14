
import React from 'react';
import { cn } from '@/lib/utils';
import { FluidCard } from '@/components/ui/smooth-transitions';
import { LucideIcon } from 'lucide-react';

interface FluidActionItem {
  icon: LucideIcon;
  label: string;
  description: string;
  color: string;
  onClick: () => void;
}

interface FluidActionGridProps {
  actions: FluidActionItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export const FluidActionGrid = ({ 
  actions, 
  columns = 3, 
  className 
}: FluidActionGridProps) => {
  const gridClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={cn(
      'grid gap-4',
      gridClasses[columns],
      className
    )}>
      {actions.map((action, index) => (
        <FluidCard 
          key={index}
          className="group cursor-pointer overflow-hidden"
          hoverEffect={false}
        >
          <button
            onClick={action.onClick}
            className={cn(
              "w-full p-6 text-left",
              "transition-all duration-300 ease-out",
              "hover:bg-gradient-to-br hover:from-white hover:to-gray-50",
              "focus:outline-none focus:ring-4 focus:ring-blue-200 focus:ring-inset"
            )}
            style={{
              animationDelay: `${index * 100}ms`
            }}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className={cn(
                "p-4 rounded-2xl",
                "transition-all duration-300 ease-out",
                "group-hover:scale-110 group-hover:rotate-3",
                action.color
              )}>
                <action.icon className="w-8 h-8 text-white" />
              </div>
              
              <div className="space-y-1">
                <h3 className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors duration-200">
                  {action.label}
                </h3>
                <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-200">
                  {action.description}
                </p>
              </div>
            </div>
          </button>
        </FluidCard>
      ))}
    </div>
  );
};
