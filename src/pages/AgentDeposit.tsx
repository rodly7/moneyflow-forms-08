import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Banknote, Wallet, RefreshCw, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/integrations/supabase/client";
import { getUserBalance, getCountryCodeForAgent } from "@/services/withdrawalService";
import { supabase } from "@/integrations/supabase/client";
import PhoneInput from "@/components/transfer-steps/PhoneInput";
import { useRecipientVerification } from "@/hooks/useRecipientVerification";
import { useUserSearch } from "@/hooks/useUserSearch";

const AgentDeposit = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [clientData, setClientData] = useState<any>(null);
  const [agentBalance, setAgentBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countryCode, setCountryCode] = useState("+242"); // Default to Congo
  const [recipientName, setRecipientName] = useState("");
  const [recipientId, setRecipientId] = useState("");

  // Use the useRecipientVerification hook for user lookup
  const {
    isLoading: isVerifying,
    recipientVerified: isVerified,
    verifyRecipient,
    setRecipientVerified
  } = useRecipientVerification();

  // Use the new user search hook
  const { searchUserByPhone, isSearching } = useUserSearch();

  const findUserByPhone = async (phoneNumber: string) => {
    console.log("🔍 Recherche d'utilisateur par téléphone:", phoneNumber);
    
    try {
      // Rechercher directement dans la table profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, balance')
        .eq('phone', phoneNumber)
        .maybeSingle();
      
      if (profileError) {
        console.error("❌ Erreur lors de la recherche dans profiles:", profileError);
        return null;
      }
      
      if (profileData) {
        console.log("✅ Utilisateur trouvé dans profiles:", profileData);
        
        // Utiliser RPC pour obtenir le solde le plus à jour
        const { data: currentBalance, error: balanceError } = await supabase.rpc('increment_balance', {
          user_id: profileData.id,
          amount: 0
        });
        
        const actualBalance = balanceError ? Number(profileData.balance) || 0 : Number(currentBalance) || 0;
        
        return {
          id: profileData.id,
          full_name: profileData.full_name || "Utilisateur",
          phone: profileData.phone,
          balance: actualBalance
        };
      }
      
      console.log("ℹ️ Aucun utilisateur trouvé avec ce numéro");
      return null;
      
    } catch (error) {
      console.error("❌ Erreur lors de la recherche d'utilisateur:", error);
      return null;
    }
  };

  const fetchAgentBalance = async () => {
    if (user?.id) {
      setIsLoadingBalance(true);
      try {
        console.log("🔍 Récupération du solde agent depuis la base de données...");
        const balanceData = await getUserBalance(user.id);
        setAgentBalance(balanceData.balance);
        console.log("✅ Solde agent affiché:", balanceData.balance, "FCFA");
        
        // Set country code based on agent's country
        const agentCountryCode = getCountryCodeForAgent(balanceData.country);
        setCountryCode(agentCountryCode);
      } catch (error) {
        console.error("❌ Erreur lors du chargement du solde agent:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger votre solde",
          variant: "destructive"
        });
      }
      setIsLoadingBalance(false);
    }
  };

  // Handle phone number change with automatic verification
  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    // Reset verification if phone changes
    if (isVerified) {
      setRecipientVerified(false);
      setRecipientName("");
      setRecipientId("");
      setClientData(null);
    }
  };

  // Verify recipient using the new search system
  const handleVerifyRecipient = async () => {
    if (!phoneNumber || phoneNumber.length < 6) return;
    
    // Format the full phone number with country code
    const fullPhone = phoneNumber.startsWith('+') 
      ? phoneNumber 
      : `${countryCode}${phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber}`;
    
    console.log("Verifying phone number:", fullPhone);
    
    try {
      // Utiliser le nouveau système de recherche d'utilisateurs
      const userData = await searchUserByPhone(fullPhone);
      
      if (userData) {
        console.log("✅ Utilisateur trouvé:", userData);
        setRecipientName(userData.full_name);
        setRecipientId(userData.id);
        setClientData(userData);
        setRecipientVerified(true);
        
        toast({
          title: "Client trouvé",
          description: `${userData.full_name} - Solde: ${formatCurrency(userData.balance, 'XAF')}`,
        });
        return;
      }
      
      // User not found
      setClientData(null);
      setRecipientName("");
      setRecipientId("");
      toast({
        title: "Client non trouvé",
        description: "Ce numéro n'existe pas dans notre base de données",
        variant: "destructive"
      });
      
    } catch (err) {
      console.error("Error checking recipient:", err);
      toast({
        title: "Erreur de vérification",
        description: "Une erreur s'est produite lors de la vérification de l'utilisateur",
        variant: "destructive"
      });
      setRecipientVerified(false);
      setRecipientName("");
      setRecipientId("");
      setClientData(null);
    }
  };

  // Verify recipient automatically as they type
  useEffect(() => {
    if (phoneNumber && phoneNumber.length >= 8) {
      const delayDebounceFn = setTimeout(() => {
        handleVerifyRecipient();
      }, 500);
      
      return () => clearTimeout(delayDebounceFn);
    }
  }, [phoneNumber, countryCode]);

  useEffect(() => {
    fetchAgentBalance();
  }, [user]);

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide",
        variant: "destructive"
      });
      return;
    }

    if (!phoneNumber) {
      toast({
        title: "Numéro requis",
        description: "Veuillez entrer un numéro de téléphone",
        variant: "destructive"
      });
      return;
    }

    if (!clientData) {
      toast({
        title: "Client non vérifié",
        description: "Veuillez d'abord rechercher et vérifier le client",
        variant: "destructive"
      });
      return;
    }

    const operationAmount = Number(amount);

    // Pour les dépôts, vérifier le solde de l'agent
    if (operationAmount > agentBalance) {
      toast({
        title: "Solde agent insuffisant",
        description: `Votre solde (${formatCurrency(agentBalance, 'XAF')}) est insuffisant pour ce dépôt`,
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);

      if (!user?.id) {
        throw new Error("Agent non connecté");
      }

      // Traitement du dépôt (agent débité, client crédité)
      // Débiter l'agent
      const { error: debitError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: -operationAmount
      });

      if (debitError) {
        console.error("❌ Erreur lors du débit de l'agent:", debitError);
        throw new Error("Erreur lors du débit du compte agent");
      }

      // Créditer le client
      const { error: creditError } = await supabase.rpc('increment_balance', {
        user_id: clientData.id,
        amount: operationAmount
      });

      if (creditError) {
        console.error("❌ Erreur lors du crédit du client:", creditError);
        // En cas d'erreur, recréditer l'agent
        await supabase.rpc('increment_balance', {
          user_id: user.id,
          amount: operationAmount
        });
        throw new Error("Erreur lors du crédit du compte client");
      }

      toast({
        title: "Dépôt effectué",
        description: `Dépôt de ${formatCurrency(operationAmount, 'XAF')} effectué pour ${clientData.full_name}`,
      });

      // Réinitialiser le formulaire
      setAmount("");
      setPhoneNumber("");
      setClientData(null);
      setRecipientName("");
      setRecipientId("");
      setRecipientVerified(false);
      
      // Actualiser le solde de l'agent
      fetchAgentBalance();
      
    } catch (error) {
      console.error("❌ Erreur lors du dépôt:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors du dépôt",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide",
        variant: "destructive"
      });
      return;
    }

    if (!phoneNumber) {
      toast({
        title: "Numéro requis",
        description: "Veuillez entrer un numéro de téléphone",
        variant: "destructive"
      });
      return;
    }

    if (!clientData) {
      toast({
        title: "Client non vérifié",
        description: "Veuillez d'abord rechercher et vérifier le client",
        variant: "destructive"
      });
      return;
    }

    const operationAmount = Number(amount);

    // Pour les retraits, vérifier le solde du client
    if (operationAmount > clientData.balance) {
      toast({
        title: "Solde client insuffisant",
        description: `Le solde du client (${formatCurrency(clientData.balance, 'XAF')}) est insuffisant pour ce retrait`,
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);

      if (!user?.id) {
        throw new Error("Agent non connecté");
      }

      // Traitement du retrait (client débité, agent crédité)
      // Débiter le client
      const { error: debitError } = await supabase.rpc('increment_balance', {
        user_id: clientData.id,
        amount: -operationAmount
      });

      if (debitError) {
        console.error("❌ Erreur lors du débit du client:", debitError);
        throw new Error("Erreur lors du débit du compte client");
      }

      // Créditer l'agent
      const { error: creditError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: operationAmount
      });

      if (creditError) {
        console.error("❌ Erreur lors du crédit de l'agent:", creditError);
        // En cas d'erreur, recréditer le client
        await supabase.rpc('increment_balance', {
          user_id: clientData.id,
          amount: operationAmount
        });
        throw new Error("Erreur lors du crédit du compte agent");
      }

      // Créer l'enregistrement du retrait
      const { error: withdrawalError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: clientData.id,
          amount: operationAmount,
          withdrawal_phone: phoneNumber,
          status: 'completed'
        });

      if (withdrawalError) {
        console.error("❌ Erreur lors de l'enregistrement du retrait:", withdrawalError);
        // Continue même si l'enregistrement échoue
      }

      toast({
        title: "Retrait effectué",
        description: `Retrait de ${formatCurrency(operationAmount, 'XAF')} effectué pour ${clientData.full_name}`,
      });

      // Réinitialiser le formulaire
      setAmount("");
      setPhoneNumber("");
      setClientData(null);
      setRecipientName("");
      setRecipientId("");
      setRecipientVerified(false);
      
      // Actualiser le solde de l'agent
      fetchAgentBalance();
      
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

  const isDepositAmountExceedsBalance = amount && Number(amount) > agentBalance;
  const isWithdrawalAmountExceedsBalance = amount && clientData && Number(amount) > clientData.balance;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-4 px-0 sm:py-8 sm:px-4">
      <div className="container max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-gray-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Services Agent</h1>
          <div className="w-10"></div>
        </div>

        {isLoadingBalance ? (
          <Card>
            <CardContent className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="deposit" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="deposit" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Dépôt
              </TabsTrigger>
              <TabsTrigger value="withdrawal" className="flex items-center gap-2">
                <Minus className="w-4 h-4" />
                Retrait
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deposit">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-emerald-500" />
                    Dépôt pour un client
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleDepositSubmit} className="space-y-4">
                    {/* Affichage du solde agent avec bouton d'actualisation */}
                    <div className="px-3 py-2 bg-emerald-50 rounded-md text-sm border border-emerald-200">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Wallet className="w-4 h-4 mr-2 text-emerald-600" />
                          <span className="font-medium">Votre solde agent:</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${agentBalance > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatCurrency(agentBalance, 'XAF')}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={fetchAgentBalance}
                            disabled={isLoadingBalance}
                            className="h-6 w-6 p-0"
                          >
                            <RefreshCw className={`w-3 h-3 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <PhoneInput
                      phoneInput={phoneNumber}
                      countryCode={countryCode}
                      onPhoneChange={handlePhoneChange}
                      isLoading={isVerifying || isSearching}
                      isVerified={isVerified}
                      recipientName={recipientName}
                      label="Numéro du client"
                      onBlurComplete={handleVerifyRecipient}
                    />
                      
                    {clientData && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-green-800 font-medium">
                          ✓ Client trouvé: {clientData.full_name || 'Nom non disponible'}
                        </p>
                        <p className="text-green-700 text-sm">
                          Solde actuel: {formatCurrency(clientData.balance, 'XAF')}
                        </p>
                      </div>
                    )}

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
                      {isDepositAmountExceedsBalance && (
                        <p className="text-red-600 text-sm">
                          Le montant dépasse votre solde agent ({formatCurrency(agentBalance, 'XAF')})
                        </p>
                      )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
                      <p>
                        💰 Dépôt: Votre compte sera débité et le compte du client sera crédité
                      </p>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4 h-12 text-lg"
                      disabled={isProcessing || isDepositAmountExceedsBalance || agentBalance <= 0 || !clientData}
                    >
                      {isProcessing ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          <span>Traitement...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Banknote className="mr-2 h-5 w-5" />
                          <span>Effectuer le dépôt</span>
                        </div>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="withdrawal">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Minus className="w-5 h-5 text-orange-500" />
                    Retrait pour un client
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                    {/* Affichage du solde agent avec bouton d'actualisation */}
                    <div className="px-3 py-2 bg-emerald-50 rounded-md text-sm border border-emerald-200">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Wallet className="w-4 h-4 mr-2 text-emerald-600" />
                          <span className="font-medium">Votre solde agent:</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${agentBalance > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatCurrency(agentBalance, 'XAF')}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={fetchAgentBalance}
                            disabled={isLoadingBalance}
                            className="h-6 w-6 p-0"
                          >
                            <RefreshCw className={`w-3 h-3 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <PhoneInput
                      phoneInput={phoneNumber}
                      countryCode={countryCode}
                      onPhoneChange={handlePhoneChange}
                      isLoading={isVerifying || isSearching}
                      isVerified={isVerified}
                      recipientName={recipientName}
                      label="Numéro du client"
                      onBlurComplete={handleVerifyRecipient}
                    />
                      
                    {clientData && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-green-800 font-medium">
                          ✓ Client trouvé: {clientData.full_name || 'Nom non disponible'}
                        </p>
                        <p className="text-green-700 text-sm">
                          Solde actuel: {formatCurrency(clientData.balance, 'XAF')}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="amount-withdrawal">Montant du retrait (XAF)</Label>
                      <Input
                        id="amount-withdrawal"
                        type="number"
                        placeholder="Entrez le montant"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        className="h-12 text-lg"
                        disabled={!clientData}
                      />
                      {isWithdrawalAmountExceedsBalance && (
                        <p className="text-red-600 text-sm">
                          Le montant dépasse le solde du client ({formatCurrency(clientData.balance, 'XAF')})
                        </p>
                      )}
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-sm text-orange-800">
                      <p>
                        💰 Retrait: Le compte du client sera débité et votre compte sera crédité
                      </p>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-orange-600 hover:bg-orange-700 mt-4 h-12 text-lg"
                      disabled={isProcessing || isWithdrawalAmountExceedsBalance || !clientData}
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
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default AgentDeposit;
