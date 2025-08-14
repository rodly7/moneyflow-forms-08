
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, AlertCircle, Loader2, User, Wallet, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { findUserByPhone } from "@/services/withdrawalService";
import { formatCurrency } from "@/integrations/supabase/client";
import { useAgentAutomaticDeposit } from "@/hooks/useAgentAutomaticDeposit";
import QRScanner from "@/components/agent/QRScanner";
import { ClientSearchForm } from "@/components/agent/ClientSearchForm";
import { AgentBalanceCard } from "@/components/agent/AgentBalanceCard";

interface ClientData {
  id: string;
  full_name: string;
  phone: string;
  balance: number;
  country?: string;
}

export const AgentAutomaticDepositForm = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { processAgentAutomaticDeposit, isProcessing } = useAgentAutomaticDeposit();

  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [qrVerified, setQrVerified] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Utiliser le solde du profil directement
  const agentBalance = profile?.balance || 0;

  // Rafraîchir le profil au chargement pour s'assurer d'avoir le bon solde
  useEffect(() => {
    if (user?.id && profile) {
      refreshProfile();
    }
  }, [user?.id, refreshProfile]);

  const handleRefreshBalance = async () => {
    setIsLoadingBalance(true);
    try {
      await refreshProfile();
      toast({
        title: "Solde actualisé",
        description: "Votre solde agent a été mis à jour",
      });
    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'actualiser le solde",
        variant: "destructive"
      });
    }
    setIsLoadingBalance(false);
  };

  const searchClient = async () => {
    if (!phoneNumber || phoneNumber.length < 6) {
      toast({
        title: "Numéro invalide",
        description: "Veuillez entrer un numéro de téléphone valide",
        variant: "destructive"
      });
      return;
    }

    setIsSearchingClient(true);
    try {
      const client = await findUserByPhone(phoneNumber);
      
      if (client) {
        // Vérifier si le client est dans le même pays que l'agent
        if (profile?.country && client.country !== profile.country) {
          toast({
            title: "Client non autorisé",
            description: `Vous ne pouvez effectuer des opérations que pour des clients de ${profile.country}`,
            variant: "destructive"
          });
          setClientData(null);
          return;
        }

        setClientData(client);
        setQrVerified(false);
        toast({
          title: "Client trouvé",
          description: `${client.full_name || 'Utilisateur'} - Solde masqué pour la sécurité`,
        });
      } else {
        setClientData(null);
        toast({
          title: "Client non trouvé",
          description: "Ce numéro n'existe pas dans notre base de données",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("❌ Erreur lors de la recherche:", error);
      toast({
        title: "Erreur de recherche",
        description: "Impossible de rechercher le client",
        variant: "destructive"
      });
      setClientData(null);
    }
    setIsSearchingClient(false);
  };

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    if (clientData) {
      setClientData(null);
      setQrVerified(false);
    }
  };

  const handleQRScanSuccess = (userData: { userId: string; fullName: string; phone: string }) => {
    if (clientData && clientData.id === userData.userId) {
      setQrVerified(true);
      setIsQRScannerOpen(false);
      toast({
        title: "QR Code vérifié",
        description: "Identité du client confirmée. Vous pouvez maintenant effectuer le dépôt.",
      });
    } else {
      toast({
        title: "QR Code incorrect",
        description: "Le QR code scanné ne correspond pas au client sélectionné",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté",
        variant: "destructive"
      });
      return;
    }

    if (!clientData) {
      toast({
        title: "Client requis",
        description: "Veuillez d'abord rechercher et sélectionner un client",
        variant: "destructive"
      });
      return;
    }

    if (!qrVerified) {
      toast({
        title: "Scan QR requis",
        description: "Vous devez scanner le QR code du client avant d'effectuer le dépôt",
        variant: "destructive"
      });
      return;
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide",
        variant: "destructive"
      });
      return;
    }

    const depositAmount = Number(amount);
    
    const result = await processAgentAutomaticDeposit(
      clientData.id,
      depositAmount,
      clientData.phone,
      clientData.full_name,
      agentBalance
    );

    if (result.success) {
      // Réinitialiser le formulaire
      setPhoneNumber("");
      setAmount("");
      setClientData(null);
      setQrVerified(false);
      // Rafraîchir le solde agent
      await refreshProfile();
    }
  };

  const isAmountExceedsBalance = amount && Number(amount) > agentBalance;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5 text-emerald-500" />
          Dépôt Client
        </CardTitle>
        <p className="text-sm text-gray-600">
          Effectuez un dépôt pour un client avec commission de 0,5%
        </p>
        <p className="text-sm text-orange-600 font-medium">
          Uniquement pour les clients de {profile?.country || 'votre pays'}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Affichage du solde agent */}
          <AgentBalanceCard
            balance={agentBalance}
            isLoading={isLoadingBalance}
            onRefresh={handleRefreshBalance}
            userCountry={profile?.country}
          />

          {/* Recherche du client */}
          <ClientSearchForm
            phoneNumber={phoneNumber}
            clientData={clientData}
            isSearching={isSearchingClient}
            onPhoneChange={handlePhoneChange}
            onSearch={searchClient}
            onQRScan={() => setIsQRScannerOpen(true)}
          />

          {/* Section QR Code */}
          {clientData && (
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
          )}

          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="amount">Montant du dépôt (XAF)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Entrez le montant"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="h-12 text-lg"
              disabled={!clientData}
            />
            {isAmountExceedsBalance && (
              <p className="text-red-600 text-sm">
                Le montant dépasse votre solde disponible ({formatCurrency(agentBalance, 'XAF')})
              </p>
            )}
            {amount && clientData && !isAmountExceedsBalance && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-700 text-sm">
                  💰 Commission: {formatCurrency(Number(amount) * 0.005, 'XAF')} (0,5%)
                </p>
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4 h-12 text-lg"
            disabled={isProcessing || isAmountExceedsBalance || !clientData || !amount || !qrVerified}
          >
            {isProcessing ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Traitement en cours...</span>
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
