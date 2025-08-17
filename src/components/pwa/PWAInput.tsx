
import React from 'react';
import { cn } from '@/lib/utils';

interface PWAInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const PWAInput = ({ 
  label, 
  error, 
  className, 
  id,
  ...props 
}: PWAInputProps) => {
  const inputId = id || `pwa-input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-1">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          // PWA optimizations to prevent zoom
          "w-full px-3 py-3 text-base border border-gray-300 rounded-md",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "transition-colors duration-200",
          "bg-white text-gray-900",
          // Prevent zoom on iOS
          "text-[16px]",
          error && "border-red-500 focus:ring-red-500 focus:border-red-500",
          className
        )}
        style={{
          fontSize: '16px', // Critical: prevents zoom on iOS
          WebkitAppearance: 'none',
          borderRadius: '6px'
        }}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

interface PWATextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const PWATextarea = ({ 
  label, 
  error, 
  className, 
  id,
  ...props 
}: PWATextareaProps) => {
  const textareaId = id || `pwa-textarea-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-1">
      {label && (
        <label 
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          // PWA optimizations to prevent zoom
          "w-full px-3 py-3 text-base border border-gray-300 rounded-md",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "transition-colors duration-200",
          "bg-white text-gray-900",
          "resize-none",
          // Prevent zoom on iOS
          "text-[16px]",
          error && "border-red-500 focus:ring-red-500 focus:border-red-500",
          className
        )}
        style={{
          fontSize: '16px', // Critical: prevents zoom on iOS
          WebkitAppearance: 'none',
          borderRadius: '6px'
        }}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

interface PWASelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const PWASelect = ({ 
  label, 
  error, 
  className, 
  id,
  options,
  ...props 
}: PWASelectProps) => {
  const selectId = id || `pwa-select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-1">
      {label && (
        <label 
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          // PWA optimizations to prevent zoom
          "w-full px-3 py-3 text-base border border-gray-300 rounded-md",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "transition-colors duration-200",
          "bg-white text-gray-900",
          // Prevent zoom on iOS
          "text-[16px]",
          error && "border-red-500 focus:ring-red-500 focus:border-red-500",
          className
        )}
        style={{
          fontSize: '16px', // Critical: prevents zoom on iOS
          WebkitAppearance: 'none',
          borderRadius: '6px'
        }}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
