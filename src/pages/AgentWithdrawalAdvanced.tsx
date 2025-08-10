
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Banknote, User, Wallet, Phone, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, supabase } from "@/integrations/supabase/client";
import { useAgentWithdrawalEnhanced } from "@/hooks/useAgentWithdrawalEnhanced";
import { getCountryCodeForAgent } from "@/services/withdrawalService";
import "../styles/agent-mobile.css";

const AgentWithdrawalAdvanced = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [countryCode, setCountryCode] = useState("+242");
  const [agentCountry, setAgentCountry] = useState("Congo Brazzaville");

  const {
    amount,
    setAmount,
    phoneNumber,
    setPhoneNumber,
    clientData,
    isSearchingClient,
    agentBalance,
    agentCommissionBalance,
    isLoadingBalance,
    isProcessing,
    fetchAgentBalances,
    searchClientByPhone,
    handleSubmit
  } = useAgentWithdrawalEnhanced();

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
      return;
    }

    try {
      console.log("🔍 Recherche automatique avec indicatif:", countryCode, phone);
      
      // Format the full phone number with country code
      const fullPhone = phone.startsWith('+') 
        ? phone 
        : `${countryCode}${phone.startsWith('0') ? phone.substring(1) : phone}`;
      
      await searchClientByPhone(fullPhone);
    } catch (error) {
      console.error("❌ Erreur lors de la recherche:", error);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Garder seulement les chiffres
    setPhoneNumber(value);

    // Recherche automatique quand le numéro semble complet
    if (value.length >= 8) {
      searchClientAutomatically(value);
    }
  };

  const isAmountExceedsBalance = amount && clientData && Number(amount) > clientData.balance;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-4 px-0 sm:py-8 sm:px-4 agent-mobile-interface">
      <div className="container max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-gray-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Retrait Agent</h1>
          <div className="w-10"></div>
        </div>

        {/* Affichage des soldes agent avec bouton de rafraîchissement */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Mes Soldes</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchAgentBalances}
                disabled={isLoadingBalance}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Solde Principal</p>
                <p className="text-lg font-bold text-blue-800">
                  {isLoadingBalance ? "..." : formatCurrency(agentBalance, 'XAF')}
                </p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Commissions</p>
                <p className="text-lg font-bold text-green-800">
                  {isLoadingBalance ? "..." : formatCurrency(agentCommissionBalance, 'XAF')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retrait pour un client</CardTitle>
            <p className="text-sm text-gray-600">
              Saisissez le numéro du client (avec indicatif {countryCode} - {agentCountry})
            </p>
            <p className="text-xs text-orange-600 font-medium">
              Commission: 0,5% par retrait
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
                    {isSearchingClient && (
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
                {amount && clientData && (
                  <p className="text-green-600 text-sm">
                    Votre commission: {formatCurrency(Number(amount) * 0.005, 'XAF')}
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
