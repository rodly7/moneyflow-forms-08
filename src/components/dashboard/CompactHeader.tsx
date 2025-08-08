
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, RefreshCw } from 'lucide-react';
import { CustomerServiceButton } from '@/components/notifications/CustomerServiceButton';

interface CompactHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onSignOut: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  showNotifications?: boolean;
  className?: string;
}

const CompactHeader = ({ 
  title, 
  subtitle, 
  icon, 
  onSignOut, 
  onRefresh,
  isLoading = false,
  showNotifications = true,
  className = ""
}: CompactHeaderProps) => {
  return (
    <div className={`bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 shadow-lg ${className}`}>
      <div className="container mx-auto flex items-center justify-between">
        {/* Title section */}
        <div className="flex items-center space-x-3">
          {icon && (
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-sm text-primary-foreground/80 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Bouton de rafraîchissement */}
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="text-primary-foreground hover:bg-white/10 transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="sr-only">Actualiser</span>
            </Button>
          )}

          {/* Service Client - remplace la cloche */}
          {showNotifications && <CustomerServiceButton />}

          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignOut}
            className="text-primary-foreground hover:bg-white/10 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="sr-only">Déconnexion</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CompactHeader;
