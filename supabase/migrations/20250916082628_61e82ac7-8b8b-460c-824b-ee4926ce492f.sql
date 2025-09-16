-- Créer des triggers pour notifications des transactions en temps réel (version corrigée)

-- 1. Notifications pour paiements de factures
CREATE OR REPLACE FUNCTION public.notify_bill_payment_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id UUID;
BEGIN
    -- Notification pour paiement de facture réussi
    IF NEW.status = 'success' OR NEW.status = 'completed' THEN
        INSERT INTO notifications (
            title,
            message,
            notification_type,
            priority,
            sent_by,
            target_users,
            total_recipients
        ) VALUES (
            '📄 Facture payée',
            'Votre facture de ' || NEW.amount || ' XAF a été payée avec succès',
            'bill_payment',
            'normal',
            NEW.user_id,
            ARRAY[NEW.user_id],
            1
        ) RETURNING id INTO notification_id;
        
        INSERT INTO notification_recipients (
            notification_id,
            user_id,
            status
        ) VALUES (
            notification_id,
            NEW.user_id,
            'sent'
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- 2. Améliorer les notifications pour transferts reçus
CREATE OR REPLACE FUNCTION public.notify_transfer_received()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id UUID;
    sender_name TEXT;
    recipient_user_id UUID;
BEGIN
    -- Vérifier si c'est un nouveau transfert complété
    IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
        -- Obtenir le nom de l'expéditeur
        SELECT full_name INTO sender_name FROM profiles WHERE id = NEW.sender_id;
        
        -- Obtenir l'ID du destinataire à partir du téléphone
        SELECT id INTO recipient_user_id 
        FROM profiles 
        WHERE phone = NEW.recipient_phone
        LIMIT 1;
        
        -- Si on trouve un destinataire, créer la notification
        IF recipient_user_id IS NOT NULL THEN
            INSERT INTO notifications (
                title,
                message,
                notification_type,
                priority,
                sent_by,
                target_users,
                total_recipients
            ) VALUES (
                '💰 Transfert reçu',
                'Vous avez reçu ' || NEW.amount || ' XAF de ' || COALESCE(sender_name, 'un expéditeur'),
                'transfer_received',
                'high',
                NEW.sender_id,
                ARRAY[recipient_user_id],
                1
            ) RETURNING id INTO notification_id;
            
            INSERT INTO notification_recipients (
                notification_id,
                user_id,
                status
            ) VALUES (
                notification_id,
                recipient_user_id,
                'sent'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 3. Améliorer les notifications pour retraits
CREATE OR REPLACE FUNCTION public.notify_withdrawal_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id UUID;
BEGIN
    -- Notification pour création de retrait
    IF TG_OP = 'INSERT' THEN
        INSERT INTO notifications (
            title,
            message,
            notification_type,
            priority,
            sent_by,
            target_users,
            total_recipients
        ) VALUES (
            '⏳ Retrait initié',
            'Votre demande de retrait de ' || NEW.amount || ' XAF a été créée avec le code: ' || NEW.verification_code,
            'withdrawal_created',
            'normal',
            NEW.user_id,
            ARRAY[NEW.user_id],
            1
        ) RETURNING id INTO notification_id;
        
        INSERT INTO notification_recipients (
            notification_id,
            user_id,
            status
        ) VALUES (
            notification_id,
            NEW.user_id,
            'sent'
        );
    END IF;
    
    -- Notification pour retrait complété
    IF TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' THEN
        INSERT INTO notifications (
            title,
            message,
            notification_type,
            priority,
            sent_by,
            target_users,
            total_recipients
        ) VALUES (
            '✅ Retrait confirmé',
            'Votre retrait de ' || NEW.amount || ' XAF a été traité avec succès',
            'withdrawal_completed',
            'high',
            NEW.user_id,
            ARRAY[NEW.user_id],
            1
        ) RETURNING id INTO notification_id;
        
        INSERT INTO notification_recipients (
            notification_id,
            user_id,
            status
        ) VALUES (
            notification_id,
            NEW.user_id,
            'sent'
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- 4. Créer les triggers sur les tables
DROP TRIGGER IF EXISTS trigger_notify_bill_payment ON bill_payment_history;
CREATE TRIGGER trigger_notify_bill_payment
    AFTER INSERT OR UPDATE ON bill_payment_history
    FOR EACH ROW
    EXECUTE FUNCTION notify_bill_payment_completed();

DROP TRIGGER IF EXISTS trigger_notify_transfer_received ON transfers;
CREATE TRIGGER trigger_notify_transfer_received
    AFTER INSERT OR UPDATE ON transfers
    FOR EACH ROW
    EXECUTE FUNCTION notify_transfer_received();

DROP TRIGGER IF EXISTS trigger_notify_withdrawal ON withdrawals;
CREATE TRIGGER trigger_notify_withdrawal
    AFTER INSERT OR UPDATE ON withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION notify_withdrawal_completed();

-- 5. Tenter d'ajouter les tables au realtime (ignorer les erreurs pour les tables déjà ajoutées)
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE bill_payment_history;
    EXCEPTION WHEN duplicate_object THEN
        NULL; -- Ignorer si déjà ajoutée
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE recharges;
    EXCEPTION WHEN duplicate_object THEN
        NULL; -- Ignorer si déjà ajoutée
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE merchant_payments;
    EXCEPTION WHEN duplicate_object THEN
        NULL; -- Ignorer si déjà ajoutée
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE pending_transfers;
    EXCEPTION WHEN duplicate_object THEN
        NULL; -- Ignorer si déjà ajoutée
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    EXCEPTION WHEN duplicate_object THEN
        NULL; -- Ignorer si déjà ajoutée
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE notification_recipients;
    EXCEPTION WHEN duplicate_object THEN
        NULL; -- Ignorer si déjà ajoutée
    END;
END $$;