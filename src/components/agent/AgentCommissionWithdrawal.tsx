import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, QrCode, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, getCurrencyForCountry, convertCurrency } from "@/integrations/supabase/client";
import SimpleQRScanner from "@/components/shared/SimpleQRScanner";

interface AgentCommissionWithdrawalProps {
  commissionBalance: number;
  onRefresh: () => void;
  userCountry?: string;
}

export const AgentCommissionWithdrawal = ({ 
  commissionBalance, 
  onRefresh, 
  userCountry = "Cameroun" 
}: AgentCommissionWithdrawalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const agentCurrency = getCurrencyForCountry(userCountry);
  const convertedCommissionBalance = convertCurrency(commissionBalance, "XAF", agentCurrency);

  const handleQRScanSuccess = async (userData: { userId: string; fullName: string; phone: string }) => {
    setIsScanning(false);
    
    if (commissionBalance <= 0) {
      toast({
        title: "Erreur",
        description: "Aucune commission à retirer",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Débiter la commission de l'agent et créditer son solde principal
      const { error: updateError } = await supabase.rpc('secure_increment_balance', {
        target_user_id: user?.id,
        amount: commissionBalance,
        operation_type: 'commission_withdrawal',
        performed_by: user?.id
      });

      if (updateError) throw updateError;

      // Remettre la commission à zéro
      const { error: commissionError } = await supabase
        .from('agents')
        .update({ commission_balance: 0 })
        .eq('user_id', user?.id);

      if (commissionError) throw commissionError;

      toast({
        title: "Retrait de commission réussi",
        description: `${formatCurrency(convertedCommissionBalance, agentCurrency)} transférés vers votre solde principal`,
      });

      onRefresh();
    } catch (error: any) {
      console.error("Erreur lors du retrait de commission:", error);
      toast({
        title: "Erreur",
        description: "Impossible de retirer les commissions",
        variant: "destructive"
      });
    }
    
    setIsProcessing(false);
  };

  return (
    <div className="p-4 bg-card rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold">Commissions Disponibles</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="text-center mb-4">
        <p className="text-2xl font-bold text-purple-600">
          {formatCurrency(convertedCommissionBalance, agentCurrency)}
        </p>
        {agentCurrency !== "XAF" && (
          <p className="text-sm text-muted-foreground">
            ({formatCurrency(commissionBalance, "XAF")})
          </p>
        )}
      </div>

      <Button
        onClick={() => setIsScanning(true)}
        disabled={commissionBalance <= 0 || isProcessing}
        className="w-full"
        variant="default"
      >
        <QrCode className="w-4 h-4 mr-2" />
        {isProcessing ? "Traitement..." : "Scanner pour retirer"}
      </Button>

      <p className="text-xs text-muted-foreground mt-2 text-center">
        Scannez votre QR code pour retirer vos commissions
      </p>

      <SimpleQRScanner
        isOpen={isScanning}
        onClose={() => setIsScanning(false)}
        onScanSuccess={handleQRScanSuccess}
      />
    </div>
  );
};