
import React from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, RefreshCw } from "lucide-react";
import { UnifiedNotificationBell } from "@/components/notifications/UnifiedNotificationBell";
import { toast } from "sonner";

interface AgentHeaderProps {
  isLoadingBalance: boolean;
  onRefreshBalances: () => void;
}

export const AgentHeader = ({ isLoadingBalance, onRefreshBalances }: AgentHeaderProps) => {
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
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-b-3xl shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-14 w-14 border-2 border-white/20">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-white/10 text-white font-semibold text-lg">
              {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg font-semibold leading-tight">
              Agent {profile?.full_name || 'Dashboard'} 🏪
            </h1>
            <p className="text-blue-100 text-sm mt-2 leading-relaxed">
              {new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <UnifiedNotificationBell />
          <Button
            onClick={onRefreshBalances}
            variant="outline"
            size="sm"
            disabled={isLoadingBalance}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white text-sm p-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="bg-red-500/20 border-red-300/30 text-white hover:bg-red-500/30 hover:text-white text-sm px-4 py-2 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
