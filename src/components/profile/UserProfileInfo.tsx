
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Star, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const UserProfileInfo = () => {
  const { profile } = useAuth();

  if (!profile) return null;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4" />;
      case 'sub_admin':
        return <Shield className="w-4 h-4" />;
      case 'agent':
        return <Star className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'sub_admin':
        return 'Sous-Administrateur';
      case 'agent':
        return 'Agent';
      default:
        return 'Utilisateur';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-gradient-to-r from-purple-600 to-pink-600';
      case 'sub_admin':
        return 'bg-gradient-to-r from-blue-600 to-indigo-600';
      case 'agent':
        return 'bg-gradient-to-r from-emerald-600 to-teal-600';
      default:
        return 'bg-gradient-to-r from-gray-600 to-gray-700';
    }
  };

  return (
    <div className="flex items-center gap-3 p-2">
      <Avatar className="h-10 w-10 ring-2 ring-primary/20">
        <AvatarImage src={profile.avatar_url || undefined} />
        <AvatarFallback className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-bold">
          {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground truncate">
            {profile.full_name || 'Utilisateur'}
          </h3>
          <Badge className={`${getRoleColor(profile.role)} text-white border-0 text-xs px-1.5 py-0.5`}>
            {getRoleIcon(profile.role)}
          </Badge>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{profile.phone}</span>
            <span>•</span>
            <span>{profile.country || 'Non spécifié'}</span>
            {profile.is_verified && (
              <>
                <span>•</span>
                <span className="text-green-600">✓ Vérifié</span>
              </>
            )}
          </div>
          {profile.address && (
            <div className="text-xs text-muted-foreground">
              📍 {profile.address}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileInfo;
