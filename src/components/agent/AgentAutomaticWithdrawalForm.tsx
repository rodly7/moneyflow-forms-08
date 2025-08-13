
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, AlertCircle, Loader2, Search, User, Wallet, QrCode } from "lucide-react";

import { useAgentAutomaticWithdrawal } from "@/hooks/useAgentAutomaticWithdrawal";
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

export const AgentAutomaticWithdrawalForm = () => {
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [qrVerified, setQrVerified] = useState(false);
  
  const { processAgentAutomaticWithdrawal, isProcessing } = useAgentAutomaticWithdrawal();
  const { toast } = useToast();

  const searchClientByPhone = async (phone: string) => {
    if (!phone || phone.length < 6) {
      setClientData(null);
      return;
    }

    setIsSearchingClient(true);
    try {
      console.log("🔍 Recherche client:", phone);
      
      const client = await findUserByPhone(phone);
      
      if (client) {
        setClientData(client);
        setQrVerified(false); // Reset QR verification when client changes
        console.log("✅ Client trouvé:", client.full_name);
        
        toast({
          title: "Client trouvé",
          description: `${client.full_name || 'Utilisateur'} identifié`,
        });
      } else {
        setClientData(null);
        toast({
          title: "Client non trouvé",
          description: "Aucun utilisateur trouvé avec ce numéro",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("❌ Erreur recherche:", error);
      setClientData(null);
      toast({
        title: "Erreur de recherche",
        description: "Impossible de rechercher le client",
        variant: "destructive"
      });
    }
    setIsSearchingClient(false);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneNumber(value);
    
    // Réinitialiser les données client quand le numéro change
    if (clientData) {
      setClientData(null);
      setQrVerified(false);
    }
  };

  const handleQRScanSuccess = async (userData: { userId: string; fullName: string; phone: string }) => {
    try {
      // Récupérer automatiquement le client via le numéro contenu dans le QR code
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

  const handleSearch = () => {
    if (phoneNumber) {
      searchClientByPhone(phoneNumber);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !phoneNumber || !clientData) return;

    if (!qrVerified) {
      toast({
        title: "Scan QR requis",
        description: "Vous devez scanner le QR code du client avant d'effectuer le retrait",
        variant: "destructive"
      });
      return;
    }
    
    const withdrawalAmount = Number(amount);
    
    const result = await processAgentAutomaticWithdrawal(
      clientData.id,
      withdrawalAmount,
      phoneNumber,
      clientData.full_name,
      clientData.balance
    );
    
    if (result?.success) {
      // Reset form on success
      setAmount("");
      setPhoneNumber("");
      setClientData(null);
      setQrVerified(false);
    }
  };

  const isValidAmount = !!amount && Number(amount) > 0 && !!clientData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5 text-emerald-500" />
          Demande de retrait pour client
        </CardTitle>
        <p className="text-sm text-gray-600">
          Le client recevra une notification pour autoriser ce retrait
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identification du client via QR obligatoire */}
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

          {/* Affichage des informations du client */}
          {clientData && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-2">
              <div className="flex items-center text-green-800">
                <User className="w-4 h-4 mr-2" />
                <span className="font-medium">
                  {clientData.full_name || 'Nom non disponible'}
                </span>
              </div>
              <div className="text-sm text-green-600">
                Tél: {clientData.phone}
              </div>
              <div className="text-sm text-green-600">
                Pays: {clientData.country || 'Non spécifié'}
              </div>
              
              {/* Section QR Code */}
              <div className="mt-4 pt-4 border-t border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800">
                    Vérification QR Code
                  </span>
                  {qrVerified ? (
                    <span className="text-green-600 text-sm">✅ Vérifié</span>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsQRScannerOpen(true)}
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Scanner QR
                    </Button>
                  )}
                </div>
                {!qrVerified && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ Vous devez scanner le QR code du client pour continuer
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="amount">Montant du retrait (XAF)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Entrez le montant à retirer"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="h-12 text-lg"
              disabled={!clientData}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-blue-800 text-sm">
              📱 Le client recevra une notification pour autoriser ce retrait. Le retrait ne sera effectué qu'après son approbation.
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg"
            disabled={isProcessing || !isValidAmount || !phoneNumber || !clientData || !qrVerified}
          >
            {isProcessing ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Envoi de la demande...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Send className="mr-2 h-5 w-5" />
                <span>Envoyer la demande de retrait</span>
              </div>
            )}
          </Button>
        </form>
      </CardContent>

      {/* QR Scanner Modal */}
      <QRScanner 
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={handleQRScanSuccess}
      />
    </Card>
  );
};
