import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScanLine, CreditCard, CheckCircle, User } from 'lucide-react';
import { FastQRScanner } from '@/components/shared/FastQRScanner';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ClientData {
  userId: string;
  userName: string;
  userPhone: string;
  balance: number;
}

const MerchantClientScanner = () => {
  const { profile } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedClient, setScannedClient] = useState<ClientData | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleScanSuccess = async (data: any) => {
    console.log('🔍 QR Code scanné:', data);
    console.log('🔍 Type de données:', typeof data);
    
    try {
      const clientData = typeof data === 'string' ? JSON.parse(data) : data;
      console.log('🔍 Données client parsées:', clientData);
      
      // Accepter différents types de QR codes d'utilisateurs
      const validTypes = ['user_profile', 'user_withdrawal', 'client_profile', 'user_qr', 'sendflow_user'];
      if (clientData.type && !validTypes.includes(clientData.type)) {
        console.log('❌ Type de QR invalide:', clientData.type);
        toast({
          title: "QR Code invalide",
          description: "Ce QR code n'est pas un profil client valide",
          variant: "destructive"
        });
        return;
      }

      // Récupérer les informations du client depuis la base de données
      // Utiliser l'ID utilisateur du QR code (peut être userId ou id selon le format)
      const userId = clientData.userId || clientData.id;
      console.log('🔍 ID utilisateur extrait:', userId);
      console.log('🔍 clientData.userId:', clientData.userId);
      console.log('🔍 clientData.id:', clientData.id);
      
      if (!userId) {
        console.log('❌ Aucun ID utilisateur trouvé dans les données');
        toast({
          title: "QR Code invalide",
          description: "Identifiant utilisateur manquant",
          variant: "destructive"
        });
        return;
      }

      console.log('🔍 Recherche du profil pour l\'ID:', userId);
      const { data: clientProfile, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, balance')
        .eq('id', userId)
        .maybeSingle();

      console.log('🔍 Profil trouvé:', clientProfile);
      console.log('🔍 Erreur de requête:', error);

      if (error || !clientProfile) {
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les informations du client",
          variant: "destructive"
        });
        return;
      }

      setScannedClient({
        userId: clientProfile.id,
        userName: clientProfile.full_name || 'Client',
        userPhone: clientProfile.phone,
        balance: clientProfile.balance
      });

      setIsScanning(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "QR code invalide ou corrompu",
        variant: "destructive"
      });
    }
  };

  const handleWithdraw = async () => {
    if (!scannedClient || !withdrawAmount) return;

    const amount = parseFloat(withdrawAmount);
    if (amount <= 0) {
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
      // Effectuer le retrait via la fonction RPC
      const { data, error } = await supabase.rpc('process_withdrawal_transaction', {
        p_client_id: scannedClient.userId,
        p_agent_id: profile?.id,
        p_amount: amount,
        p_commission: 0 // Pas de commission pour les commerçants
      });

      if (error) {
        throw new Error(error.message);
      }

      // Enregistrer la transaction dans l'historique
      await supabase.from('merchant_payments').insert({
        user_id: scannedClient.userId,
        merchant_id: profile?.id,
        business_name: profile?.full_name || 'Commerçant',
        amount: amount,
        description: `Retrait chez ${profile?.full_name}`,
        currency: 'XAF',
        status: 'completed'
      });

      toast({
        title: "Retrait effectué",
        description: `${amount.toLocaleString()} XAF retiré avec succès du compte de ${scannedClient.userName}`,
      });

      // Reset
      setScannedClient(null);
      setWithdrawAmount('');

    } catch (error) {
      console.error('Withdrawal error:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'effectuer le retrait",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setScannedClient(null);
    setWithdrawAmount('');
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ScanLine className="h-5 w-5 mr-2" />
            Scanner Client pour Retrait
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <CreditCard className="w-12 h-12 mx-auto text-primary" />
            <p className="text-muted-foreground">
              Scannez le QR code du client pour effectuer un retrait
            </p>
            
            <Button 
              onClick={() => setIsScanning(true)}
              className="w-full"
            >
              <ScanLine className="h-4 w-4 mr-2" />
              Scanner QR Code Client
            </Button>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 text-center">
                ℹ️ Le client doit présenter son QR code personnel
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scanner Dialog */}
      <Dialog open={isScanning} onOpenChange={setIsScanning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="w-5 h-5" />
              Scanner QR Code Client
            </DialogTitle>
          </DialogHeader>

          <FastQRScanner
            isOpen={isScanning}
            onClose={() => setIsScanning(false)}
            onScanSuccess={handleScanSuccess}
            title="Scanner Client"
            variant="compact"
          />
        </DialogContent>
      </Dialog>

      {/* Withdrawal Confirmation Dialog */}
      <Dialog open={!!scannedClient} onOpenChange={() => !isProcessing && handleCancel()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer le Retrait</DialogTitle>
          </DialogHeader>

          {scannedClient && (
            <div className="space-y-6">
              {/* Client Info */}
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center space-y-2">
                    <User className="w-8 h-8 mx-auto text-primary" />
                    <h3 className="font-semibold text-lg">{scannedClient.userName}</h3>
                    <p className="text-sm text-muted-foreground">{scannedClient.userPhone}</p>
                    <p className="text-lg font-medium">
                      Solde: {scannedClient.balance.toLocaleString()} XAF
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Withdrawal Amount */}
              <div className="space-y-2">
                <Label htmlFor="withdrawAmount">Montant à retirer (XAF)</Label>
                <Input
                  id="withdrawAmount"
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0"
                  max={scannedClient.balance}
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isProcessing}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleWithdraw}
                  disabled={isProcessing || !withdrawAmount}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isProcessing ? (
                    "Traitement..."
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Retirer
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Retrait sécurisé • Instantané
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MerchantClientScanner;