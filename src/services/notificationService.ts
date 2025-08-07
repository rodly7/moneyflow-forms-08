import { supabase } from "@/integrations/supabase/client";

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high';
  notification_type: string;
  target_role?: string | null;
  target_country?: string | null;
  target_users?: string[] | null;
  total_recipients: number;
  created_at: string;
  sent_by?: string | null;
}

export interface NotificationResult {
  success: boolean;
  message: string;
  data?: any;
}

export class NotificationService {
  
  // Créer une notification avec gestion d'erreurs robuste et retry
  static async createNotification(
    title: string,
    message: string,
    priority: 'low' | 'normal' | 'high',
    notificationType: 'all' | 'role' | 'country' | 'individual',
    targetUsers: Array<{id: string}>,
    selectedRole?: string,
    selectedCountry?: string,
    selectedUserIds?: string[],
    sentBy?: string,
    maxRetries: number = 3
  ): Promise<NotificationResult> {
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📢 Tentative ${attempt}/${maxRetries} de création de notification: ${title}`);
        
        // Créer la notification principale avec retry
        const { data: notification, error: notificationError } = await supabase
          .from('notifications')
          .insert({
            title,
            message,
            priority,
            notification_type: notificationType,
            target_role: selectedRole || null,
            target_country: selectedCountry || null,
            target_users: notificationType === 'individual' ? selectedUserIds : null,
            sent_by: sentBy,
            total_recipients: targetUsers.length
          })
          .select()
          .single();

        if (notificationError) {
          throw new Error(`Erreur lors de la création de la notification: ${notificationError.message}`);
        }

        // Créer les entrées pour chaque destinataire avec retry
        const recipients = targetUsers.map(user => ({
          notification_id: notification.id,
          user_id: user.id,
          status: 'sent'
        }));

        const { error: recipientError } = await supabase
          .from('notification_recipients')
          .insert(recipients);

        if (recipientError) {
          // Nettoyer la notification créée si l'ajout des destinataires échoue
          await supabase.from('notifications').delete().eq('id', notification.id);
          throw new Error(`Erreur lors de l'ajout des destinataires: ${recipientError.message}`);
        }

        console.log(`✅ Notification créée avec succès pour ${targetUsers.length} utilisateur(s)`);
        
        return {
          success: true,
          message: `Notification envoyée à ${targetUsers.length} utilisateur(s)`,
          data: notification
        };

      } catch (error: any) {
        lastError = error;
        console.error(`❌ Tentative ${attempt}/${maxRetries} échouée:`, error.message);
        
        // Attendre avant le prochain essai (sauf pour le dernier)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    // Toutes les tentatives ont échoué
    console.error(`❌ Échec définitif de création de notification après ${maxRetries} tentatives`);
    return {
      success: false,
      message: lastError?.message || "Erreur lors de l'envoi de la notification"
    };
  }

  // Récupérer toutes les notifications avec pagination
  static async getNotifications(
    limit: number = 50,
    offset: number = 0
  ): Promise<NotificationResult> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Erreur lors de la récupération des notifications: ${error.message}`);
      }

      return {
        success: true,
        message: "Notifications récupérées avec succès",
        data: data || []
      };

    } catch (error: any) {
      console.error('Erreur dans getNotifications:', error);
      return {
        success: false,
        message: error.message || "Erreur lors de la récupération des notifications"
      };
    }
  }

  // Récupérer les notifications récentes (pour le tableau de bord)
  static async getRecentNotifications(limit: number = 10): Promise<NotificationResult> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Erreur lors de la récupération des notifications récentes: ${error.message}`);
      }

      return {
        success: true,
        message: "Notifications récentes récupérées avec succès",
        data: data || []
      };

    } catch (error: any) {
      console.error('Erreur dans getRecentNotifications:', error);
      return {
        success: false,
        message: error.message || "Erreur lors de la récupération des notifications récentes"
      };
    }
  }

  // Récupérer tous les utilisateurs pour les notifications
  static async getUsersForNotifications(): Promise<NotificationResult> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, role, country')
        .order('full_name');

      if (error) {
        throw new Error(`Erreur lors de la récupération des utilisateurs: ${error.message}`);
      }

      return {
        success: true,
        message: "Utilisateurs récupérés avec succès",
        data: data || []
      };

    } catch (error: any) {
      console.error('Erreur dans getUsersForNotifications:', error);
      return {
        success: false,
        message: error.message || "Erreur lors de la récupération des utilisateurs"
      };
    }
  }

  // Récupérer la liste des pays uniques
  static async getCountriesList(): Promise<NotificationResult> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('country')
        .not('country', 'is', null);

      if (error) {
        throw new Error(`Erreur lors de la récupération des pays: ${error.message}`);
      }

      const uniqueCountries = [...new Set(data?.map(item => item.country))].filter(Boolean);

      return {
        success: true,
        message: "Pays récupérés avec succès",
        data: uniqueCountries
      };

    } catch (error: any) {
      console.error('Erreur dans getCountriesList:', error);
      return {
        success: false,
        message: error.message || "Erreur lors de la récupération des pays"
      };
    }
  }

  // Créer une notification automatique avec garantie de livraison
  static async createAutoNotification(
    title: string,
    message: string,
    priority: 'low' | 'normal' | 'high' = 'normal',
    targetUserIds: string[],
    sentBy?: string,
    forceDelivery: boolean = true
  ): Promise<NotificationResult> {
    console.log(`🚀 Création notification automatique: ${title} pour ${targetUserIds.length} utilisateur(s)`);
    
    try {
      const result = await this.createNotification(
        title,
        message,
        priority,
        'individual',
        targetUserIds.map(id => ({ id })),
        undefined,
        undefined,
        targetUserIds,
        sentBy,
        forceDelivery ? 5 : 3 // Plus de retries pour les notifications critiques
      );

      // Pour les notifications d'argent reçu, tenter une notification de secours si nécessaire
      if (!result.success && title.includes('Argent reçu') && forceDelivery) {
        console.log(`🔄 Tentative de notification de secours pour: ${title}`);
        
        // Essayer avec un titre et message simplifiés
        const fallbackResult = await this.createNotification(
          "💰 Crédit reçu",
          "Votre compte a été crédité avec succès",
          'high',
          'individual',
          targetUserIds.map(id => ({ id })),
          undefined,
          undefined,
          targetUserIds,
          sentBy,
          3
        );
        
        if (fallbackResult.success) {
          console.log(`✅ Notification de secours envoyée avec succès`);
          return fallbackResult;
        }
      }

      return result;

    } catch (error: any) {
      console.error('❌ Erreur dans createAutoNotification:', error);
      return {
        success: false,
        message: error.message || "Erreur lors de la création de la notification automatique"
      };
    }
  }

  // Nouvelle méthode pour vérifier et renvoyer les notifications non livrées
  static async retryFailedNotifications(): Promise<void> {
    try {
      console.log('🔍 Vérification des notifications non livrées...');
      
      // Récupérer les notifications créées dans les 5 dernières minutes qui n'ont pas de destinataires
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: orphanedNotifications, error } = await supabase
        .from('notifications')
        .select(`
          *,
          notification_recipients!left (
            id
          )
        `)
        .gte('created_at', fiveMinutesAgo)
        .is('notification_recipients.id', null);

      if (error) {
        console.error('Erreur lors de la vérification des notifications orphelines:', error);
        return;
      }

      if (orphanedNotifications && orphanedNotifications.length > 0) {
        console.log(`🔄 ${orphanedNotifications.length} notification(s) orpheline(s) trouvée(s)`);
        
        for (const notification of orphanedNotifications) {
          if (notification.target_users) {
            // Recréer les entrées de destinataires manquantes
            const recipients = notification.target_users.map((userId: string) => ({
              notification_id: notification.id,
              user_id: userId,
              status: 'sent'
            }));

            await supabase
              .from('notification_recipients')
              .insert(recipients);
              
            console.log(`✅ Destinataires restaurés pour la notification: ${notification.title}`);
          }
        }
      }
      
    } catch (error) {
      console.error('Erreur lors du retry des notifications:', error);
    }
  }
}
