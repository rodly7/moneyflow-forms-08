
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LogoutButton from '@/components/auth/LogoutButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Crown, MapPin, Phone, Clock } from 'lucide-react';

const SubAdminHeader = () => {
  const { profile } = useAuth();

  if (!profile) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-purple-200">
            <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name || 'Profile'} />
            <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold">
              {getInitials(profile.full_name || 'SA')}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">
                {profile.full_name || 'Sous-Administrateur'}
              </h1>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                <Crown className="w-3 h-3 mr-1" />
                Sous-Admin
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {profile.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  <span>{profile.phone}</span>
                </div>
              )}
              
              {profile.country && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.country}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Connecté</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-sm">
            <div className="font-medium text-gray-900">Solde</div>
            <div className="text-lg font-bold text-green-600">
              {profile.balance?.toLocaleString('fr-FR')} FCFA
            </div>
          </div>
          
          <LogoutButton />
        </div>
      </div>
    </Card>
  );
};

export default SubAdminHeader;
