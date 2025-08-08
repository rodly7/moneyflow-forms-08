
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { CustomerServiceButton } from '@/components/notifications/CustomerServiceButton';

interface CompactHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onSignOut: () => void;
  showNotifications?: boolean;
  className?: string;
}

const CompactHeader = ({ 
  title, 
  subtitle, 
  icon, 
  onSignOut, 
  showNotifications = true,
  className = ""
}: CompactHeaderProps) => {
  return (
    <header className={`bg-gradient-to-r from-primary via-primary/95 to-primary/90 text-primary-foreground shadow-lg transition-all duration-300 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo et titre */}
          <div className="flex items-center space-x-3">
            {icon && (
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-bold truncate">{title}</h1>
              {subtitle && (
                <p className="text-sm text-primary-foreground/80 truncate">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Service Client */}
            {showNotifications && (
              <div className="relative">
                <CustomerServiceButton />
              </div>
            )}

            {/* Bouton de déconnexion */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onSignOut}
              className="text-primary-foreground hover:bg-white/10 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="sr-only">Déconnexion</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default CompactHeader;
