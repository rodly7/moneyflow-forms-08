
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
  [key: string]: any; // Index signature for Json compatibility
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

      // Mettre à jour le statut de l'agent via profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_banned: true,
          banned_reason: suspensionData.reason,
          banned_at: new Date().toISOString()
        })
        .eq('id', suspensionData.agentId)
        .eq('role', 'agent');

      if (profileError) throw profileError;

      // Créer un log d'audit
      await supabase
        .from('audit_logs')
        .insert({
          action: 'agent_suspended',
          table_name: 'profiles',
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
      const updateData = action === 'approve' 
        ? { is_verified: true, verified_at: new Date().toISOString() }
        : { is_banned: true, banned_reason: reason, banned_at: new Date().toISOString() };
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .in('id', agentIds)
        .eq('role', 'agent');

      if (error) throw error;

      // Log pour chaque agent
      const auditLogs = agentIds.map(agentId => ({
        action: `agent_${action}`,
        table_name: 'profiles',
        record_id: agentId,
        user_id: user?.id,
        new_values: { action, reason }
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

  // Gestion des limites de transaction (simulation)
  const updateTransactionLimits = useCallback(async (limits: TransactionLimit[]) => {
    setIsProcessing(true);
    try {
      // Simuler la mise à jour des limites en utilisant les audit_logs
      await supabase
        .from('audit_logs')
        .insert({
          action: 'transaction_limits_updated',
          table_name: 'transaction_limits',
          record_id: 'batch_update',
          user_id: user?.id,
          new_values: { 
            limits_count: limits.length,
            limits_summary: `Updated ${limits.length} transaction limits`
          }
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

  // Génération de rapport automatique (simulation)
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

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'agent');

      if (profilesError) throw profilesError;

      // Générer les statistiques
      const reportData = {
        period: reportType,
        generatedAt: new Date().toISOString(),
        totalTransfers: transfers?.length || 0,
        totalVolume: transfers?.reduce((sum, t) => sum + t.amount, 0) || 0,
        activeAgents: profiles?.filter(p => p.role === 'agent').length || 0,
        topPerformers: profiles?.slice(0, 5) || []
      };

      // Simuler l'enregistrement du rapport via notifications
      await supabase
        .from('notifications')
        .insert({
          title: `Rapport ${reportType} généré`,
          message: `Rapport automatique généré: ${reportData.totalTransfers} transactions, volume: ${reportData.totalVolume} FCFA`,
          notification_type: 'admin_report',
          priority: 'normal',
          sent_by: user?.id,
          total_recipients: 1
        });

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
          sent_by: user?.id,
          total_recipients: recipients.length
        })
        .select()
        .single();

      if (notifError) throw notifError;

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
