import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, AlertCircle, Loader2, User, Wallet, QrCode } from "lucide-react";
import { formatCurrency } from "@/integrations/supabase/client";
import { useDepositOperations } from "@/hooks/useDepositOperations";
import { findUserByPhone } from "@/services/withdrawalService";
import { useToast } from "@/hooks/use-toast";
import QRScanner from "@/components/agent/QRScanner";

interface ClientData {
  id: string;
  full_name: string;
  phone: string;
  balance: number;
  country?: string;
}

export const AgentAutomaticDepositForm = () => {
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [qrVerified, setQrVerified] = useState(false);
  
  const { processDeposit, isProcessing } = useDepositOperations();
  const { toast } = useToast();

  const handleQRScanSuccess = async (userData: { userId: string; fullName: string; phone: string }) => {
    try {
      const client = await findUserByPhone(userData.phone);
      if (client) {
        setClientData(client);
        setPhoneNumber(client.phone);
        setQrVerified(true);
        setIsQRScannerOpen(false);
        toast({
          title: "QR Code vérifié",
          description: `${client.full_name || 'Utilisateur'} identifié automatiquement`,
        });
      } else {
        setClientData(null);
        setQrVerified(false);
        toast({
          title: "Utilisateur introuvable",
          description: "Aucun profil associé à ce QR code",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Erreur lors du traitement du QR:', err);
      toast({
        title: "Erreur QR",
        description: "Impossible de récupérer les informations de l'utilisateur",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !clientData || !qrVerified) {
      toast({
        title: "Informations incomplètes",
        description: "Scannez le QR du client et saisissez un montant",
        variant: "destructive"
      });
      return;
    }

    const depositAmount = Number(amount);
    const success = await processDeposit(
      depositAmount,
      clientData.id,
      clientData.full_name,
      clientData.balance,
      phoneNumber
    );

    if (success) {
      setAmount("");
      setPhoneNumber("");
      setClientData(null);
      setQrVerified(false);
    }
  };

  const isValidAmount = amount && Number(amount) > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5 text-emerald-500" />
          Dépôt pour client
        </CardTitle>
        <p className="text-sm text-gray-600">
          Scannez le QR du client pour l'identifier puis saisissez le montant à déposer
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identification via QR */}
          <div className="space-y-3">
            <Label>Identification du client</Label>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                L'agent doit scanner le QR code du client pour récupérer automatiquement ses informations.
              </p>
              <div className="mt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsQRScannerOpen(true)}
                  className="h-12 px-4"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Scanner le QR du client
                </Button>
              </div>
            </div>
          </div>

          {/* Informations du client */}
          {clientData && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-2">
              <div className="flex items-center text-green-800">
                <User className="w-4 h-4 mr-2" />
                <span className="font-medium">
                  {clientData.full_name || 'Nom non disponible'}
                </span>
              </div>
              <div className="flex items-center text-green-700">
                <Wallet className="w-4 h-4 mr-2" />
                <span>
                  Solde: {formatCurrency(clientData.balance || 0, 'XAF')}
                </span>
              </div>
              <div className="text-sm text-green-600">
                Téléphone: {clientData.phone}
              </div>
              <div className="mt-2 text-sm">
                {qrVerified ? <span className="text-green-600">✅ Identité vérifiée</span> : <span className="text-red-600">⚠️ QR non vérifié</span>}
              </div>
            </div>
          )}

          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="amount">Montant du dépôt (XAF)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Entrez le montant à déposer"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="h-12 text-lg"
              disabled={!clientData}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg"
            disabled={isProcessing || !isValidAmount || !clientData || !qrVerified}
          >
            {isProcessing ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Traitement du dépôt...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Download className="mr-2 h-5 w-5" />
                <span>Effectuer le dépôt</span>
              </div>
            )}
          </Button>
        </form>

        {/* QR Scanner Modal */}
        <QRScanner 
          isOpen={isQRScannerOpen}
          onClose={() => setIsQRScannerOpen(false)}
          onScanSuccess={handleQRScanSuccess}
        />
      </CardContent>
    </Card>
  );
};
