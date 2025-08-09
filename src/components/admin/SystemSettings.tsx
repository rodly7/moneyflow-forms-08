
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  DollarSign, 
  Bell, 
  Database, 
  Settings, 
  AlertTriangle,
  Activity,
  Lock
} from 'lucide-react';

const SystemSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    transfersEnabled: true,
    withdrawalsEnabled: true,
    depositsEnabled: true,
    agentValidationRequired: true,
    maintenanceMode: false,
    autoNotifications: true,
    maxDailyTransfer: 500000,
    maxDailyAgent: 2000000,
    transactionFee: 1,
    internationalFee: 4.5
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    toast({
      title: "Paramètre modifié",
      description: "Le paramètre a été mis à jour avec succès",
    });
  };

  const handleSaveSettings = () => {
    // Ici on sauvegarderait les paramètres en base
    toast({
      title: "Paramètres sauvegardés",
      description: "Tous les paramètres ont été sauvegardés avec succès",
    });
  };

  return (
    <div className="space-y-6">
      {/* Services de Transaction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <Activity className="w-5 h-5" />
            Services de Transaction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="transfers">Transferts d'argent</Label>
              <p className="text-sm text-gray-500">Activer/désactiver les transferts entre utilisateurs</p>
            </div>
            <Switch
              id="transfers"
              checked={settings.transfersEnabled}
              onCheckedChange={(checked) => handleSettingChange('transfersEnabled', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="withdrawals">Retraits agents</Label>
              <p className="text-sm text-gray-500">Permettre les retraits chez les agents</p>
            </div>
            <Switch
              id="withdrawals"
              checked={settings.withdrawalsEnabled}
              onCheckedChange={(checked) => handleSettingChange('withdrawalsEnabled', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="deposits">Dépôts mobiles</Label>
              <p className="text-sm text-gray-500">Autoriser les dépôts via mobile</p>
            </div>
            <Switch
              id="deposits"
              checked={settings.depositsEnabled}
              onCheckedChange={(checked) => handleSettingChange('depositsEnabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Limites de Transaction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <DollarSign className="w-5 h-5" />
            Limites de Transaction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxDaily">Limite quotidienne utilisateur (FCFA)</Label>
              <Input
                id="maxDaily"
                type="number"
                value={settings.maxDailyTransfer}
                onChange={(e) => handleSettingChange('maxDailyTransfer', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="maxAgent">Limite quotidienne agent (FCFA)</Label>
              <Input
                id="maxAgent"
                type="number"
                value={settings.maxDailyAgent}
                onChange={(e) => handleSettingChange('maxDailyAgent', parseInt(e.target.value))}
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="transFee">Frais de transaction nationale (%)</Label>
              <Input
                id="transFee"
                type="number"
                step="0.1"
                value={settings.transactionFee}
                onChange={(e) => handleSettingChange('transactionFee', parseFloat(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="intFee">Frais de transaction internationale (%)</Label>
              <Input
                id="intFee"
                type="number"
                step="0.1"
                value={settings.internationalFee}
                onChange={(e) => handleSettingChange('internationalFee', parseFloat(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sécurité et Validation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-600">
            <Shield className="w-5 h-5" />
            Sécurité et Validation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="agentValidation">Validation manuelle des agents</Label>
              <p className="text-sm text-gray-500">Exiger une validation administrative pour nouveaux agents</p>
            </div>
            <Switch
              id="agentValidation"
              checked={settings.agentValidationRequired}
              onCheckedChange={(checked) => handleSettingChange('agentValidationRequired', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="maintenance">Mode maintenance</Label>
              <p className="text-sm text-gray-500">Mettre le système en mode maintenance</p>
            </div>
            <Switch
              id="maintenance"
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <Bell className="w-5 h-5" />
            Système de Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="autoNotifs">Notifications automatiques</Label>
              <p className="text-sm text-gray-500">Envoyer automatiquement les notifications de transaction</p>
            </div>
            <Switch
              id="autoNotifs"
              checked={settings.autoNotifications}
              onCheckedChange={(checked) => handleSettingChange('autoNotifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions Critiques */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Actions Critiques
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => toast({
                title: "Action non disponible",
                description: "Cette fonction sera bientôt disponible",
                variant: "destructive"
              })}
            >
              <Lock className="w-4 h-4 mr-2" />
              Verrouiller le système
            </Button>
            
            <Button 
              variant="outline" 
              className="border-orange-200 text-orange-600 hover:bg-orange-50"
              onClick={() => toast({
                title: "Action non disponible",
                description: "Cette fonction sera bientôt disponible"
              })}
            >
              <Database className="w-4 h-4 mr-2" />
              Sauvegarder la base
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-700">
          <Settings className="w-4 h-4 mr-2" />
          Sauvegarder tous les paramètres
        </Button>
      </div>
    </div>
  );
};

export default SystemSettings;
