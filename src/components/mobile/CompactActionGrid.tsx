
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { LucideIcon } from 'lucide-react';

interface ActionItem {
  key: string;
  icon: LucideIcon;
  label: string;
  description: string;
  colors: string;
  onClick: () => void;
}

interface CompactActionGridProps {
  actions: ActionItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export const CompactActionGrid = ({
  actions,
  columns = 3,
  className
}: CompactActionGridProps) => {
  const { isSmallMobile } = useDeviceDetection();

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3', 
    4: 'grid-cols-2 sm:grid-cols-4'
  };

  return (
    <div className={cn(
      'grid gap-1.5',
      gridCols[columns],
      className
    )}>
      {actions.map(({ key, icon: Icon, label, description, colors, onClick }) => (
        <Card 
          key={key} 
          className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group"
        >
          <CardContent className="p-0">
            <button
              onClick={onClick}
              className={cn(
                "w-full flex flex-col items-center justify-center gap-1 hover:bg-gray-50 transition-colors relative overflow-hidden",
                isSmallMobile ? "h-16 p-1.5" : "h-18 p-2"
              )}
              title={description}
            >
              {/* Background gradient on hover */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity",
                colors
              )} />
              
              {/* Icon */}
              <div className={cn(
                "relative z-10 bg-gradient-to-r rounded-md flex items-center justify-center",
                colors,
                isSmallMobile ? "p-1" : "p-1.5"
              )}>
                <Icon className={cn(
                  "text-white",
                  isSmallMobile ? "w-3 h-3" : "w-4 h-4"
                )} />
              </div>
              
              {/* Label */}
              <span className={cn(
                "relative z-10 font-medium text-gray-800 text-center leading-tight px-0.5",
                isSmallMobile ? "text-xs" : "text-sm"
              )}>
                {label}
              </span>
            </button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
