
import { useState, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, getCurrencyForCountry, convertCurrency } from "@/integrations/supabase/client";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useRealTimeQuery } from "@/hooks/useOptimizedQuery";
import { useDebounce } from "@/hooks/usePerformanceOptimization";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { useWithdrawalConfirmation } from "@/hooks/useWithdrawalConfirmation";
import SimpleHtmlWithdrawalConfirmation from "@/components/withdrawal/SimpleHtmlWithdrawalConfirmation";

interface BalanceCardProps {
  balance: number;
  userCountry: string;
  currency?: string;
  userProfile?: any;
}

const BalanceCard = ({ 
  balance, 
  userCountry,
  currency,
  userProfile
}: BalanceCardProps) => {
  const [showBalance, setShowBalance] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [commissionDetails, setCommissionDetails] = useState<{
    agentCommission: number;
    moneyFlowCommission: number;
    totalFee: number;
  } | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { 
    verificationCode, 
    setVerificationCode, 
    isProcessing, 
    confirmWithdrawal 
  } = useWithdrawalConfirmation(() => setShowVerificationDialog(false));
  
  // Déterminer la devise basée sur le pays de l'utilisateur
  const userCurrency = currency || getCurrencyForCountry(userCountry);

  // Query optimisée pour récupérer le solde en temps réel (1 seconde)
  const { data: realTimeBalance, isLoading: isLoadingBalance, refetch: refetchBalance } = useRealTimeQuery({
    queryKey: ['user-balance', user?.id],
    queryFn: async () => {
      if (!user?.id) return balance;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.warn('Erreur lors de la récupération du solde:', error);
          return balance; // Fallback au solde précédent
        }
        
        return Number(data.balance) || 0;
      } catch (error) {
        console.warn('Erreur réseau:', error);
        return balance; // Fallback au solde précédent
      }
    },
    enabled: !!user?.id,
    refetchInterval: 5000, // Rafraîchir toutes les 5 secondes
  });

  // Utilise le solde en temps réel si disponible, sinon le solde passé en props
  const displayBalanceValue = realTimeBalance !== undefined ? realTimeBalance : balance;
  
  // Convertir le solde de XAF (devise de base) vers la devise de l'utilisateur
  const convertedBalance = convertCurrency(displayBalanceValue, "XAF", userCurrency);

  // Format the balance or display asterisks if hidden
  const displayBalance = showBalance 
    ? formatCurrency(convertedBalance, userCurrency)
    : "••••••";

  const handleRefreshBalance = useDebounce(async () => {
    try {
      await refetchBalance();
      toast({
        title: "Solde actualisé",
        description: "Le solde a été mis à jour avec succès"
      });
    } catch (error) {
      console.error("Erreur lors de l'actualisation:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'actualiser le solde",
        variant: "destructive"
      });
    }
  }, 1000);

  const handleVerifyWithdrawal = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Code incomplet",
        description: "Veuillez entrer le code à 6 chiffres complet",
        variant: "destructive"
      });
      return;
    }

    const result = await confirmWithdrawal(verificationCode);
    if (result.success && result.agentCommission !== undefined) {
      setCommissionDetails({
        agentCommission: result.agentCommission || 0,
        moneyFlowCommission: result.moneyFlowCommission || 0,
        totalFee: result.totalFee || 0
      });
    } else if (!result.success) {
      setVerificationCode("");
      toast({
        title: "Erreur",
        description: result.message || "Une erreur est survenue lors du traitement du retrait",
        variant: "destructive"
      });
    }
  };

  const closeDialog = () => {
    setShowVerificationDialog(false);
    setVerificationCode("");
    setCommissionDetails(null);
  };

  return (
    <>
      <Card className="mx-4 overflow-hidden border-0 shadow-lg relative bg-gradient-to-r from-emerald-500 to-teal-600">
        <CardContent className="p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="font-medium text-white/80 text-xs mb-1">
                  Solde disponible
                </h3>
                <div className="text-xs text-white/70">
                  👤 {userProfile?.full_name || 'Utilisateur'}
                  {userProfile?.address && (
                    <div className="mt-0.5">📍 {userProfile.address}</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleRefreshBalance}
                disabled={isLoadingBalance}
                className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
                aria-label="Actualiser le solde"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={() => setShowBalance(!showBalance)}
                className="text-white/80 hover:text-white transition-colors"
                aria-label={showBalance ? "Masquer le solde" : "Afficher le solde"}
              >
                {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-white">
              {isLoadingBalance ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span className="text-lg">Chargement...</span>
                </div>
              ) : (
                displayBalance
              )}
            </p>
          </div>
          
          {realTimeBalance !== undefined && realTimeBalance !== balance && (
            <p className="text-xs text-white/60 mt-1">
              Solde mis à jour en temps réel
            </p>
          )}
          
          {userCurrency !== "XAF" && (
            <p className="text-xs text-white/60 mt-1">
              Converti de {formatCurrency(displayBalanceValue, "XAF")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Composant de confirmation de retrait */}
      <SimpleHtmlWithdrawalConfirmation
        isOpen={showVerificationDialog && !commissionDetails}
        onClose={() => setShowVerificationDialog(false)}
        onConfirm={async (code: string) => {
          setVerificationCode(code);
          await handleVerifyWithdrawal();
        }}
        amount={0} // Le montant sera géré par le hook
        phone="" // Le téléphone sera géré par le hook
        isProcessing={isProcessing}
      />

      {/* Dialog pour afficher les résultats de commission */}
      {commissionDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '24px'
            }}>
              <span style={{ fontSize: '20px' }}>✅</span>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                margin: 0,
                color: '#059669'
              }}>
                Retrait confirmé
              </h2>
            </div>

            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '24px',
              margin: 0
            }}>
              Le retrait a été traité avec succès
            </p>

            <div style={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Votre commission:</span>
                <span style={{ fontWeight: 'bold', color: '#059669' }}>
                  {formatCurrency(convertCurrency(commissionDetails.agentCommission, "XAF", userCurrency), userCurrency)}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Commission MoneyFlow:</span>
                <span style={{ fontWeight: 'bold' }}>
                  {formatCurrency(convertCurrency(commissionDetails.moneyFlowCommission, "XAF", userCurrency), userCurrency)}
                </span>
              </div>
              <div style={{
                borderTop: '1px solid #e5e7eb',
                paddingTop: '8px',
                marginTop: '8px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Frais totaux:</span>
                  <span style={{ fontWeight: 'bold' }}>
                    {formatCurrency(convertCurrency(commissionDetails.totalFee, "XAF", userCurrency), userCurrency)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setCommissionDetails(null);
                setShowVerificationDialog(false);
              }}
              style={{
                width: '100%',
                height: '48px',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default memo(BalanceCard);
