
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { LucideIcon } from 'lucide-react';

interface AdaptiveActionItem {
  key: string;
  icon: LucideIcon;
  label: string;
  description?: string;
  colors: string;
  onClick: () => void;
}

interface AdaptiveActionGridProps {
  actions: AdaptiveActionItem[];
  className?: string;
}

export const AdaptiveActionGrid = ({
  actions,
  className
}: AdaptiveActionGridProps) => {
  const {
    isVerySmallMobile,
    isSmallMobile,
    isMediumMobile,
    screenWidth,
    isPortrait
  } = useResponsiveLayout();

  const getGridConfig = () => {
    if (isVerySmallMobile) {
      return {
        columns: 'grid-cols-2',
        itemHeight: 'h-16',
        gap: 'gap-2',
        padding: 'p-2',
        iconSize: 'w-4 h-4',
        textSize: 'text-xs',
        iconPadding: 'p-1',
      };
    } else if (isSmallMobile) {
      return {
        columns: 'grid-cols-3',
        itemHeight: 'h-18',
        gap: 'gap-3',
        padding: 'p-3',
        iconSize: 'w-5 h-5',
        textSize: 'text-sm',
        iconPadding: 'p-1.5',
      };
    } else if (isMediumMobile) {
      return {
        columns: isPortrait ? 'grid-cols-3' : 'grid-cols-4',
        itemHeight: 'h-20',
        gap: 'gap-4',
        padding: 'p-4',
        iconSize: 'w-6 h-6',
        textSize: 'text-base',
        iconPadding: 'p-2',
      };
    } else {
      return {
        columns: 'grid-cols-4',
        itemHeight: 'h-24',
        gap: 'gap-4',
        padding: 'p-4',
        iconSize: 'w-6 h-6',
        textSize: 'text-base',
        iconPadding: 'p-2',
      };
    }
  };

  const config = getGridConfig();

  return (
    <div className={cn(
      'grid',
      config.columns,
      config.gap,
      config.padding,
      className
    )}>
      {actions.map(({ key, icon: Icon, label, description, colors, onClick }) => (
        <Card
          key={key}
          className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group border-0"
        >
          <CardContent className="p-0">
            <button
              onClick={onClick}
              className={cn(
                "w-full flex flex-col items-center justify-center gap-1 hover:bg-gray-50/50 transition-all duration-200 relative overflow-hidden active:scale-95",
                config.itemHeight
              )}
              title={description || label}
            >
              {/* Background gradient on hover */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity",
                colors
              )} />
              
              {/* Icon container */}
              <div className={cn(
                "relative z-10 bg-gradient-to-r rounded-lg flex items-center justify-center shadow-sm",
                colors,
                config.iconPadding
              )}>
                <Icon className={cn("text-white", config.iconSize)} />
              </div>
              
              {/* Label */}
              <span className={cn(
                "relative z-10 font-medium text-gray-800 text-center leading-tight px-1 truncate max-w-full",
                config.textSize
              )}>
                {label}
              </span>
              
              {/* Description for larger screens */}
              {description && !isVerySmallMobile && (
                <span className="relative z-10 text-xs text-gray-600 text-center leading-tight px-1 truncate max-w-full">
                  {description}
                </span>
              )}
            </button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
