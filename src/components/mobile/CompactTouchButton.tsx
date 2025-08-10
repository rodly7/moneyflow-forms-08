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
    if (isSmallMobile) {
      switch (size) {
        case 'xs': return 'h-10 px-3 text-sm';
        case 'sm': return 'h-12 px-4 text-base';
        case 'md': return 'h-14 px-5 text-lg';
        case 'lg': return 'h-16 px-6 text-xl';
        default: return 'h-12 px-4 text-base';
      }
    } else {
      switch (size) {
        case 'xs': return 'h-9 px-3 text-sm';
        case 'sm': return 'h-11 px-4 text-base';
        case 'md': return 'h-13 px-5 text-lg';
        case 'lg': return 'h-15 px-6 text-xl';
        default: return 'h-11 px-4 text-base';
      }
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'xs': return 'w-4 h-4';
      case 'sm': return 'w-5 h-5';
      case 'md': return 'w-6 h-6';
      case 'lg': return 'w-7 h-7';
      default: return 'w-5 h-5';
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
