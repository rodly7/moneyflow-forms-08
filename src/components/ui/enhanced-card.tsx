import React from 'react';
import { cn } from '@/lib/utils';

interface EnhancedCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'elevated' | 'floating' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  animated?: boolean;
}

export const EnhancedCard = ({ 
  children, 
  className, 
  variant = 'default',
  padding = 'md',
  hover = true,
  animated = true
}: EnhancedCardProps) => {
  const variants = {
    default: 'bg-card border border-border shadow-sm',
    glass: 'bg-white/80 backdrop-blur-md border border-white/20 shadow-lg',
    elevated: 'bg-card border border-border shadow-elevated',
    floating: 'bg-card border border-border shadow-floating',
    gradient: 'bg-gradient-to-br from-card via-card/90 to-accent/5 border border-border shadow-lg'
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  return (
    <div
      className={cn(
        'rounded-2xl transform-gpu will-change-transform',
        animated && 'transition-all duration-300 ease-out',
        hover && animated && 'hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl',
        variants[variant],
        paddings[padding],
        className
      )}
    >
      {children}
    </div>
  );
};