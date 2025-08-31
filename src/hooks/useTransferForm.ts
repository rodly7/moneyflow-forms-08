
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { calculateFee } from "@/lib/utils/currency";
import { useReceiptGeneration } from "./useReceiptGeneration";
import { transactionLimitService } from "@/services/transactionLimitService";

type PendingTransferInfo = {
  recipientPhone: string;
  claimCode: string;
};

interface FormData {
  recipient: {
    fullName: string;
    phone: string;
    country: string;
  };
  transfer: {
    amount: number;
    currency: string;
  };
}

interface TransferStep {
  title: string;
}

const FORM_STEPS: TransferStep[] = [
  { title: "Informations Bénéficiaire" },
  { title: "Détails du Transfert" },
  { title: "Résumé" },
];

export function useTransferForm() {
  const { user, profile, userRole } = useAuth();
  const { toast } = useToast();
  const { generateReceipt } = useReceiptGeneration();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingTransferInfo, setPendingTransferInfo] = useState<PendingTransferInfo | null>(null);
  const [showTransferConfirmation, setShowTransferConfirmation] = useState(false);
  const [showBiometricConfirmation, setShowBiometricConfirmation] = useState(false);

  const [data, setData] = useState<FormData>({
    recipient: {
      fullName: "",
      phone: "",
      country: "",
    },
    transfer: {
      amount: 0,
      currency: "XAF",
    },
  });

  function updateFields(fields: Partial<FormData>) {
    setData(prev => ({ ...prev, ...fields }));
  }

  function back() {
    setCurrentStep(i => (i <= 0 ? i : i - 1));
  }

  function next() {
    setCurrentStep(i => (i >= FORM_STEPS.length - 1 ? i : i + 1));
  }

  const resetForm = () => {
    setData({
      recipient: { fullName: "", phone: "", country: "" },
      transfer: { amount: 0, currency: "XAF" },
    });
    setCurrentStep(0);
    setPendingTransferInfo(null);
    setShowTransferConfirmation(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep < FORM_STEPS.length - 1) {
      return next();
    }
    
    setShowTransferConfirmation(true);
  };

  const handleConfirmedTransfer = async () => {
    if (!user || !profile) {
      toast({
        title: "Erreur",
        description: "Utilisateur non connecté",
        variant: "destructive"
      });
      return;
    }

    // Vérifier la limite mensuelle avant de procéder
    const canTransfer = await transactionLimitService.canProcessTransfer(
      user.id,
      data.transfer.amount
    );

    if (!canTransfer) {
      const remainingLimit = await transactionLimitService.getRemainingLimit(user.id);
      toast({
        title: "Limite mensuelle dépassée",
        description: `Limite restante: ${remainingLimit.toLocaleString('fr-FR')} FCFA`,
        variant: "destructive",
      });
      return;
    }

    setShowTransferConfirmation(false);
    setShowBiometricConfirmation(true);
  };

  const processFinalTransfer = async () => {
    if (!user || !profile) return;

    setIsLoading(true);
    setShowBiometricConfirmation(false);

    try {
      const senderCountry = profile.country || "Cameroun";
      const { fee } = calculateFee(
        data.transfer.amount,
        senderCountry,
        data.recipient.country,
        userRole || 'user'
      );

      const { data: result, error } = await supabase.rpc('process_money_transfer', {
        sender_id: user.id,
        recipient_identifier: data.recipient.phone,
        transfer_amount: data.transfer.amount,
        transfer_fees: fee
      });

      if (error) throw error;

      const { data: pendingTransfer, error: pendingError } = await supabase
        .from('pending_transfers')
        .select('claim_code, recipient_phone')
        .eq('id', result)
        .single();

      if (!pendingError && pendingTransfer) {
        setPendingTransferInfo({
          recipientPhone: pendingTransfer.recipient_phone,
          claimCode: pendingTransfer.claim_code
        });
        
        toast({
          title: "Transfert en attente",
          description: "Le destinataire recevra un code pour réclamer l'argent",
        });
        
        await generateReceipt(result, 'transfer');
      } else {
        toast({
          title: "Transfert réussi",
          description: `${data.transfer.amount.toLocaleString('fr-FR')} FCFA envoyé à ${data.recipient.fullName}`,
        });
        
        await generateReceipt(result, 'transfer');
        resetForm();
      }

    } catch (error: any) {
      console.error('Erreur complète:', error);
      
      let errorMessage = "Une erreur est survenue lors du transfert";
      
      if (error.message?.includes('Insufficient funds')) {
        errorMessage = "Solde insuffisant pour effectuer ce transfert";
      } else if (error.message?.includes('User not found')) {
        errorMessage = "Utilisateur non trouvé";
      } else if (error.details) {
        errorMessage = `Erreur: ${error.details}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erreur de transfert",
        description: errorMessage,
        variant: "destructive"
      });
    }

    setIsLoading(false);
  };

  return {
    currentStep,
    data,
    isLoading,
    pendingTransferInfo,
    showTransferConfirmation,
    showBiometricConfirmation,
    updateFields,
    back,
    handleSubmit,
    handleConfirmedTransfer,
    processFinalTransfer,
    resetForm,
    setShowTransferConfirmation,
    setShowBiometricConfirmation
  };
}
