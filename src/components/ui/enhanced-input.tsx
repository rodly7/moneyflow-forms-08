import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  variant?: 'default' | 'glass' | 'outline' | 'minimal';
  error?: string;
  fluid?: boolean;
}

export const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ 
    className, 
    label, 
    icon: Icon, 
    iconPosition = 'left',
    variant = 'default',
    error,
    fluid = false,
    type = 'text',
    ...props 
  }, ref) => {
    const variants = {
      default: 'bg-background border border-input focus:border-primary',
      glass: 'bg-white/80 backdrop-blur-sm border border-white/20 focus:border-primary/50',
      outline: 'bg-transparent border-2 border-primary/20 focus:border-primary',
      minimal: 'bg-accent/30 border-0 focus:bg-accent/50'
    };

    return (
      <div className={cn('relative', fluid && 'w-full')}>
        {label && (
          <label className="block text-sm font-medium text-foreground mb-2">
            {label}
          </label>
        )}
        
        <div className="relative">
          {Icon && iconPosition === 'left' && (
            <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          )}
          
          <input
            ref={ref}
            type={type}
            className={cn(
              'w-full px-4 py-3 rounded-xl text-16',
              'transition-all duration-200 ease-out transform-gpu will-change-transform',
              'focus:outline-none focus:ring-4 focus:ring-primary/20',
              'focus:scale-[1.01] focus:-translate-y-0.5',
              'placeholder:text-muted-foreground',
              Icon && iconPosition === 'left' && 'pl-10',
              Icon && iconPosition === 'right' && 'pr-10',
              error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
              variants[variant],
              className
            )}
            {...props}
          />
          
          {Icon && iconPosition === 'right' && (
            <Icon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          )}
        </div>
        
        {error && (
          <p className="mt-1 text-sm text-destructive animate-fade-in">
            {error}
          </p>
        )}
      </div>
    );
  }
);

EnhancedInput.displayName = 'EnhancedInput';