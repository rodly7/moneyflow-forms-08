
import React from 'react';
import { cn } from '@/lib/utils';

interface SmoothTransitionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const SmoothTransition = ({ 
  children, 
  className, 
  delay = 0 
}: SmoothTransitionProps) => {
  return (
    <div 
      className={cn(
        "transform transition-all duration-500 ease-out",
        "animate-fade-in",
        className
      )}
      style={{ 
        animationDelay: `${delay}ms`,
        willChange: 'transform, opacity'
      }}
    >
      {children}
    </div>
  );
};

export const FluidCard = ({ 
  children, 
  className,
  hoverEffect = true 
}: { 
  children: React.ReactNode; 
  className?: string;
  hoverEffect?: boolean;
}) => {
  return (
    <div 
      className={cn(
        "bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20",
        "transition-all duration-300 ease-out",
        hoverEffect && "hover:shadow-xl hover:-translate-y-1 hover:bg-white/95",
        "transform-gpu", // Force GPU acceleration
        className
      )}
    >
      {children}
    </div>
  );
};

export const FluidButton = ({ 
  children, 
  className, 
  variant = "primary",
  ...props 
}: any) => {
  const variants = {
    primary: "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white",
    secondary: "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white",
    outline: "border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-700"
  };

  return (
    <button
      className={cn(
        "px-6 py-3 rounded-xl font-semibold",
        "transform transition-all duration-200 ease-out",
        "hover:scale-105 active:scale-95",
        "shadow-lg hover:shadow-xl",
        "focus:outline-none focus:ring-4 focus:ring-blue-200",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export const FluidInput = ({ className, ...props }: any) => {
  return (
    <input
      className={cn(
        "w-full px-4 py-3 rounded-xl border border-gray-200",
        "bg-white/80 backdrop-blur-sm",
        "transition-all duration-200 ease-out",
        "focus:border-blue-400 focus:ring-4 focus:ring-blue-100",
        "focus:bg-white focus:shadow-lg",
        "placeholder-gray-400",
        className
      )}
      {...props}
    />
  );
};
