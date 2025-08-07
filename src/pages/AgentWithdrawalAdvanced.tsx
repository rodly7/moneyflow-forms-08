
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Banknote, User, Wallet, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, supabase } from "@/integrations/supabase/client";
import { processAgentWithdrawal, getCountryCodeForAgent } from "@/services/withdrawalService";
import { useUserSearch } from "@/hooks/useUserSearch";

const AgentWithdrawalAdvanced = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [clientData, setClientData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countryCode, setCountryCode] = useState("+242");
  const [agentCountry, setAgentCountry] = useState("Congo Brazzaville");

  // Use the new user search hook
  const { searchUserByPhone, isSearching } = useUserSearch();

  // Récupérer le pays de l'agent pour définir l'indicatif
  useEffect(() => {
    const fetchAgentCountry = async () => {
      if (!user?.id) return;
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('country')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Erreur lors de la récupération du profil agent:", error);
          return;
        }

        if (profile?.country) {
          setAgentCountry(profile.country);
          const code = getCountryCodeForAgent(profile.country);
          setCountryCode(code);
          console.log("✅ Pays de l'agent:", profile.country, "Indicatif:", code);
        }
      } catch (error) {
        console.error("Erreur:", error);
      }
    };

    fetchAgentCountry();
  }, [user?.id]);

  const searchClientAutomatically = async (phone: string) => {
    if (!phone || phone.length < 6) {
      setClientData(null);
      return;
    }

    try {
      console.log("🔍 Recherche automatique avec indicatif:", countryCode, phone);
      
      // Format the full phone number with country code
      const fullPhone = phone.startsWith('+') 
        ? phone 
        : `${countryCode}${phone.startsWith('0') ? phone.substring(1) : phone}`;
      
      // Utiliser le nouveau système de recherche d'utilisateurs
      const client = await searchUserByPhone(fullPhone);
      
      if (client) {
        setClientData(client);
        toast({
          title: "Client trouvé automatiquement",
          description: `${client.full_name || 'Utilisateur'} - Solde: ${formatCurrency(client.balance || 0, 'XAF')}`,
        });
        console.log("✅ Client trouvé:", client);
      } else {
        setClientData(null);
        toast({
          title: "Client non trouvé",
          description: `Ce numéro n'existe pas dans notre base de données`,
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
    const value = e.target.value.replace(/\D/g, ''); // Garder seulement les chiffres
    setPhoneNumber(value);
    
    // Réinitialiser les données client quand le numéro change
    if (clientData) {
      setClientData(null);
    }

    // Recherche automatique quand le numéro semble complet
    if (value.length >= 8) {
      searchClientAutomatically(value);
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
        description: "Veuillez d'abord saisir un numéro valide pour trouver le client",
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

    try {
      setIsProcessing(true);

      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      
      const result = await processAgentWithdrawal(
        user.id,
        clientData.id,
        withdrawalAmount,
        fullPhoneNumber
      );

      toast({
        title: "Retrait effectué avec succès",
        description: `Retrait de ${formatCurrency(withdrawalAmount, 'XAF')} effectué pour ${result.clientName}. Nouveau solde client: ${formatCurrency(result.newClientBalance, 'XAF')}`,
      });

      // Réinitialiser le formulaire
      setPhoneNumber("");
      setAmount("");
      setClientData(null);
      
    } catch (error) {
      console.error("❌ Erreur lors du retrait:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors du retrait",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const isAmountExceedsBalance = amount && clientData && Number(amount) > clientData.balance;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-4 px-0 sm:py-8 sm:px-4">
      <div className="container max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-gray-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Retrait Agent</h1>
          <div className="w-10"></div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Retrait pour un client</CardTitle>
            <p className="text-sm text-gray-600">
              Saisissez le numéro du client (avec indicatif {countryCode} - {agentCountry})
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Affichage de l'indicatif du pays */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center text-blue-800">
                  <Phone className="w-4 h-4 mr-2" />
                  <span className="font-medium">
                    Indicatif du pays: {countryCode} ({agentCountry})
                  </span>
                </div>
              </div>

              {/* Saisie du numéro du client */}
              <div className="space-y-2">
                <Label htmlFor="phone">Numéro du client (sans indicatif)</Label>
                <div className="flex gap-2">
                  <div className="w-20 flex-shrink-0">
                    <Input
                      type="text"
                      value={countryCode}
                      readOnly
                      className="bg-gray-100 text-center"
                    />
                  </div>
                  <div className="relative flex-1">
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Ex: 06123456"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      required
                      className="h-12"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  La recherche se fait automatiquement quand vous tapez le numéro
                </p>
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
                    Téléphone: {countryCode} {phoneNumber}
                  </div>
                  <div className="text-sm text-green-600">
                    Pays: {clientData.country || 'Non spécifié'}
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

              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4 h-12 text-lg"
                disabled={isProcessing || isAmountExceedsBalance || !clientData || !amount}
              >
                {isProcessing ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span>Traitement...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Banknote className="mr-2 h-5 w-5" />
                    <span>Effectuer le retrait</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentWithdrawalAdvanced;
