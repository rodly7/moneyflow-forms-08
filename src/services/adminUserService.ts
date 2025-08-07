import { supabase } from "@/integrations/supabase/client";
import { secureCreditUserBalance, secureDebitUserBalance } from "./secureBalanceService";

export interface AdminUserData {
  id: string;
  full_name: string | null;
  phone: string;
  balance: number;
  country: string | null;
  role: 'user' | 'agent' | 'admin' | 'sub_admin';
  is_banned?: boolean;
  banned_reason?: string | null;
  created_at: string;
  is_verified?: boolean;
}

export interface UserOperationResult {
  success: boolean;
  message: string;
  data?: any;
}

// Service centralisé pour la gestion des utilisateurs avec retry automatique
export class AdminUserService {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000;

  // Retry wrapper pour les opérations Supabase
  private static async withRetry<T>(
    operation: () => Promise<T>,
    retries = this.MAX_RETRIES
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        return this.withRetry(operation, retries - 1);
      }
      throw error;
    }
  }

  // Récupérer tous les utilisateurs avec gestion d'erreurs robuste
  static async fetchAllUsers(): Promise<UserOperationResult> {
    try {
      const result = await this.withRetry(async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
      });

      return {
        success: true,
        message: "Utilisateurs chargés avec succès",
        data: result || []
      };
    } catch (error: any) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      return {
        success: false,
        message: error.message || "Erreur lors du chargement des utilisateurs"
      };
    }
  }

  // Changer le rôle d'un utilisateur avec validation
  static async changeUserRole(
    userId: string, 
    newRole: 'user' | 'agent' | 'admin' | 'sub_admin',
    performedBy?: string
  ): Promise<UserOperationResult> {
    try {
      // Validation du rôle
      const validRoles = ['user', 'agent', 'admin', 'sub_admin'];
      if (!validRoles.includes(newRole)) {
        return {
          success: false,
          message: "Rôle invalide"
        };
      }

      const result = await this.withRetry(async () => {
        const { error } = await supabase
          .from('profiles')
          .update({ role: newRole })
          .eq('id', userId);

        if (error) throw error;

        // Log de l'opération
        await supabase
          .from('audit_logs')
          .insert({
            action: 'role_change',
            table_name: 'profiles',
            record_id: userId,
            user_id: performedBy,
            new_values: { role: newRole }
          });
      });

      return {
        success: true,
        message: `Rôle changé vers ${newRole} avec succès`
      };
    } catch (error: any) {
      console.error('Erreur lors du changement de rôle:', error);
      return {
        success: false,
        message: error.message || "Erreur lors du changement de rôle"
      };
    }
  }

  // Bannir/débannir un utilisateur
  static async toggleUserBan(
    userId: string, 
    currentBanStatus: boolean,
    reason?: string,
    performedBy?: string
  ): Promise<UserOperationResult> {
    try {
      const newBanStatus = !currentBanStatus;

      await this.withRetry(async () => {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            is_banned: newBanStatus,
            banned_at: newBanStatus ? new Date().toISOString() : null,
            banned_reason: newBanStatus ? (reason || 'Banni par l\'administrateur') : null
          })
          .eq('id', userId);

        if (error) throw error;

        // Log de l'opération
        await supabase
          .from('audit_logs')
          .insert({
            action: newBanStatus ? 'user_banned' : 'user_unbanned',
            table_name: 'profiles',
            record_id: userId,
            user_id: performedBy,
            new_values: { 
              is_banned: newBanStatus,
              banned_reason: newBanStatus ? reason : null
            }
          });
      });

      return {
        success: true,
        message: newBanStatus ? "Utilisateur banni avec succès" : "Utilisateur débanni avec succès"
      };
    } catch (error: any) {
      console.error('Erreur lors du bannissement:', error);
      return {
        success: false,
        message: error.message || "Erreur lors de la modification du statut de bannissement"
      };
    }
  }

  // Dépôt automatique pour agents avec solde faible
  static async performAutoBatchDeposit(
    adminId: string,
    adminBalance: number,
    depositAmount: number = 50000,
    threshold: number = 50000
  ): Promise<UserOperationResult> {
    try {
      // Récupérer les agents avec un solde faible
      const { data: lowBalanceAgents, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'agent')
        .lt('balance', threshold);

      if (error) throw error;

      if (!lowBalanceAgents || lowBalanceAgents.length === 0) {
        return {
          success: false,
          message: `Aucun agent n'a un solde inférieur à ${threshold.toLocaleString()} FCFA`
        };
      }

      const totalAmount = depositAmount * lowBalanceAgents.length;

      // Vérifier le solde de l'admin
      if (adminBalance < totalAmount) {
        return {
          success: false,
          message: `Solde insuffisant. Total requis: ${totalAmount.toLocaleString()} FCFA`
        };
      }

      // Effectuer les dépôts avec gestion d'erreurs
      const results = [];
      let successCount = 0;
      let failedCount = 0;

      for (const agent of lowBalanceAgents) {
        try {
          // Créditer l'agent
          await secureCreditUserBalance(
            agent.id, 
            depositAmount, 
            'admin_agent_deposit',
            adminId
          );

          // Débiter l'admin
          await secureDebitUserBalance(
            adminId,
            depositAmount,
            'admin_batch_deposit',
            adminId
          );

          results.push({
            agentId: agent.id,
            agentName: agent.full_name,
            success: true
          });
          successCount++;

        } catch (error) {
          console.error(`Erreur pour l'agent ${agent.id}:`, error);
          results.push({
            agentId: agent.id,
            agentName: agent.full_name,
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue'
          });
          failedCount++;
        }
      }

      return {
        success: successCount > 0,
        message: `${successCount} agent(s) rechargé(s) avec succès${failedCount > 0 ? `. ${failedCount} échec(s).` : ''}`,
        data: { results, successCount, failedCount }
      };

    } catch (error: any) {
      console.error('Erreur lors du dépôt automatique:', error);
      return {
        success: false,
        message: error.message || "Erreur lors du dépôt automatique"
      };
    }
  }

  // Mettre à jour le solde d'un utilisateur de manière sécurisée
  static async updateUserBalance(
    userId: string,
    amount: number,
    operationType: string,
    performedBy: string
  ): Promise<UserOperationResult> {
    try {
      let newBalance: number;

      if (amount > 0) {
        newBalance = await secureCreditUserBalance(userId, amount, operationType, performedBy);
      } else {
        newBalance = await secureDebitUserBalance(userId, Math.abs(amount), operationType, performedBy);
      }

      return {
        success: true,
        message: `Solde mis à jour avec succès`,
        data: { newBalance }
      };

    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du solde:', error);
      return {
        success: false,
        message: error.message || "Erreur lors de la mise à jour du solde"
      };
    }
  }

  // Vérifier l'état d'un utilisateur
  static async checkUserStatus(userId: string): Promise<UserOperationResult> {
    try {
      const result = await this.withRetry(async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        return data;
      });

      return {
        success: true,
        message: "Statut utilisateur récupéré",
        data: result
      };

    } catch (error: any) {
      console.error('Erreur lors de la vérification du statut:', error);
      return {
        success: false,
        message: error.message || "Erreur lors de la vérification du statut"
      };
    }
  }

  // Rechercher un utilisateur
  static async searchUser(searchTerm: string): Promise<UserOperationResult> {
    try {
      const result = await this.withRetry(async () => {
        // Recherche par téléphone ou nom
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`phone.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
      });

      return {
        success: !!result,
        message: result ? "Utilisateur trouvé" : "Aucun utilisateur trouvé",
        data: result
      };

    } catch (error: any) {
      console.error('Erreur lors de la recherche d\'utilisateur:', error);
      return {
        success: false,
        message: error.message || "Erreur lors de la recherche d'utilisateur"
      };
    }
  }

  // Effectuer un dépôt personnalisé
  static async performCustomDeposit(
    targetUserId: string,
    amount: number,
    adminId: string,
    notes?: string
  ): Promise<UserOperationResult> {
    try {
      // Créditer l'utilisateur cible
      await secureCreditUserBalance(
        targetUserId,
        amount,
        'admin_custom_deposit',
        adminId
      );

      // Débiter l'admin
      await secureDebitUserBalance(
        adminId,
        amount,
        'admin_custom_deposit_debit',
        adminId
      );

      // Enregistrer la transaction
      const transactionReference = `CUSTOM-DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      await supabase
        .from('recharges')
        .insert({
          user_id: targetUserId,
          amount: amount,
          country: 'Congo Brazzaville',
          payment_method: 'admin_custom_deposit',
          payment_phone: '',
          payment_provider: 'admin',
          transaction_reference: transactionReference,
          status: 'completed',
          provider_transaction_id: adminId
        });

      return {
        success: true,
        message: `Dépôt de ${amount.toLocaleString()} FCFA effectué avec succès`
      };

    } catch (error: any) {
      console.error('Erreur lors du dépôt personnalisé:', error);
      return {
        success: false,
        message: error.message || "Erreur lors du dépôt personnalisé"
      };
    }
  }
}