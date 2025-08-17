
import React from 'react';
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
      <label
        htmlFor={id}
        className={cn(
          'text-gray-700 font-medium flex items-center gap-1',
          isSmallMobile ? 'text-sm' : 'text-base'
        )}
      >
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      
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
    <input
      className={cn(
        'w-full px-3 py-3 border-2 rounded-xl transition-all duration-200',
        'focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none',
        'bg-white text-gray-900',
        // Critical: Prevent zoom on iOS
        'text-[16px]',
        isSmallMobile ? 'h-12' : 'h-13',
        error && 'border-red-300 focus:border-red-500',
        className
      )}
      style={{
        fontSize: '16px', // Critical: prevents zoom on iOS
        WebkitAppearance: 'none',
        borderRadius: '12px'
      }}
      {...props}
    />
  );
};

interface MobileSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: { value: string; label: string }[];
}

export const MobileSelect = ({ error, className, options, ...props }: MobileSelectProps) => {
  const { isSmallMobile } = useDeviceDetection();

  return (
    <select
      className={cn(
        'w-full px-3 py-3 border-2 rounded-xl transition-all duration-200',
        'focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none',
        'bg-white text-gray-900',
        // Critical: Prevent zoom on iOS
        'text-[16px]',
        isSmallMobile ? 'h-12' : 'h-13',
        error && 'border-red-300 focus:border-red-500',
        className
      )}
      style={{
        fontSize: '16px', // Critical: prevents zoom on iOS
        WebkitAppearance: 'none',
        borderRadius: '12px'
      }}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const MobileTextarea = ({ error, className, ...props }: MobileTextareaProps) => {
  const { isSmallMobile } = useDeviceDetection();

  return (
    <textarea
      className={cn(
        'w-full px-3 py-3 border-2 rounded-xl transition-all duration-200',
        'focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none',
        'bg-white text-gray-900 resize-none',
        // Critical: Prevent zoom on iOS
        'text-[16px]',
        'min-h-[80px]',
        error && 'border-red-300 focus:border-red-500',
        className
      )}
      style={{
        fontSize: '16px', // Critical: prevents zoom on iOS
        WebkitAppearance: 'none',
        borderRadius: '12px'
      }}
      {...props}
    />
  );
};
