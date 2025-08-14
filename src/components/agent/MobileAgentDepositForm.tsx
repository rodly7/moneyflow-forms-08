
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { User, Scan, Eye, EyeOff, RefreshCw, Phone, DollarSign } from "lucide-react";
import { useAgentAutomaticDeposit } from "@/hooks/useAgentAutomaticDeposit";
import QRScanner from "@/components/agent/QRScanner";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";

interface ClientData {
  id: string;
  full_name: string;
  phone: string;
  balance: number;
  country: string;
}

export const MobileAgentDepositForm = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { processAgentAutomaticDeposit, isProcessing } = useAgentAutomaticDeposit();
  const { isSmallMobile } = useDeviceDetection();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [qrVerified, setQrVerified] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [showBalance, setShowBalance] = useState(false);

  const agentBalance = profile?.balance || 0;

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
    if (!phoneNumber.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un numéro de téléphone",
        variant: "destructive"
      });
      return;
    }

    setIsSearchingClient(true);
    try {
      const { data: client, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, balance, country')
        .eq('phone', phoneNumber)
        .single();

      if (error) {
        console.error("Erreur recherche client:", error);
        toast({
          title: "Client non trouvé",
          description: "Aucun client trouvé avec ce numéro",
          variant: "destructive"
        });
        setClientData(null);
        return;
      }

      if (client) {
        setClientData(client);
        setQrVerified(false);
        toast({
          title: "Client trouvé",
          description: `${client.full_name || 'Utilisateur'} trouvé`,
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la recherche",
        variant: "destructive"
      });
    }
    setIsSearchingClient(false);
  };

  const handleQRScanSuccess = (userData: { userId: string; fullName: string; phone: string }) => {
    setPhoneNumber(userData.phone);
    setQrVerified(true);
    setIsQRScannerOpen(false);
    
    toast({
      title: "QR Code vérifié",
      description: "Code QR client validé avec succès",
    });
    
    // Rechercher automatiquement le client
    setTimeout(() => {
      searchClient();
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!qrVerified) {
      toast({
        title: "Vérification requise",
        description: "Veuillez scanner le QR code du client pour continuer",
        variant: "destructive"
      });
      return;
    }

    if (!clientData) {
      toast({
        title: "Client requis",
        description: "Veuillez d'abord rechercher un client",
        variant: "destructive"
      });
      return;
    }

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez saisir un montant valide",
        variant: "destructive"
      });
      return;
    }

    if (depositAmount > agentBalance) {
      toast({
        title: "Solde insuffisant",
        description: "Votre solde agent est insuffisant pour ce dépôt",
        variant: "destructive"
      });
      return;
    }

    // Corriger l'appel avec tous les paramètres requis
    const result = await processAgentAutomaticDeposit(
      clientData.id,
      depositAmount,
      clientData.phone,
      clientData.full_name || 'Client',
      agentBalance
    );

    if (result.success) {
      setPhoneNumber("");
      setAmount("");
      setClientData(null);
      setQrVerified(false);
      await refreshProfile();
    }
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-gray-800 mb-4">Dépôt Client</h1>
          
          {/* Solde Agent */}
          <Card className="bg-gradient-to-r from-emerald-600 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm opacity-90">Solde Agent</p>
                    <p className="text-xl font-bold">
                      {showBalance ? formatCurrency(agentBalance, 'XAF') : "••••••"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost"
                    onClick={() => setShowBalance(!showBalance)}
                    className="h-10 w-10 p-0 text-white/80 hover:text-white hover:bg-white/10"
                  >
                    {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={handleRefreshBalance}
                    disabled={isLoadingBalance}
                    className="h-10 w-10 p-0 text-white/80 hover:text-white hover:bg-white/10"
                  >
                    <RefreshCw className={`w-5 h-5 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Scanner QR */}
          <Card>
            <CardContent className="p-4">
              <Button
                type="button"
                onClick={() => setIsQRScannerOpen(true)}
                className={`w-full h-16 text-lg font-semibold ${
                  qrVerified 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <Scan className="w-6 h-6 mr-3" />
                {qrVerified ? "QR Code Vérifié ✓" : "Scanner QR Client"}
              </Button>
            </CardContent>
          </Card>

          {/* Recherche client */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-base font-medium">
                  Numéro de téléphone
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Ex: +237123456789"
                      className="pl-12 h-12 text-base"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={searchClient}
                    disabled={isSearchingClient}
                    className="h-12 px-6"
                  >
                    {isSearchingClient ? "..." : "Chercher"}
                  </Button>
                </div>
              </div>

              {/* Infos client */}
              {clientData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {clientData.full_name || 'Utilisateur'}
                      </p>
                      <p className="text-sm text-gray-600">{clientData.phone}</p>
                      <p className="text-sm text-gray-600">{clientData.country}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Montant */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-base font-medium">
                  Montant du dépôt (XAF)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Montant en XAF"
                  className="h-12 text-base"
                  min="100"
                  step="100"
                />
              </div>
            </CardContent>
          </Card>

          {/* Bouton de soumission */}
          <Button 
            type="submit" 
            className="w-full bg-emerald-600 hover:bg-emerald-700 h-16 text-lg font-semibold"
            disabled={isProcessing || !qrVerified || !clientData}
          >
            {isProcessing ? "Traitement..." : "Effectuer le Dépôt"}
          </Button>
        </form>
      </div>

      {/* Scanner QR */}
      <QRScanner
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={handleQRScanSuccess}
      />
    </div>
  );
};
