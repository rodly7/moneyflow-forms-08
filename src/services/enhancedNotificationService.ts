

import { supabase } from "@/integrations/supabase/client";
import { NotificationService } from "./notificationService";

export interface EnhancedNotificationData {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high';
  notification_type: string;
  amount?: number;
  currency?: string;
  sender_name?: string;
  sender_phone?: string;
  recipient_phone?: string;
  transaction_id?: string;
  created_at: string;
}

export class EnhancedNotificationService extends NotificationService {
  
  // Créer une notification de réception d'argent avec priorité élevée
  static async createMoneyReceivedNotification(
    recipientUserId: string,
    amount: number,
    currency: string = 'XAF',
    senderName?: string,
    senderPhone?: string,
    recipientPhone?: string,
    transactionId?: string
  ) {
    console.log(`💰 Création notification réception argent: ${amount} ${currency} pour ${recipientUserId}`);
    
    const title = `💰 Argent reçu: ${amount.toLocaleString()} ${currency}`;
    const message = senderName 
      ? `Vous avez reçu ${amount.toLocaleString()} ${currency} de ${senderName}${senderPhone ? ` (${senderPhone})` : ''}`
      : `Vous avez reçu ${amount.toLocaleString()} ${currency}`;

    try {
      // Créer la notification avec des métadonnées étendues
      const { data: notification, error: notificationError } = await supabase
        .from('notifications')
        .insert({
          title,
          message,
          priority: 'high',
          notification_type: 'money_received',
          target_users: [recipientUserId],
          sent_by: 'system',
          total_recipients: 1,
          metadata: {
            amount,
            currency,
            sender_name: senderName,
            sender_phone: senderPhone,
            recipient_phone: recipientPhone,
            transaction_id: transactionId,
            notification_category: 'financial',
            requires_action: false,
            auto_dismiss: false
          }
        })
        .select()
        .single();

      if (notificationError) {
        throw new Error(`Erreur notification: ${notificationError.message}`);
      }

      // Créer l'entrée destinataire
      const { error: recipientError } = await supabase
        .from('notification_recipients')
        .insert({
          notification_id: notification.id,
          user_id: recipientUserId,
          status: 'sent'
        });

      if (recipientError) {
        // Nettoyer si échec
        await supabase.from('notifications').delete().eq('id', notification.id);
        throw new Error(`Erreur destinataire: ${recipientError.message}`);
      }

      // Tenter d'envoyer une notification push si le service est disponible
      await this.sendPushNotification(recipientUserId, {
        title: title,
        body: message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: `money_received_${transactionId || Date.now()}`,
        requireInteraction: true,
        data: {
          type: 'money_received',
          amount,
          currency,
          transaction_id: transactionId,
          url: '/transactions'
        }
      });

      console.log(`✅ Notification argent reçu créée: ${notification.id}`);
      
      return {
        success: true,
        message: "Notification de réception d'argent envoyée",
        data: notification
      };

    } catch (error: any) {
      console.error('❌ Erreur notification argent reçu:', error);
      
      // Tentative de notification simplifiée en cas d'échec
      return await this.createAutoNotification(
        `💰 ${amount} ${currency} reçu`,
        `Votre compte a été crédité`,
        'high',
        [recipientUserId],
        'system',
        true
      );
    }
  }

  // Envoyer une notification push native (si supporté)
  static async sendPushNotification(userId: string, notificationOptions: any) {
    try {
      // Vérifier si les notifications push sont supportées
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        console.log('🔕 Notifications push non supportées');
        return;
      }

      // Demander la permission si nécessaire
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission !== 'granted') {
        console.log('🔕 Permission notifications refusée');
        return;
      }

      // Vérifier si un service worker est enregistré
      const registration = await navigator.serviceWorker.ready;
      if (!registration) {
        console.log('🔕 Service worker non disponible');
        return;
      }

      // Faire vibrer l'appareil si supporté (avant d'afficher la notification)
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 400]);
      }

      // Envoyer la notification push
      await registration.showNotification(notificationOptions.title, {
        body: notificationOptions.body,
        icon: notificationOptions.icon,
        badge: notificationOptions.badge,
        tag: notificationOptions.tag,
        requireInteraction: notificationOptions.requireInteraction,
        data: notificationOptions.data
      });

      console.log('📱 Notification push envoyée');

    } catch (error) {
      console.error('❌ Erreur notification push:', error);
    }
  }

  // Récupérer les notifications avec métadonnées étendues
  static async getEnhancedNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ) {
    try {
      const { data, error } = await supabase
        .from('notification_recipients')
        .select(`
          *,
          notifications (
            *,
            metadata
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Erreur récupération notifications: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
        message: "Notifications récupérées avec succès"
      };

    } catch (error: any) {
      console.error('❌ Erreur récupération notifications:', error);
      return {
        success: false,
        message: error.message || "Erreur lors de la récupération des notifications"
      };
    }
  }

  // Marquer une notification comme lue
  static async markAsRead(notificationId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('notification_recipients')
        .update({ 
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('notification_id', notificationId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Erreur marquage lu: ${error.message}`);
      }

      return {
        success: true,
        message: "Notification marquée comme lue"
      };

    } catch (error: any) {
      console.error('❌ Erreur marquage lu:', error);
      return {
        success: false,
        message: error.message || "Erreur lors du marquage"
      };
    }
  }
}
