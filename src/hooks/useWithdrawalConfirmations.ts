
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { 
  fetchPendingWithdrawals, 
  confirmWithdrawal, 
  rejectWithdrawal,
  PendingWithdrawal 
} from "@/services/withdrawalConfirmationService";

export const useWithdrawalConfirmations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<PendingWithdrawal | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Récupérer les retraits en attente
  const { data: pendingWithdrawals = [], refetch } = useQuery({
    queryKey: ['pending-withdrawals', user?.id],
    queryFn: () => fetchPendingWithdrawals(user?.id || ''),
    enabled: !!user?.id,
    refetchInterval: 30000, // Vérifier toutes les 30 secondes
  });

  const handleNotificationClick = () => {
    if (pendingWithdrawals.length > 0) {
      setSelectedWithdrawal(pendingWithdrawals[0]);
      setShowConfirmation(true);
    }
  };

  const handleConfirm = async () => {
    if (!selectedWithdrawal || !user?.id) return;
    
    try {
      await confirmWithdrawal(selectedWithdrawal.id, user.id);
      
      toast({
        title: "Retrait confirmé",
        description: `Retrait de ${selectedWithdrawal.amount} FCFA effectué avec succès`,
      });

      setShowConfirmation(false);
      setSelectedWithdrawal(null);
      refetch();
      
    } catch (error) {
      console.error("Erreur confirmation retrait:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la confirmation du retrait",
        variant: "destructive"
      });
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal || !user?.id) return;
    
    try {
      await rejectWithdrawal(selectedWithdrawal.id, user.id);
      
      toast({
        title: "Retrait refusé",
        description: "Vous avez refusé cette demande de retrait",
      });

      setShowConfirmation(false);
      setSelectedWithdrawal(null);
      refetch();
      
    } catch (error) {
      console.error("Erreur refus retrait:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors du refus du retrait",
        variant: "destructive"
      });
    }
  };

  const closeConfirmation = () => {
    setShowConfirmation(false);
    setSelectedWithdrawal(null);
  };

  return {
    pendingWithdrawals,
    selectedWithdrawal,
    showConfirmation,
    handleNotificationClick,
    handleConfirm,
    handleReject,
    closeConfirmation
  };
};
