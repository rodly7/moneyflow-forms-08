
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  agent_id: string;
  agent_name: string;
  agent_phone: string;
  amount: number;
  withdrawal_phone: string;
  status: string;
  created_at: string;
  approved_at?: string;
  rejected_at?: string;
  completed_at?: string;
}

export const useWithdrawalRequestNotifications = () => {
  const { user, isAgent } = useAuth();
  const { toast } = useToast();
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [showSecureConfirmation, setShowSecureConfirmation] = useState(false);

  useEffect(() => {
    if (!user || !isAgent()) {
      return;
    }

    const fetchWithdrawalRequests = async () => {
      try {
        const { data: requests, error } = await supabase
          .from('withdrawal_requests')
          .select('*')
          .eq('agent_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erreur lors de la récupération des demandes:', error);
          return;
        }

        setWithdrawalRequests(requests || []);
      } catch (error) {
        console.error('Erreur critique lors de la récupération des demandes:', error);
      }
    };

    fetchWithdrawalRequests();

    const subscription = supabase
      .channel('withdrawal_requests')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'withdrawal_requests',
          filter: `agent_id=eq.${user.id}`
        }, 
        (payload) => {
          const newRequest = payload.new as WithdrawalRequest;
          setWithdrawalRequests(prev => [newRequest, ...prev]);
          
          toast({
            title: "Nouvelle demande de retrait",
            description: `Demande de ${newRequest.amount} XAF reçue`,
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, isAgent, toast]);

  const handleSecureConfirm = async () => {
    if (!selectedRequest) return;
    
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      setWithdrawalRequests(prev => 
        prev.filter(req => req.id !== selectedRequest.id)
      );

      toast({
        title: "Demande approuvée",
        description: "La demande de retrait a été approuvée avec succès",
      });

      setShowSecureConfirmation(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'approuver la demande",
        variant: "destructive"
      });
    }
  };

  const handleSecureReject = async () => {
    if (!selectedRequest) return;
    
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({ 
          status: 'rejected',
          rejected_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      setWithdrawalRequests(prev => 
        prev.filter(req => req.id !== selectedRequest.id)
      );

      toast({
        title: "Demande rejetée",
        description: "La demande de retrait a été rejetée",
      });

      setShowSecureConfirmation(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rejeter la demande",
        variant: "destructive"
      });
    }
  };

  const closeSecureConfirmation = () => {
    setShowSecureConfirmation(false);
    setSelectedRequest(null);
  };

  return {
    withdrawalRequests,
    pendingRequests: withdrawalRequests,
    selectedRequest,
    setSelectedRequest,
    showSecureConfirmation,
    setShowSecureConfirmation,
    handleSecureConfirm,
    handleSecureReject,
    closeSecureConfirmation
  };
};
