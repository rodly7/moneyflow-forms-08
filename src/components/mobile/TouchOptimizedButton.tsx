
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

interface TouchOptimizedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'ghost' | 'outline' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  fullWidth?: boolean;
  enhancedVisibility?: boolean;
}

export const TouchOptimizedButton = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  fullWidth = false,
  enhancedVisibility = true,
  className,
  ...props
}: TouchOptimizedButtonProps) => {
  const { isSmallMobile, isMediumMobile } = useDeviceDetection();

  const getSizeClasses = () => {
    if (isSmallMobile) {
      switch (size) {
        case 'sm': return 'h-12 px-4 text-sm';
        case 'md': return 'h-14 px-5 text-base';
        case 'lg': return 'h-16 px-6 text-lg';
        default: return 'h-14 px-5 text-base';
      }
    } else if (isMediumMobile) {
      switch (size) {
        case 'sm': return 'h-11 px-4 text-sm';
        case 'md': return 'h-13 px-5 text-base';
        case 'lg': return 'h-15 px-6 text-lg';
        default: return 'h-13 px-5 text-base';
      }
    } else {
      switch (size) {
        case 'sm': return 'h-10 px-4 text-sm';
        case 'md': return 'h-12 px-5 text-base';
        case 'lg': return 'h-14 px-6 text-lg';
        default: return 'h-12 px-5 text-base';
      }
    }
  };

  const getEnhancedClasses = () => {
    if (!enhancedVisibility) return '';
    
    return cn(
      'font-bold tracking-wide',
      'shadow-lg border-2',
      'transition-all duration-300 ease-in-out',
      'hover:shadow-xl hover:scale-105',
      'active:scale-95 active:shadow-md',
      variant === 'default' && 'border-blue-600/20 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
      variant === 'secondary' && 'border-gray-300 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300',
      variant === 'outline' && 'border-gray-400 hover:bg-gray-50',
      variant === 'ghost' && 'hover:bg-gray-100 border-transparent',
      variant === 'destructive' && 'border-red-600/20 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
    );
  };

  return (
    <Button
      variant={variant}
      className={cn(
        'mobile-touch-target rounded-2xl touch-manipulation',
        'flex items-center justify-center gap-3',
        'text-center whitespace-nowrap overflow-hidden',
        getSizeClasses(),
        getEnhancedClasses(),
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {icon && (
        <span className={cn(
          'flex-shrink-0 flex items-center justify-center',
          isSmallMobile ? 'w-5 h-5' : 'w-6 h-6'
        )}>
          {icon}
        </span>
      )}
      <span className={cn(
        'flex-1 text-center font-bold tracking-wide',
        'action-button-label',
        fullWidth ? 'block' : 'inline-block',
        isSmallMobile ? 'text-sm' : 'text-base'
      )}>
        {children}
      </span>
    </Button>
  );
};
