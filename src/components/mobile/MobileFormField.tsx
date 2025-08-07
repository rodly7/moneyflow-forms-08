
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

interface MobileFormFieldProps {
  label: string;
  id?: string;
  error?: string;
  helper?: string;
  required?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const MobileFormField = ({
  label,
  id,
  error,
  helper,
  required = false,
  children,
  className,
}: MobileFormFieldProps) => {
  const { isSmallMobile } = useDeviceDetection();

  return (
    <div className={cn('space-y-2', className)}>
      <Label
        htmlFor={id}
        className={cn(
          'text-gray-700 font-medium flex items-center gap-1',
          isSmallMobile ? 'text-sm' : 'text-base'
        )}
      >
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      
      <div className="relative">
        {children}
      </div>
      
      <div className={cn(
        'min-h-[18px] transition-all duration-200',
        isSmallMobile ? 'text-xs' : 'text-sm'
      )}>
        {error ? (
          <p className="text-red-500 flex items-start gap-1">
            <span className="text-red-500 mt-0.5">⚠</span>
            {error}
          </p>
        ) : helper ? (
          <p className="text-gray-500">{helper}</p>
        ) : null}
      </div>
    </div>
  );
};

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const MobileInput = ({ error, className, ...props }: MobileInputProps) => {
  const { isSmallMobile } = useDeviceDetection();

  return (
    <Input
      className={cn(
        'mobile-touch-target border-2 rounded-xl transition-all duration-200',
        'focus:ring-2 focus:ring-primary/20 focus:border-primary',
        isSmallMobile ? 'h-12 text-base' : 'h-13 text-lg',
        error && 'border-red-300 focus:border-red-500',
        className
      )}
      {...props}
    />
  );
};
