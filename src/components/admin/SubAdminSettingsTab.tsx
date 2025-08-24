
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubAdmin } from '@/hooks/useSubAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, User, MapPin, Shield, AlertCircle } from 'lucide-react';
import SubAdminDailyLimitSettings from './SubAdminDailyLimitSettings';

const SubAdminSettingsTab = () => {
  const { profile } = useAuth();
  const subAdminPermissions = useSubAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Paramètres Sous-Admin</h2>
          <p className="text-muted-foreground">
            Configuration et permissions de votre compte sous-administrateur
          </p>
        </div>
      </div>

      {/* Gestion du plafond quotidien */}
      <SubAdminDailyLimitSettings />

      {/* Informations du profil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informations du Profil
          </CardTitle>
          <CardDescription>
            Vos informations personnelles et territoriales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nom complet</label>
              <p className="text-lg font-semibold">{profile?.full_name || 'Non renseigné'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Téléphone</label>
              <p className="text-lg font-semibold">{profile?.phone}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Pays/Territoire</label>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <p className="text-lg font-semibold">{profile?.country || 'Non assigné'}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Rôle</label>
              <Badge className="bg-orange-100 text-orange-800">
                <Shield className="w-3 h-3 mr-1" />
                Sous-Administrateur
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Permissions et Accès
          </CardTitle>
          <CardDescription>
            Détail de vos permissions en tant que sous-administrateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium text-green-700">Permissions Accordées</h4>
              
              {subAdminPermissions.canViewUsers && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Voir les utilisateurs du territoire
                </div>
              )}
              
              {subAdminPermissions.canManageAgents && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Gérer les agents du territoire
                </div>
              )}
              
              {subAdminPermissions.canValidateAgent && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Valider ou suspendre les agents
                </div>
              )}
              
              {subAdminPermissions.canViewTerritorialStats && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Voir les statistiques territoriales
                </div>
              )}
              
              {subAdminPermissions.canSendNotifications && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Envoyer des notifications
                </div>
              )}
              
              {subAdminPermissions.canDepositToAgent && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Effectuer des dépôts agent
                </div>
              )}
              
              {subAdminPermissions.canViewCommissionReports && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Voir les relevés de commissions
                </div>
              )}
              
              {subAdminPermissions.canTrackTransfersInZone && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Suivre les transferts dans la zone
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-red-700">Restrictions</h4>
              
              {!subAdminPermissions.canManageUsers && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Modification des utilisateurs
                </div>
              )}
              
              {!subAdminPermissions.canRecharge && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Recharge personnelle du solde
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Bannissement d'utilisateurs
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Changement de rôles utilisateur
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Accès aux paramètres système
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Gestion des autres sous-admins
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Territoire assigné */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Territoire Assigné
          </CardTitle>
          <CardDescription>
            Zone géographique sous votre supervision
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">{subAdminPermissions.userCountry || 'Territoire non assigné'}</h4>
              <p className="text-sm text-muted-foreground">
                {subAdminPermissions.userCountry 
                  ? 'Vous supervise ce territoire exclusivement'
                  : 'Aucun territoire spécifique assigné'
                }
              </p>
            </div>
            <Badge variant={subAdminPermissions.userCountry ? 'default' : 'secondary'}>
              {subAdminPermissions.userCountry ? 'Assigné' : 'Non assigné'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Informations importantes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Informations Importantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Responsabilités:</strong> En tant que sous-administrateur, vous êtes responsable 
              de la supervision des agents et utilisateurs de votre territoire.
            </p>
          </div>
          
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Support:</strong> Pour toute demande d'évolution ou problème technique, 
              utilisez la section "Messages" pour contacter l'administration principale.
            </p>
          </div>
          
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Données:</strong> Toutes vos actions sont enregistrées dans les journaux 
              d'audit pour assurer la transparence et la sécurité.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubAdminSettingsTab;
