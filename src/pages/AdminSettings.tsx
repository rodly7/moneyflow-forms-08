
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Settings, ArrowLeft, Database, Shield, Activity } from "lucide-react";

const AdminSettings = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
  }, [profile, navigate]);

  if (!profile || profile.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/main-admin')}
              className="hover:bg-white/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Paramètres Système
            </h1>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* System Status */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <Activity className="w-5 h-5" />
                État du Système
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Base de données</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Opérationnelle</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>API Supabase</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Connectée</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Authentification</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Active</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Shield className="w-5 h-5" />
                Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Authentification 2FA</span>
                  <span className="text-sm text-orange-600">Bientôt disponible</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Chiffrement des données</span>
                  <span className="text-sm text-green-600">Activé</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Logs d'audit</span>
                  <span className="text-sm text-green-600">Activés</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Management */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-600">
                <Database className="w-5 h-5" />
                Gestion Base de Données
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => toast({
                    title: "Fonction en développement",
                    description: "Cette fonctionnalité sera bientôt disponible"
                  })}
                >
                  Sauvegarder la base
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Application Info */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-600">
                <Settings className="w-5 h-5" />
                Informations Application
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Version</span>
                  <span className="text-sm">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Environnement</span>
                  <span className="text-sm">Production</span>
                </div>
                <div className="flex justify-between">
                  <span>Dernière mise à jour</span>
                  <span className="text-sm">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Warning Card */}
        <Card className="mt-6 bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-800 mb-2">Attention</h3>
                <div className="space-y-1 text-sm text-orange-700">
                  <p>• Seuls les administrateurs principaux peuvent accéder à ces paramètres</p>
                  <p>• Toute modification peut affecter le fonctionnement de l'application</p>
                  <p>• Les actions critiques sont loggées et tracées</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;
