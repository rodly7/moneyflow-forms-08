
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

interface MobileCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  gradient?: boolean;
}

export const MobileCard = ({
  children,
  title,
  subtitle,
  icon,
  className,
  headerClassName,
  contentClassName,
  gradient = false,
}: MobileCardProps) => {
  const { isSmallMobile } = useDeviceDetection();

  return (
    <Card 
      className={cn(
        'shadow-lg border-0 overflow-hidden',
        gradient && 'bg-gradient-to-br from-white to-gray-50',
        isSmallMobile && 'shadow-md',
        className
      )}
    >
      {(title || subtitle || icon) && (
        <CardHeader className={cn(
          isSmallMobile ? 'p-3 pb-2' : 'p-4 pb-3',
          headerClassName
        )}>
          <div className="flex items-center gap-3">
            {icon && (
              <div className={cn(
                'flex-shrink-0',
                isSmallMobile ? 'w-6 h-6' : 'w-8 h-8'
              )}>
                {icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              {title && (
                <CardTitle className={cn(
                  'text-gray-900 truncate',
                  isSmallMobile ? 'text-base' : 'text-lg'
                )}>
                  {title}
                </CardTitle>
              )}
              {subtitle && (
                <p className={cn(
                  'text-gray-600 truncate mt-1',
                  isSmallMobile ? 'text-xs' : 'text-sm'
                )}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className={cn(
        isSmallMobile ? 'p-3' : 'p-4',
        !title && !subtitle && !icon && (isSmallMobile ? 'p-3' : 'p-4'),
        contentClassName
      )}>
        {children}
      </CardContent>
    </Card>
  );
};
