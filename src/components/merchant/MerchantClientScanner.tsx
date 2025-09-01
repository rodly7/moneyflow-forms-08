import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UniversalQRScanner } from '@/components/shared/UniversalQRScanner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { QrCode, User, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ClientData, processAgentWithdrawal, findUserByPhone } from '@/services/withdrawalService';

interface MerchantClientScannerProps {
  // Pas de props nécessaires pour l'instant
}

const MerchantClientScanner: React.FC<MerchantClientScannerProps> = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedClient, setScannedClient] = useState<ClientData | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleScanSuccess = async (data: any) => {
    try {
      console.log('🔍 QR Code scanné:', data);
      console.log('🔍 Type de données:', typeof data);
      console.log('🔍 Contenu brut du QR:', JSON.stringify(data));
      
      let clientData;
      try {
        clientData = typeof data === 'string' ? JSON.parse(data) : data;
        console.log('🔍 Données client parsées:', clientData);
      } catch (parseError) {
        console.error('❌ Erreur parsing JSON:', parseError);
        toast({
          title: "QR Code invalide",
          description: "Le QR code ne contient pas de données valides",
          variant: "destructive"
        });
        return;
      }
      
      // Vérifier le type de QR code (standardisé comme dans QRCode.tsx)
      if (clientData.type !== 'user_profile') {
        console.log('❌ Type de QR invalide pour utilisateur:', clientData.type);
        toast({
          title: "QR Code invalide",
          description: "Ce QR code n'est pas un profil utilisateur valide",
          variant: "destructive"
        });
        return;
      }

      // Récupérer les informations du client - utiliser les mêmes fonctions que l'agent
      // D'abord essayer par userId, sinon par téléphone
      let clientProfile: ClientData | null = null;
      
      const userId = clientData.userId;
      const userPhone = clientData.phone;
      
      console.log('🔍 Recherche client - userId:', userId, 'phone:', userPhone);

      if (userId) {
        // Rechercher par ID d'abord avec plus de logs
        console.log('🔍 Tentative recherche par ID:', userId);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, full_name, phone, balance, country')
          .eq('id', userId)
          .single();

        console.log('🔍 Résultat recherche par ID:', { profile, error });
        
        if (profile && !error) {
          console.log('✅ Client trouvé par ID:', profile);
          clientProfile = profile;
        } else {
          console.log('❌ Client non trouvé par ID, erreur:', error);
        }
      }

      // Si pas trouvé par ID, essayer par téléphone (comme fait l'agent)
      if (!clientProfile && userPhone) {
        console.log('🔍 Tentative recherche par téléphone:', userPhone);
        try {
          clientProfile = await findUserByPhone(userPhone);
          if (clientProfile) {
            console.log('✅ Client trouvé par téléphone:', clientProfile);
          }
        } catch (error) {
          console.error('❌ Erreur recherche par téléphone:', error);
        }
      }

      if (!clientProfile) {
        console.log('❌ Client non trouvé après toutes les tentatives');
        toast({
          title: "Client non trouvé",
          description: "Aucun utilisateur trouvé. Le QR code pourrait être obsolète ou l'utilisateur n'existe plus.",
          variant: "destructive"
        });
        return;
      }

      setScannedClient(clientProfile);
      setIsScanning(false);
      
      toast({
        title: "Client scanné",
        description: `Client ${clientProfile.full_name} trouvé`,
      });
    } catch (error) {
      console.error('❌ Erreur lors du scan:', error);
      toast({
        title: "Erreur de scan",
        description: "Impossible de traiter ce QR code",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setScannedClient(null);
    setWithdrawAmount('');
  };

  const handleWithdraw = async () => {
    if (!scannedClient || !withdrawAmount) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez saisir un montant valide",
        variant: "destructive"
      });
      return;
    }

    if (amount > scannedClient.balance) {
      toast({
        title: "Solde insuffisant",
        description: `Le client n'a que ${scannedClient.balance.toLocaleString()} XAF disponible`,
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Get current user (merchant)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      // Utiliser exactement la même fonction que l'agent
      const result = await processAgentWithdrawal(
        user.id, // merchant agit comme agent
        scannedClient.id,
        amount,
        scannedClient.phone
      );

      if (result.success) {
        toast({
          title: "Retrait effectué",
          description: `Retrait de ${amount.toLocaleString()} XAF effectué avec succès`,
        });

        // Reset form
        setScannedClient(null);
        setWithdrawAmount('');
      }
    } catch (error) {
      console.error('Erreur lors du retrait:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de traiter le retrait",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scanner Client
          </CardTitle>
          <CardDescription>
            Scannez le QR code d'un client pour effectuer un retrait
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => setIsScanning(true)}
            className="w-full"
            size="lg"
          >
            <QrCode className="h-5 w-5 mr-2" />
            Scanner QR Code Client
          </Button>
        </CardContent>
      </Card>

      {/* Scanner Dialog */}
      <UniversalQRScanner
        isOpen={isScanning}
        onClose={() => setIsScanning(false)}
        onScanSuccess={handleScanSuccess}
        title="Scanner le QR code du client"
        variant="compact"
      />

      {/* Withdrawal Confirmation Dialog */}
      <Dialog open={!!scannedClient} onOpenChange={() => !isProcessing && handleCancel()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Effectuer un Retrait
            </DialogTitle>
            <DialogDescription>
              Confirmez les détails du retrait pour le client
            </DialogDescription>
          </DialogHeader>
          
          {scannedClient && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Nom:</span>
                  <span className="font-medium">{scannedClient.full_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Téléphone:</span>
                  <span className="font-medium">{scannedClient.phone}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Solde disponible:</span>
                  <span className="font-bold text-green-600">
                    {scannedClient.balance.toLocaleString()} XAF
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="withdrawAmount" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Montant à retirer (XAF)
                </Label>
                <Input
                  id="withdrawAmount"
                  type="number"
                  placeholder="Entrez le montant"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min="0"
                  max={scannedClient.balance}
                  disabled={isProcessing}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleWithdraw}
                  disabled={isProcessing || !withdrawAmount}
                  className="flex-1"
                >
                  {isProcessing ? "Traitement..." : "Effectuer le Retrait"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MerchantClientScanner;