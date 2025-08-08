
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface AgentSuspensionData {
  agentId: string;
  suspensionType: 'temporary' | 'indefinite';
  duration?: number; // en jours
  reason: string;
  suspendedBy: string;
}

export interface TransactionLimit {
  userRole: 'user' | 'agent' | 'admin';
  operationType: string;
  singleLimit: number;
  dailyLimit: number;
  country?: string;
}

export interface AuditLogEntry {
  action: string;
  tableName: string;
  recordId: string;
  userId: string;
  timestamp: string;
  oldValues?: any;
  newValues?: any;
}

export const useAdvancedAdmin = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Suspension d'agent avec durée
  const suspendAgent = useCallback(async (suspensionData: AgentSuspensionData) => {
    setIsProcessing(true);
    try {
      const suspensionEndDate = suspensionData.suspensionType === 'temporary' && suspensionData.duration
        ? new Date(Date.now() + suspensionData.duration * 24 * 60 * 60 * 1000)
        : null;

      // Mettre à jour le statut de l'agent
      const { error: agentError } = await supabase
        .from('agents')
        .update({
          status: 'suspended',
          suspension_reason: suspensionData.reason,
          suspended_at: new Date().toISOString(),
          suspension_end_date: suspensionEndDate?.toISOString(),
          suspended_by: suspensionData.suspendedBy
        })
        .eq('user_id', suspensionData.agentId);

      if (agentError) throw agentError;

      // Créer un log d'audit
      await supabase
        .from('audit_logs')
        .insert({
          action: 'agent_suspended',
          table_name: 'agents',
          record_id: suspensionData.agentId,
          user_id: suspensionData.suspendedBy,
          new_values: {
            status: 'suspended',
            reason: suspensionData.reason,
            type: suspensionData.suspensionType,
            duration: suspensionData.duration
          }
        });

      toast({
        title: "Agent suspendu",
        description: `Agent suspendu avec succès ${suspensionData.suspensionType === 'temporary' ? `pour ${suspensionData.duration} jours` : 'de manière indéfinie'}`,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erreur suspension agent:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suspension de l'agent",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  // Validation en lot des agents
  const batchValidateAgents = useCallback(async (agentIds: string[], action: 'approve' | 'reject', reason?: string) => {
    setIsProcessing(true);
    try {
      const newStatus = action === 'approve' ? 'active' : 'rejected';
      
      const { error } = await supabase
        .from('agents')
        .update({
          status: newStatus,
          validated_at: new Date().toISOString(),
          validated_by: user?.id,
          validation_reason: reason
        })
        .in('user_id', agentIds);

      if (error) throw error;

      // Log pour chaque agent
      const auditLogs = agentIds.map(agentId => ({
        action: `agent_${action}`,
        table_name: 'agents',
        record_id: agentId,
        user_id: user?.id,
        new_values: { status: newStatus, reason }
      }));

      await supabase
        .from('audit_logs')
        .insert(auditLogs);

      toast({
        title: `${agentIds.length} agent(s) ${action === 'approve' ? 'approuvé(s)' : 'rejeté(s)'}`,
        description: "Action effectuée avec succès",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erreur validation lot:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la validation en lot",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setIsProcessing(false);
    }
  }, [user?.id, toast]);

  // Gestion des limites de transaction
  const updateTransactionLimits = useCallback(async (limits: TransactionLimit[]) => {
    setIsProcessing(true);
    try {
      // Supprimer les anciennes limites et insérer les nouvelles
      for (const limit of limits) {
        const { error } = await supabase
          .from('transaction_limits')
          .upsert({
            user_role: limit.userRole,
            operation_type: limit.operationType,
            single_limit: limit.singleLimit,
            daily_limit: limit.dailyLimit,
            country: limit.country,
            updated_at: new Date().toISOString(),
            updated_by: user?.id
          }, {
            onConflict: 'user_role,operation_type,country'
          });

        if (error) throw error;
      }

      // Log de l'action
      await supabase
        .from('audit_logs')
        .insert({
          action: 'transaction_limits_updated',
          table_name: 'transaction_limits',
          record_id: 'batch_update',
          user_id: user?.id,
          new_values: { limits_count: limits.length }
        });

      toast({
        title: "Limites mises à jour",
        description: `${limits.length} limite(s) de transaction mise(s) à jour`,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erreur mise à jour limites:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour des limites",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setIsProcessing(false);
    }
  }, [user?.id, toast]);

  // Génération de rapport automatique
  const generateReport = useCallback(async (reportType: 'daily' | 'weekly' | 'monthly', filters?: any) => {
    setIsProcessing(true);
    try {
      const startDate = new Date();
      if (reportType === 'daily') {
        startDate.setDate(startDate.getDate() - 1);
      } else if (reportType === 'weekly') {
        startDate.setDate(startDate.getDate() - 7);
      } else {
        startDate.setMonth(startDate.getMonth() - 1);
      }

      // Récupérer les données selon le type de rapport
      const { data: transfers, error: transfersError } = await supabase
        .from('transfers')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (transfersError) throw transfersError;

      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('*, profiles!inner(full_name, country)');

      if (agentsError) throw agentsError;

      // Générer les statistiques
      const reportData = {
        period: reportType,
        generatedAt: new Date().toISOString(),
        totalTransfers: transfers?.length || 0,
        totalVolume: transfers?.reduce((sum, t) => sum + t.amount, 0) || 0,
        activeAgents: agents?.filter(a => a.status === 'active').length || 0,
        topPerformers: agents?.slice(0, 5) || []
      };

      // Enregistrer le rapport
      const { error: reportError } = await supabase
        .from('admin_reports')
        .insert({
          report_type: reportType,
          report_data: reportData,
          generated_by: user?.id,
          filters: filters
        });

      if (reportError) throw reportError;

      toast({
        title: "Rapport généré",
        description: `Rapport ${reportType} généré avec succès`,
      });

      return { success: true, data: reportData };
    } catch (error: any) {
      console.error('Erreur génération rapport:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la génération du rapport",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setIsProcessing(false);
    }
  }, [user?.id, toast]);

  // Envoi de notification push ciblée
  const sendTargetedNotification = useCallback(async (
    recipients: string[], 
    title: string, 
    message: string, 
    priority: 'low' | 'normal' | 'high' = 'normal'
  ) => {
    setIsProcessing(true);
    try {
      // Créer la notification principale
      const { data: notification, error: notifError } = await supabase
        .from('notifications')
        .insert({
          title,
          message,
          notification_type: 'targeted',
          priority,
          created_by: user?.id,
          total_recipients: recipients.length
        })
        .select()
        .single();

      if (notifError) throw notifError;

      // Créer les entrées pour chaque destinataire
      const recipientEntries = recipients.map(userId => ({
        notification_id: notification.id,
        user_id: userId,
        status: 'sent'
      }));

      const { error: recipientsError } = await supabase
        .from('notification_recipients')
        .insert(recipientEntries);

      if (recipientsError) throw recipientsError;

      toast({
        title: "Notification envoyée",
        description: `Notification envoyée à ${recipients.length} destinataire(s)`,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erreur notification:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'envoi de la notification",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setIsProcessing(false);
    }
  }, [user?.id, toast]);

  return {
    suspendAgent,
    batchValidateAgents,
    updateTransactionLimits,
    generateReport,
    sendTargetedNotification,
    isProcessing
  };
};
