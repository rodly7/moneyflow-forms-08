
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

interface CompactTouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'ghost' | 'outline' | 'destructive';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right' | 'top';
  fullWidth?: boolean;
  compact?: boolean;
}

export const CompactTouchButton = ({
  children,
  variant = 'default',
  size = 'sm',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  compact = true,
  className,
  ...props
}: CompactTouchButtonProps) => {
  const { isSmallMobile } = useDeviceDetection();

  const getSizeClasses = () => {
    const baseSize = compact ? 'compact' : 'normal';
    
    if (isSmallMobile) {
      switch (size) {
        case 'xs': return 'h-8 px-2 text-xs';
        case 'sm': return 'h-10 px-3 text-sm';
        case 'md': return 'h-12 px-4 text-base';
        case 'lg': return 'h-14 px-5 text-lg';
        default: return 'h-10 px-3 text-sm';
      }
    } else {
      switch (size) {
        case 'xs': return 'h-7 px-2 text-xs';
        case 'sm': return 'h-9 px-3 text-sm';
        case 'md': return 'h-11 px-4 text-base';
        case 'lg': return 'h-13 px-5 text-lg';
        default: return 'h-9 px-3 text-sm';
      }
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'xs': return 'w-3 h-3';
      case 'sm': return 'w-4 h-4';
      case 'md': return 'w-5 h-5';
      case 'lg': return 'w-6 h-6';
      default: return 'w-4 h-4';
    }
  };

  const renderContent = () => {
    if (iconPosition === 'top') {
      return (
        <div className="flex flex-col items-center justify-center gap-1">
          {icon && (
            <span className={cn('flex items-center justify-center', getIconSize())}>
              {icon}
            </span>
          )}
          <span className="text-center font-medium leading-tight">
            {children}
          </span>
        </div>
      );
    }

    return (
      <div className={cn(
        'flex items-center justify-center',
        iconPosition === 'right' ? 'flex-row-reverse' : 'flex-row',
        icon && 'gap-2'
      )}>
        {icon && (
          <span className={cn('flex items-center justify-center', getIconSize())}>
            {icon}
          </span>
        )}
        <span className="font-medium truncate">
          {children}
        </span>
      </div>
    );
  };

  return (
    <Button
      variant={variant}
      className={cn(
        'mobile-touch-target rounded-xl touch-manipulation',
        'transition-all duration-200 ease-in-out',
        'hover:scale-105 active:scale-95',
        'shadow-sm hover:shadow-md',
        getSizeClasses(),
        fullWidth && 'w-full',
        compact && 'min-h-0',
        className
      )}
      {...props}
    >
      {renderContent()}
    </Button>
  );
};
