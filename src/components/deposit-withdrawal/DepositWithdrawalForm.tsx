import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Minus, User, Wallet, RefreshCw, Shield, Camera, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/integrations/supabase/client";
import { useUserSearch } from "@/hooks/useUserSearch";
import { useDepositWithdrawalOperations } from "@/hooks/useDepositWithdrawalOperations";
import { getUserBalance } from "@/services/withdrawalService";
import { useAuth } from "@/contexts/AuthContext";
import { calculateDepositFees, calculateWithdrawalFees } from "@/utils/depositWithdrawalCalculations";
import QRScanner from "@/components/agent/QRScanner";
import { useQRWithdrawal } from "@/hooks/useQRWithdrawal";
import SimpleHtmlDepositConfirmation from "./SimpleHtmlDepositConfirmation";

const DepositWithdrawalForm = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [clientData, setClientData] = useState<any>(null);
  const [agentBalance, setAgentBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedUserData, setScannedUserData] = useState<any>(null);
  const [showDepositConfirmation, setShowDepositConfirmation] = useState(false);

  const { searchUserByPhone, isSearching } = useUserSearch();
  const { processDeposit, processWithdrawal, isProcessing } = useDepositWithdrawalOperations();
  const { processQRWithdrawal, isProcessing: isQRProcessing } = useQRWithdrawal();

  const fetchAgentBalance = async () => {
    if (user?.id) {
      setIsLoadingBalance(true);
      try {
        const balanceData = await getUserBalance(user.id);
        setAgentBalance(balanceData.balance);
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

  useEffect(() => {
    fetchAgentBalance();
  }, [user]);

  const searchClientAutomatically = async (phone: string) => {
    if (!phone || phone.length < 6) {
      setClientData(null);
      return;
    }

    try {
      console.log("🔍 Recherche automatique du client:", phone);
      const client = await searchUserByPhone(phone);
      
      if (client) {
        const secureClientData = {
          ...client,
          balance: undefined
        };
        setClientData(secureClientData);
        console.log("✅ Client trouvé automatiquement (solde masqué):", secureClientData);
      } else {
        setClientData(null);
      }
    } catch (error) {
      console.error("❌ Erreur lors de la recherche automatique:", error);
      setClientData(null);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneNumber(value);
    
    if (clientData) {
      setClientData(null);
    }

    if (value.length >= 8) {
      searchClientAutomatically(value);
    }
  };

  const handleQRScanSuccess = (userData: { userId: string; fullName: string; phone: string }) => {
    console.log("QR Code scanné avec succès:", userData);
    
    setScannedUserData(userData);
    setPhoneNumber(userData.phone);
    
    setClientData({
      id: userData.userId,
      full_name: userData.fullName,
      phone: userData.phone,
      country: 'Vérifié par QR'
    });
    
    setShowQRScanner(false);
    
    toast({
      title: "QR Code scanné",
      description: `Client identifié: ${userData.fullName} (${userData.phone})`,
    });
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientData || !amount) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez saisir un numéro valide pour trouver le client et entrer un montant",
        variant: "destructive"
      });
      return;
    }

    const depositAmount = Number(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide",
        variant: "destructive"
      });
      return;
    }

    if (depositAmount > agentBalance) {
      toast({
        title: "Solde insuffisant",
        description: `Votre solde (${formatCurrency(agentBalance, 'XAF')}) est insuffisant pour ce dépôt`,
        variant: "destructive"
      });
      return;
    }

    setShowDepositConfirmation(true);
  };

  const handleConfirmedDeposit = async () => {
    const depositAmount = Number(amount);
    
    const success = await processDeposit(
      depositAmount,
      clientData.id,
      clientData.full_name || 'Utilisateur',
      phoneNumber
    );

    if (success) {
      setPhoneNumber("");
      setAmount("");
      setClientData(null);
      fetchAgentBalance();
      // Naviguer vers le tableau de bord agent au lieu du dashboard général
      navigate('/agent-dashboard');
    }
  };

  const handleQRWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!scannedUserData || !amount) {
      toast({
        title: "Données manquantes",
        description: "Veuillez scanner le QR code du client et entrer un montant",
        variant: "destructive"
      });
      return;
    }

    const withdrawalAmount = Number(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide",
        variant: "destructive"
      });
      return;
    }

    const result = await processQRWithdrawal(scannedUserData, withdrawalAmount);

    if (result.success) {
      setPhoneNumber("");
      setAmount("");
      setClientData(null);
      setScannedUserData(null);
      fetchAgentBalance();
      // Naviguer vers le tableau de bord agent au lieu du dashboard général
      navigate('/agent-dashboard');
    }
  };

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (scannedUserData) {
      return handleQRWithdrawalSubmit(e);
    }
    
    if (!clientData || !amount) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez scanner le QR code ou trouver un client valide pour effectuer le retrait",
        variant: "destructive"
      });
      return;
    }

    const withdrawalAmount = Number(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide",
        variant: "destructive"
      });
      return;
    }

    const success = await processWithdrawal(
      withdrawalAmount,
      clientData.id,
      clientData.full_name || 'Utilisateur',
      phoneNumber
    );

    if (success) {
      setPhoneNumber("");
      setAmount("");
      setClientData(null);
      fetchAgentBalance();
      // Naviguer vers le tableau de bord agent au lieu du dashboard général
      navigate('/agent-dashboard');
    }
  };

  const depositFees = amount ? calculateDepositFees(Number(amount)) : null;
  const withdrawalFees = amount ? calculateWithdrawalFees(Number(amount), profile?.role || 'user') : null;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 md:w-64 md:h-64 bg-emerald-200/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-96 md:h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-4 md:py-8 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 backdrop-blur-sm bg-white/70 rounded-2xl p-4 md:p-6 shadow-lg border border-white/20">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/agent-dashboard')} 
              className="text-gray-700 hover:bg-blue-50 border border-blue-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Retour</span>
            </Button>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              Services Agent
            </h1>
          </div>
          <div className="w-4"></div>
        </div>

        {/* Balance Card */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <Wallet className="w-6 h-6 text-emerald-600" />
                <span className="font-medium text-lg">Votre solde:</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-bold text-xl md:text-2xl ${agentBalance > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(agentBalance, 'XAF')}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchAgentBalance}
                  disabled={isLoadingBalance}
                  className="h-10 w-10 p-0 hover:bg-emerald-50"
                >
                  <RefreshCw className={`w-5 h-5 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 overflow-hidden">
          <Tabs defaultValue="deposit" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100/50 m-2 rounded-xl h-12">
              <TabsTrigger value="deposit" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md h-10">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Dépôt (Sans frais)</span>
                <span className="sm:hidden">Dépôt</span>
              </TabsTrigger>
              <TabsTrigger value="withdrawal" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md h-10">
                <Minus className="w-4 h-4" />
                <span className="hidden sm:inline">Retrait (Sans frais client)</span>
                <span className="sm:hidden">Retrait</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deposit" className="p-4 md:p-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-emerald-50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-emerald-600">
                    <Plus className="w-5 h-5" />
                    Dépôt Client
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    La recherche se fait automatiquement pendant que vous tapez
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleDepositSubmit} className="form-container">
                    <div className="form-field-wrapper">
                      <Label htmlFor="phone-deposit">Numéro du client</Label>
                      <div className="stable-input-group">
                        <Input
                          id="phone-deposit"
                          type="tel"
                          placeholder="Entrez le numéro du client"
                          value={phoneNumber}
                          onChange={handlePhoneChange}
                          required
                          className="h-12 text-base"
                        />
                        {isSearching && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                          </div>
                        )}
                        
                        {/* Fixed space for search feedback */}
                        <div className="min-h-[80px] mt-2">
                          {clientData && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-2 animate-fade-in">
                              <div className="flex items-center text-green-800">
                                <User className="w-4 h-4 mr-2" />
                                <span className="font-medium">{clientData.full_name || 'Nom non disponible'}</span>
                              </div>
                              <div className="text-sm text-green-600">
                                Pays: {clientData.country || 'Non spécifié'}
                              </div>
                              <div className="text-xs text-green-500 flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                Solde masqué pour la sécurité
                              </div>
                            </div>
                          )}

                          {phoneNumber.length >= 8 && !clientData && !isSearching && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-md animate-fade-in">
                              <p className="text-red-700 text-sm">
                                Aucun client trouvé avec ce numéro
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="form-field-wrapper">
                      <Label htmlFor="amount-deposit">Montant du dépôt (XAF)</Label>
                      <Input
                        id="amount-deposit"
                        type="number"
                        placeholder="Entrez le montant"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        className="h-12 text-lg"
                        disabled={!clientData}
                      />
                      
                      {/* Fixed space for fee calculation */}
                      <div className="min-h-[100px] mt-2">
                        {amount && depositFees && (
                          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md animate-fade-in">
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Montant:</span>
                                <span className="font-medium">{formatCurrency(Number(amount), 'XAF')}</span>
                              </div>
                               <div className="flex justify-between">
                                 <span>Votre commission (0,5%):</span>
                                 <span className="font-medium text-emerald-600">{formatCurrency(depositFees.agentCommission, 'XAF')}</span>
                               </div>
                              <div className="flex justify-between font-semibold border-t pt-2">
                                <span>Total à débiter:</span>
                                <span>{formatCurrency(Number(amount), 'XAF')}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                      disabled={isProcessing || !clientData || !amount || Number(amount) > agentBalance}
                    >
                      {isProcessing ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          <span>Traitement...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Plus className="mr-2 h-5 w-5" />
                          <span>Effectuer le dépôt</span>
                        </div>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="withdrawal" className="p-4 md:p-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-orange-50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <Minus className="w-5 h-5" />
                    Retrait Client
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <p className="text-sm text-gray-600">
                      Scannez le QR code du client pour effectuer le retrait
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowQRScanner(true)}
                      className="bg-emerald-600 text-white hover:bg-emerald-700 border-0"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Scanner QR
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleWithdrawalSubmit} className="form-container">
                    {/* Fixed space for QR scan feedback */}
                    <div className="min-h-[100px] mb-4">
                      {scannedUserData && (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md space-y-2 animate-fade-in">
                          <div className="flex items-center text-emerald-800">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            <span className="font-medium">QR Code scanné avec succès</span>
                          </div>
                          <div className="text-sm text-emerald-700 space-y-1">
                            <p><strong>Nom:</strong> {scannedUserData.fullName}</p>
                            <p><strong>Téléphone:</strong> {scannedUserData.phone}</p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setScannedUserData(null);
                              setPhoneNumber("");
                              setClientData(null);
                            }}
                            className="mt-2"
                          >
                            Effacer et scanner un nouveau QR
                          </Button>
                        </div>
                      )}

                      {!scannedUserData && !clientData && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md animate-fade-in">
                          <p className="text-blue-700 text-sm">
                            📱 Veuillez scanner le QR code du client pour effectuer le retrait
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="form-field-wrapper">
                      <Label htmlFor="phone-withdrawal">Numéro du client</Label>
                      <div className="stable-input-group">
                        <Input
                          id="phone-withdrawal"
                          type="tel"
                          placeholder="Scanner le QR code du client"
                          value={phoneNumber}
                          onChange={handlePhoneChange}
                          required
                          className="h-12 bg-gray-100 text-base"
                          disabled={true}
                        />
                        {isSearching && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        🔒 Saisie désactivée - Utilisez uniquement le scanner QR pour identifier le client
                      </p>
                      
                      {/* Fixed space for client data */}
                      <div className="min-h-[80px] mt-2">
                        {clientData && (
                          <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-2 animate-fade-in">
                            <div className="flex items-center text-green-800">
                              <User className="w-4 h-4 mr-2" />
                              <span className="font-medium">{clientData.full_name || 'Nom non disponible'}</span>
                            </div>
                            <div className="text-sm text-green-600">
                              Pays: {clientData.country || 'Non spécifié'}
                            </div>
                            <div className="text-xs text-green-500 flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Solde masqué pour la sécurité
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="form-field-wrapper">
                      <Label htmlFor="amount-withdrawal">Montant du retrait (XAF)</Label>
                      <Input
                        id="amount-withdrawal"
                        type="number"
                        placeholder="Entrez le montant"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        className="h-12 text-lg"
                        disabled={!scannedUserData && !clientData}
                      />
                      
                      {/* Fixed space for fee calculation */}
                      <div className="min-h-[120px] mt-2">
                       {amount && withdrawalFees && (
                          <div className="p-4 bg-orange-50 border border-orange-200 rounded-md animate-fade-in">
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Montant:</span>
                                <span className="font-medium">{formatCurrency(Number(amount), 'XAF')}</span>
                              </div>
                              {withdrawalFees.totalFee > 0 ? (
                                <>
                                   <div className="flex justify-between">
                                     <span>Pas de frais pour le client</span>
                                     <span className="font-medium text-emerald-600">{formatCurrency(0, 'XAF')}</span>
                                   </div>
                                   <div className="flex justify-between">
                                     <span>Votre commission (0,2%):</span>
                                     <span className="font-medium text-emerald-600">{formatCurrency(withdrawalFees.agentCommission, 'XAF')}</span>
                                   </div>
                                   <div className="flex justify-between font-semibold border-t pt-2">
                                     <span>Total à débiter du client:</span>
                                     <span>{formatCurrency(Number(amount), 'XAF')}</span>
                                   </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex justify-between">
                                    <span>Frais:</span>
                                    <span className="font-medium text-emerald-600">Aucun frais pour les agents</span>
                                  </div>
                                  <div className="flex justify-between font-semibold border-t pt-2">
                                    <span>Total à débiter du client:</span>
                                    <span>{formatCurrency(Number(amount), 'XAF')}</span>
                                  </div>
                                </>
                              )}
                              <div className="text-xs text-gray-600 mt-2">
                                Note: Le solde du client sera vérifié lors du traitement
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                      disabled={isProcessing || isQRProcessing || (!scannedUserData && !clientData) || !amount}
                    >
                      {(isProcessing || isQRProcessing) ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          <span>Traitement...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Minus className="mr-2 h-5 w-5" />
                          <span>
                            {scannedUserData ? 'Confirmer retrait QR' : 'Effectuer le retrait'}
                          </span>
                        </div>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScanSuccess={handleQRScanSuccess}
      />

      <SimpleHtmlDepositConfirmation
        isOpen={showDepositConfirmation}
        onClose={() => setShowDepositConfirmation(false)}
        onConfirm={handleConfirmedDeposit}
        amount={Number(amount)}
        clientName={clientData?.full_name || 'Client'}
        clientPhone={phoneNumber}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default DepositWithdrawalForm;
