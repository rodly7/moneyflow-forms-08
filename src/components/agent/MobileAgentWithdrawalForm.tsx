
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { User, Scan, Eye, EyeOff, RefreshCw, Phone, DollarSign, ArrowLeft, Upload } from "lucide-react";
import { useDepositWithdrawalOperations } from "@/hooks/useDepositWithdrawalOperations";
import QRScanner from "@/components/agent/QRScanner";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { useNavigate } from "react-router-dom";

interface ClientData {
  id: string;
  full_name: string;
  phone: string;
  balance: number;
  country: string;
}

export const MobileAgentWithdrawalForm = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { processWithdrawal, isProcessing } = useDepositWithdrawalOperations();
  const { isSmallMobile } = useDeviceDetection();
  const navigate = useNavigate();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [qrVerified, setQrVerified] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [inputMethod, setInputMethod] = useState<'manual' | 'qr'>('manual');

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

  const searchClient = async (phoneToSearch?: string) => {
    const searchPhone = phoneToSearch || phoneNumber;
    if (!searchPhone.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un numéro de téléphone",
        variant: "destructive"
      });
      return false;
    }

    setIsSearchingClient(true);
    try {
      const { data: client, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, balance, country')
        .eq('phone', searchPhone)
        .single();

      if (error) {
        console.error("Erreur recherche client:", error);
        toast({
          title: "Client non trouvé",
          description: "Aucun client trouvé avec ce numéro",
          variant: "destructive"
        });
        setClientData(null);
        return false;
      }

      if (client) {
        setClientData(client);
        toast({
          title: "Client trouvé",
          description: `${client.full_name || 'Utilisateur'} trouvé`,
        });
        return true;
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
    return false;
  };

  const handleQRScanSuccess = async (userData: { userId: string; fullName: string; phone: string }) => {
    console.log("QR scan success:", userData);
    setPhoneNumber(userData.phone);
    setIsQRScannerOpen(false);
    
    // Rechercher automatiquement le client
    setIsSearchingClient(true);
    const clientFound = await searchClient(userData.phone);
    setIsSearchingClient(false);
    
    if (clientFound) {
      setQrVerified(true);
      toast({
        title: "QR Code vérifié",
        description: "Code QR client validé et client trouvé avec succès",
      });
    }
  };

  const handleManualSearch = async () => {
    const clientFound = await searchClient();
    if (clientFound) {
      setQrVerified(true);
      toast({
        title: "Client trouvé et vérifié",
        description: "Client trouvé avec succès via saisie manuelle",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientData) {
      toast({
        title: "Client requis",
        description: "Veuillez d'abord rechercher un client",
        variant: "destructive"
      });
      return;
    }

    if (!qrVerified) {
      toast({
        title: "Vérification requise",
        description: "Veuillez vérifier l'identité du client",
        variant: "destructive"
      });
      return;
    }

    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez saisir un montant valide",
        variant: "destructive"
      });
      return;
    }

    const success = await processWithdrawal(
      withdrawalAmount,
      clientData.id,
      clientData.full_name || 'Client',
      clientData.phone
    );

    if (success) {
      setPhoneNumber("");
      setAmount("");
      setClientData(null);
      setQrVerified(false);
      setInputMethod('manual');
      await refreshProfile();
    }
  };

  const handleGoBack = () => {
    navigate('/agent-dashboard');
  };

  // Vérifier si le formulaire est complet
  const isFormComplete = qrVerified && clientData && amount && parseFloat(amount) > 0;

  return (
    <div className="h-screen w-full bg-gradient-to-br from-orange-50 to-red-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              onClick={handleGoBack}
              className="h-10 w-10 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-red-800">Retrait Client Automatique</h1>
          </div>
          
          <p className="text-red-600 text-sm mb-4">
            Le retrait sera effectué immédiatement et vous recevrez votre commission
          </p>

          {/* Solde Agent */}
          <Card className="bg-gradient-to-r from-red-600 to-orange-600 text-white border-0">
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
          {/* Numéro du client */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-medium text-red-800">
                  Numéro du client
                </Label>
                
                {/* Section QR Scanner avec bordure pointillée */}
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 bg-blue-50/50">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-blue-600 rounded-lg flex items-center justify-center">
                      <Scan className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-blue-700 font-medium">Scanner le QR code du client</p>
                      <p className="text-blue-600 text-sm">Demandez au client de présenter son QR code</p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => setIsQRScannerOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold"
                    >
                      <Scan className="w-5 h-5 mr-2" />
                      Ouvrir le Scanner
                    </Button>
                  </div>
                </div>

                {/* Option de saisie manuelle */}
                <div className="text-center my-4">
                  <span className="text-gray-500 text-sm">ou</span>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Ex: +237123456789"
                      className="pl-12 h-12 text-base border-orange-200 focus:border-orange-400"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleManualSearch}
                    disabled={isSearchingClient}
                    className="h-12 px-6 bg-orange-600 hover:bg-orange-700"
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
                      {qrVerified && (
                        <p className="text-green-600 text-sm font-medium">✅ Identité vérifiée</p>
                      )}
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
                <Label htmlFor="amount" className="text-base font-medium text-red-800">
                  Montant du retrait (XAF)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Entrez le montant"
                  className="h-12 text-base border-orange-200 focus:border-orange-400"
                  min="100"
                  step="100"
                />
                {amount && clientData && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                    <p className="text-blue-700 text-sm font-medium">
                      💰 Commission agent: {formatCurrency(Number(amount) * 0.005, 'XAF')} (0,5%)
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bouton de soumission */}
          <Button 
            type="submit" 
            className={`w-full h-16 text-lg font-semibold rounded-lg ${
              isFormComplete && !isProcessing
                ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white' 
                : 'bg-gray-400 cursor-not-allowed text-gray-200'
            }`}
            disabled={isProcessing || !isFormComplete}
          >
            {isProcessing ? "Traitement..." : "— Effectuer le retrait"}
          </Button>

          {/* Message de sécurité */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs">🔒</span>
                </div>
                <div>
                  <p className="text-blue-800 font-medium text-sm">
                    Sécurité renforcée:
                  </p>
                  <p className="text-blue-700 text-sm">
                    Seul le scanner QR est autorisé pour identifier les clients et garantir la sécurité des transactions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Debug info pour vérifier l'état */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs">
              <p>Debug: QR vérifié: {qrVerified ? 'Oui' : 'Non'}</p>
              <p>Debug: Client trouvé: {clientData ? 'Oui' : 'Non'}</p>
              <p>Debug: Montant: {amount}</p>
              <p>Debug: Formulaire complet: {isFormComplete ? 'Oui' : 'Non'}</p>
            </div>
          )}
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
