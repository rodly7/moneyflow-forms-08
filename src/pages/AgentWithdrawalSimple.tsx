
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Send, User, Wallet, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/integrations/supabase/client";
import { useUserSearch } from "@/hooks/useUserSearch";
import { useAgentWithdrawalRequest } from "@/hooks/useAgentWithdrawalRequest";
import QRScanner from "@/components/agent/QRScanner";

const AgentWithdrawalSimple = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [clientData, setClientData] = useState<any>(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [qrVerified, setQrVerified] = useState(false);

  const { createWithdrawalRequest, isLoading } = useAgentWithdrawalRequest();
  const { searchUserByPhone, isSearching } = useUserSearch();

  const searchClient = async () => {
    if (!phoneNumber || phoneNumber.length < 6) {
      toast({
        title: "Numéro invalide",
        description: "Veuillez entrer un numéro de téléphone valide",
        variant: "destructive"
      });
      return;
    }

    try {
      const client = await searchUserByPhone(phoneNumber);
      
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
        setQrVerified(false); // Reset QR verification when client changes
        toast({
          title: "Client trouvé",
          description: `${client.full_name || 'Utilisateur'} - Solde: ${formatCurrency(client.balance || 0, 'XAF')}`,
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
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
    if (clientData) {
      setClientData(null);
      setQrVerified(false);
    }
  };

  const handleQRScanSuccess = (userData: { userId: string; fullName: string; phone: string }) => {
    // Vérifier que le QR scanné correspond au client sélectionné
    if (clientData && clientData.id === userData.userId) {
      setQrVerified(true);
      setIsQRScannerOpen(false);
      toast({
        title: "QR Code vérifié",
        description: "Identité du client confirmée. Vous pouvez maintenant effectuer le retrait.",
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
        description: "Vous devez scanner le QR code du client avant d'effectuer le retrait",
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

    const withdrawalAmount = Number(amount);
    
    if (withdrawalAmount > clientData.balance) {
      toast({
        title: "Solde insuffisant",
        description: `Le client n'a que ${formatCurrency(clientData.balance, 'XAF')} dans son compte`,
        variant: "destructive"
      });
      return;
    }

    const result = await createWithdrawalRequest(withdrawalAmount, clientData.id);

    if (result.success) {
      // Réinitialiser le formulaire
      setPhoneNumber("");
      setAmount("");
      setClientData(null);
      setQrVerified(false);
    }
  };

  const isAmountExceedsBalance = amount && clientData && Number(amount) > clientData.balance;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-4 px-0 sm:py-8 sm:px-4">
      <div className="container max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => navigate('/agent-dashboard')} className="text-gray-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Demande de Retrait</h1>
          <div className="w-10"></div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Demander un retrait pour un client</CardTitle>
            <p className="text-sm text-gray-600">
              Le client recevra une notification pour autoriser ce retrait
            </p>
            <p className="text-sm text-orange-600 font-medium">
              Uniquement pour les clients de {profile?.country || 'votre pays'}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Recherche du client */}
              <div className="space-y-2">
                <Label htmlFor="phone">Numéro du client</Label>
                <div className="flex gap-2">
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Entrez le numéro du client"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    required
                    className="h-12"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={searchClient}
                    disabled={isSearching || !phoneNumber}
                    className="h-12 px-3"
                  >
                    {isSearching ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                    ) : (
                      "Rechercher"
                    )}
                  </Button>
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
                  <div className="flex items-center text-green-700">
                    <Wallet className="w-4 h-4 mr-2" />
                    <span>
                      Solde: {formatCurrency(clientData.balance || 0, 'XAF')}
                    </span>
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
                  placeholder="Entrez le montant"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="h-12 text-lg"
                  disabled={!clientData}
                />
                {isAmountExceedsBalance && (
                  <p className="text-red-600 text-sm">
                    Le montant dépasse le solde disponible ({formatCurrency(clientData.balance, 'XAF')})
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-blue-800 text-sm">
                  📱 Le client recevra une notification pour autoriser ce retrait. Le retrait ne sera effectué qu'après son approbation.
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4 h-12 text-lg"
                disabled={isLoading || isAmountExceedsBalance || !clientData || !amount || !qrVerified}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span>Envoi en cours...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Send className="mr-2 h-5 w-5" />
                    <span>Envoyer la demande</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* QR Scanner Modal */}
        <QRScanner 
          isOpen={isQRScannerOpen}
          onClose={() => setIsQRScannerOpen(false)}
          onScanSuccess={handleQRScanSuccess}
        />
      </div>
    </div>
  );
};

export default AgentWithdrawalSimple;
