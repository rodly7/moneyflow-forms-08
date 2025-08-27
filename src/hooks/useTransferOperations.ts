import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "./use-toast";
import { supabase, calculateFee } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationService } from "@/services/notificationService";

export const useTransferOperations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, profile, isAgent } = useAuth();

  const processTransfer = async (transferData: {
    amount: number;
    recipient: {
      email: string;
      fullName: string;
      country: string;
      phone?: string;
    };
  }) => {
    if (!user?.id) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour effectuer un transfert",
        variant: "destructive"
      });
      return { success: false };
    }

    try {
      setIsLoading(true);

      // Vérifier les données du bénéficiaire
      if (!transferData.recipient.email || !transferData.recipient.fullName) {
        toast({
          title: "Informations incomplètes",
          description: "Veuillez fournir toutes les informations du bénéficiaire",
          variant: "destructive"
        });
        return { success: false };
      }

      // Utiliser le pays du profil directement
      const userCountry = profile?.country || "Cameroun";
      
      // Calculer les frais selon le rôle
      const feeType = isAgent() ? 'agent' : 'user';
      const { fee: fees, rate, agentCommission, moneyFlowCommission } = calculateFee(
        transferData.amount, 
        userCountry, 
        transferData.recipient.country,
        feeType
      );
      
      const total = transferData.amount + fees;
      
      // Vérifier le solde
      if (profile && profile.balance < total) {
        toast({
          title: "Solde insuffisant",
          description: `Vous n'avez pas assez de fonds. Solde: ${profile.balance} XAF, Requis: ${total} XAF`,
          variant: "destructive"
        });
        return { success: false };
      }

      console.log("🔄 Traitement du transfert:", {
        typeUtilisateur: isAgent() ? 'agent' : 'user',
        paysSources: userCountry,
        paysDestination: transferData.recipient.country,
        beneficiaire: transferData.recipient.fullName,
        montant: transferData.amount,
        frais: fees,
        total: total,
        taux: rate + "%"
      });

      // Utiliser l'identifiant du destinataire
      const recipientIdentifier = transferData.recipient.phone || transferData.recipient.email;
      
      // Traiter le transfert via la procédure stockée avec retry
      let transferProcessError;
      let result;
      
      try {
        const response = await supabase
          .rpc('process_money_transfer', {
            sender_id: user.id,
            recipient_identifier: recipientIdentifier,
            transfer_amount: transferData.amount,
            transfer_fees: fees
          });
        
        result = response.data;
        transferProcessError = response.error;
      } catch (networkError) {
        console.error("❌ Erreur réseau lors du transfert:", networkError);
        
        // Tentative de fallback avec une transaction directe
        try {
          const { error: balanceError } = await supabase
            .rpc('secure_increment_balance', {
              target_user_id: user.id,
              amount: -total,
              operation_type: 'transfer_debit',
              performed_by: user.id
            });

          if (!balanceError) {
            // Créer une entrée de transfert
            const { error: transferError } = await supabase
              .from('transfers')
              .insert({
                sender_id: user.id,
                recipient_phone: transferData.recipient.phone || '',
                recipient_full_name: transferData.recipient.fullName,
                recipient_country: transferData.recipient.country,
                amount: transferData.amount,
                fees: fees,
                status: 'completed',
                currency: 'XAF'
              });

            if (!transferError) {
              toast({
                title: "Transfert Réussi",
                description: `Transfert de ${transferData.amount} XAF vers ${transferData.recipient.fullName} effectué avec succès`,
              });
              
              if (isAgent()) {
                navigate('/agent-services');
              } else {
                navigate('/');
              }
              
              return { success: true };
            }
          }
        } catch (fallbackError) {
          console.error("❌ Erreur fallback:", fallbackError);
        }
        
        toast({
          title: "Erreur de connexion",
          description: "Problème de connexion réseau. Veuillez réessayer.",
          variant: "destructive"
        });
        return { success: false };
      }

      if (transferProcessError) {
        console.error("❌ Erreur lors du transfert:", transferProcessError);
        
        // Si le destinataire n'existe pas, créer un transfert en attente
        if (transferProcessError.message.includes('Recipient not found')) {
          const claimCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          
          // Créer le transfert en attente
          const { error: pendingError } = await supabase
            .from('pending_transfers')
            .insert({
              sender_id: user.id,
              recipient_email: transferData.recipient.email,
              recipient_phone: transferData.recipient.phone || '',
              amount: transferData.amount,
              fees: fees,
              claim_code: claimCode,
              currency: 'XAF'
            });

          if (pendingError) {
            throw pendingError;
          }

          // Déduire le montant du solde
          const { error: balanceError } = await supabase
            .rpc('secure_increment_balance', {
              target_user_id: user.id,
              amount: -total,
              operation_type: 'transfer_debit',
              performed_by: user.id
            });

          if (balanceError) {
            throw balanceError;
          }

          toast({
            title: "Transfert en attente",
            description: `Le destinataire recevra un code: ${claimCode}`,
          });

          return { 
            success: true, 
            claimCode: claimCode,
            isPending: true 
          };
        }
        
        toast({
          title: "Erreur de transfert",
          description: transferProcessError.message,
          variant: "destructive"
        });
        return { success: false };
      }

      // Succès du transfert
      const isNational = userCountry === transferData.recipient.country;
      const successMessage = isAgent()
        ? `Transfert agent effectué: ${transferData.amount} XAF vers ${transferData.recipient.fullName} (${rate}%)`
        : `Transfert réussi: ${transferData.amount} XAF vers ${transferData.recipient.fullName} (${rate}%)`;

      toast({
        title: "Transfert Réussi",
        description: successMessage,
      });

      // Créer une notification pour le destinataire si le transfert est direct
      try {
        // Trouver le destinataire pour créer la notification
        const { data: recipientData } = await supabase
          .from('profiles')
          .select('id')
          .or(`phone.eq.${transferData.recipient.phone || ''},email.eq.${transferData.recipient.email}`)
          .maybeSingle();

        if (recipientData) {
          await NotificationService.createAutoNotification(
            "💰 Transfert reçu",
            `Vous avez reçu un transfert de ${transferData.amount.toLocaleString()} FCFA de ${profile?.full_name || 'un utilisateur'}`,
            'high',
            [recipientData.id],
            user.id
          );
        }
      } catch (notificationError) {
        console.error("Erreur lors de l'envoi de la notification:", notificationError);
      }
      
      // Navigation selon le rôle
      if (isAgent()) {
        navigate('/agent-services');
      } else {
        navigate('/');
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur critique:', error);
      toast({
        title: "Erreur système",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    processTransfer,
    isLoading
  };
};
