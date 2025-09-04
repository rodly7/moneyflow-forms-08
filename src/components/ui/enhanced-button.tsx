import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface EnhancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fluid?: boolean;
  children: React.ReactNode;
}

export const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    icon: Icon, 
    iconPosition = 'left',
    loading = false,
    fluid = false,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const variants = {
      primary: 'bg-gradient-to-r from-primary to-primary-600 text-primary-foreground hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl',
      secondary: 'bg-gradient-to-r from-secondary to-accent text-secondary-foreground hover:from-accent hover:to-secondary shadow-md hover:shadow-lg',
      outline: 'border-2 border-primary/20 bg-white/80 text-primary hover:bg-primary/10 hover:border-primary/40 backdrop-blur-sm',
      ghost: 'hover:bg-accent/50 text-foreground hover:text-accent-foreground',
      glass: 'bg-white/10 backdrop-blur-md border border-white/20 text-foreground hover:bg-white/20 shadow-lg'
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-lg',
      md: 'px-6 py-3 text-base rounded-xl',
      lg: 'px-8 py-4 text-lg rounded-xl',
      xl: 'px-10 py-5 text-xl rounded-2xl'
    };

    return (
      <button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 font-semibold',
          'transition-all duration-200 ease-out transform-gpu will-change-transform',
          'hover:scale-105 hover:-translate-y-0.5 active:scale-95 active:translate-y-0',
          'focus:outline-none focus:ring-4 focus:ring-primary/20',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
          'text-16', // Force 16px font size
          fluid && 'w-full',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        <div className={cn(
          'flex items-center gap-2',
          loading && 'opacity-0'
        )}>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
        </div>
      </button>
    );
  }
);

EnhancedButton.displayName = 'EnhancedButton';