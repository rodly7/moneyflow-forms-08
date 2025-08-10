
import React from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, RefreshCw, Bell, Settings } from "lucide-react";
import { UnifiedNotificationBell } from "@/components/notifications/UnifiedNotificationBell";
import { toast } from "sonner";

interface ModernAgentHeaderProps {
  isLoadingBalance: boolean;
  onRefreshBalances: () => void;
}

export const ModernAgentHeader = ({ isLoadingBalance, onRefreshBalances }: ModernAgentHeaderProps) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
      toast.success('Déconnexion réussie');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12 border-2 border-blue-200">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Agent {profile?.full_name || 'Dashboard'}
              </h1>
              <p className="text-sm text-gray-600">
                {new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric',
                  month: 'long'
                })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <UnifiedNotificationBell />
            
            <Button
              onClick={onRefreshBalances}
              variant="outline"
              size="sm"
              disabled={isLoadingBalance}
              className="h-10 w-10 p-0"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              onClick={() => navigate('/agent-settings')}
              variant="outline"
              size="sm"
              className="h-10 w-10 p-0"
            >
              <Settings className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={handleLogout}
              variant="destructive"
              size="sm"
              className="h-10 px-4 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
