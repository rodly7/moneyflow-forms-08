
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  description?: string;
  category: string;
}

interface SettingOption {
  key: string;
  label: string;
  description: string;
  category: string;
  defaultValue: boolean;
}

const SETTING_OPTIONS: SettingOption[] = [
  {
    key: 'notifications_enabled',
    label: 'Notifications activées',
    description: 'Activer ou désactiver toutes les notifications système',
    category: 'notifications',
    defaultValue: true
  },
  {
    key: 'auto_refresh_enabled',
    label: 'Rafraîchissement automatique',
    description: 'Actualiser automatiquement les données toutes les 10 secondes',
    category: 'general',
    defaultValue: true
  },
  {
    key: 'maintenance_mode',
    label: 'Mode maintenance',
    description: 'Activer le mode maintenance pour le système',
    category: 'security',
    defaultValue: false
  },
  {
    key: 'agent_registration_enabled',
    label: 'Inscription des agents',
    description: 'Permettre aux nouveaux agents de s\'inscrire',
    category: 'general',
    defaultValue: true
  },
  {
    key: 'international_transfers_enabled',
    label: 'Transferts internationaux',
    description: 'Activer les transferts vers l\'international',
    category: 'limits',
    defaultValue: true
  },
  {
    key: 'automatic_bills_enabled',
    label: 'Factures automatiques',
    description: 'Permettre le paiement automatique des factures',
    category: 'general',
    defaultValue: true
  },
  {
    key: 'security_alerts_enabled',
    label: 'Alertes de sécurité',
    description: 'Envoyer des alertes pour les activités suspectes',
    category: 'security',
    defaultValue: true
  },
  {
    key: 'daily_reports_enabled',
    label: 'Rapports quotidiens',
    description: 'Générer automatiquement les rapports quotidiens',
    category: 'general',
    defaultValue: true
  }
];

export const SimpleSettingsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .in('setting_key', SETTING_OPTIONS.map(opt => opt.key));

      if (error) throw error;

      const settingsMap: Record<string, boolean> = {};
      
      // Initialize with default values
      SETTING_OPTIONS.forEach(option => {
        settingsMap[option.key] = option.defaultValue;
      });

      // Override with actual values from database
      data?.forEach(setting => {
        settingsMap[setting.setting_key] = setting.setting_value === 'true';
      });

      setSettings(settingsMap);
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres système",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = async (key: string, value: boolean) => {
    setUpdating(key);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: key,
          setting_value: value.toString(),
          category: SETTING_OPTIONS.find(opt => opt.key === key)?.category || 'general',
          description: SETTING_OPTIONS.find(opt => opt.key === key)?.description
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      setSettings(prev => ({ ...prev, [key]: value }));

      toast({
        title: "Paramètre mis à jour",
        description: `${SETTING_OPTIONS.find(opt => opt.key === key)?.label} ${value ? 'activé' : 'désactivé'}`,
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le paramètre",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  const resetToDefaults = async () => {
    if (!confirm('Êtes-vous sûr de vouloir remettre tous les paramètres par défaut ?')) {
      return;
    }

    setLoading(true);
    try {
      // Delete all current settings
      await supabase
        .from('system_settings')
        .delete()
        .in('setting_key', SETTING_OPTIONS.map(opt => opt.key));

      // Reset to defaults
      const defaultSettings: Record<string, boolean> = {};
      SETTING_OPTIONS.forEach(option => {
        defaultSettings[option.key] = option.defaultValue;
      });

      setSettings(defaultSettings);

      toast({
        title: "Paramètres réinitialisés",
        description: "Tous les paramètres ont été remis par défaut",
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de réinitialiser les paramètres",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Chargement des paramètres...</span>
      </div>
    );
  }

  // Group settings by category
  const settingsByCategory = SETTING_OPTIONS.reduce((acc, option) => {
    if (!acc[option.category]) {
      acc[option.category] = [];
    }
    acc[option.category].push(option);
    return acc;
  }, {} as Record<string, SettingOption[]>);

  const categoryLabels: Record<string, string> = {
    general: 'Général',
    notifications: 'Notifications',
    security: 'Sécurité',
    limits: 'Limites'
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Paramètres Système
        </h2>
        <Button
          onClick={resetToDefaults}
          variant="outline"
          className="text-orange-600 border-orange-300 hover:bg-orange-50"
        >
          Remettre par défaut
        </Button>
      </div>

      {Object.entries(settingsByCategory).map(([category, options]) => (
        <Card key={category} className="bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-800 capitalize">
              {categoryLabels[category] || category}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {options.map((option) => (
              <div
                key={option.key}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">
                    {option.label}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {option.description}
                  </p>
                </div>
                <div className="flex items-center ml-4">
                  {updating === option.key && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                  )}
                  <Switch
                    checked={settings[option.key] || false}
                    onCheckedChange={(checked) => toggleSetting(option.key, checked)}
                    disabled={updating === option.key}
                    className="data-[state=checked]:bg-green-600"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {settings[option.key] ? 'Activé' : 'Désactivé'}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-white ml-1 mt-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Information</h3>
              <p className="text-sm text-blue-800">
                Ces paramètres contrôlent le comportement global du système. 
                Certains changements peuvent nécessiter un redémarrage pour être pris en compte.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
