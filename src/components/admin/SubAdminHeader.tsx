
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LogoutButton from '@/components/auth/LogoutButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Crown, MapPin, Phone, Clock, AlertTriangle } from 'lucide-react';
import { useSubAdminDailyRequests } from '@/hooks/useSubAdminDailyRequests';
import SubAdminStatsDisplay from './SubAdminStatsDisplay';

const SubAdminHeader = () => {
  const { profile } = useAuth();
  const { status, loading } = useSubAdminDailyRequests();

  // Debug: afficher les valeurs du status
  React.useEffect(() => {
    if (!loading) {
      console.log(`🎯 Header - Status debug:`, {
        todayRequests: status.todayRequests,
        totalRequests: status.totalRequests,
        remainingRequests: status.remainingRequests,
        canMakeRequest: status.canMakeRequest
      });
    }
  }, [status, loading]);

  if (!profile) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getQuotaColor = () => {
    if (status.remainingRequests === 0) return 'text-red-600 bg-red-50';
    if (status.remainingRequests <= 5) return 'text-yellow-600 bg-yellow-50';
    return 'text-blue-600 bg-blue-50';
  };

  return (
    <div className="space-y-4 mb-6">
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
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

          <div className="flex items-center gap-4">
            {/* Statut des demandes avec quota */}
            <div className="text-right">
              <div className="font-medium text-gray-900 mb-1">Quota Journalier</div>
              {loading ? (
                <div className="text-sm text-gray-500">Chargement...</div>
              ) : (
                <div className="space-y-1">
                  <div className={`text-sm font-semibold px-2 py-1 rounded-md ${getQuotaColor()}`}>
                    {status.todayRequests}/{status.dailyLimit} aujourd'hui
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {!status.canMakeRequest && (
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                    )}
                    <span className={status.canMakeRequest ? 'text-green-600' : 'text-red-600'}>
                      {status.canMakeRequest 
                        ? `${status.remainingRequests} restantes`
                        : 'Quota épuisé'
                      }
                    </span>
                  </div>
                  <div className="text-xs text-purple-600 font-medium">
                    Total: {status.totalRequests}
                  </div>
                </div>
              )}
            </div>
            
            <LogoutButton />
          </div>
        </div>
      </Card>

      {/* Nouvelles statistiques détaillées */}
      <SubAdminStatsDisplay />
    </div>
  );
};

export default SubAdminHeader;
