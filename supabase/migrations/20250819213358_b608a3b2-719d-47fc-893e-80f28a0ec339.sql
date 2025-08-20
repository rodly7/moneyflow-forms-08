
-- Créer un trigger pour les transferts reçus
CREATE OR REPLACE FUNCTION notify_transfer_received()
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
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Obtenir le nom de l'expéditeur
        SELECT full_name INTO sender_name FROM profiles WHERE id = NEW.sender_id;
        
        -- Obtenir l'ID du destinataire à partir du téléphone ou email
        SELECT id INTO recipient_user_id 
        FROM profiles 
        WHERE phone = NEW.recipient_phone OR phone = NEW.recipient_email
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
                '💰 Argent reçu',
                'Vous avez reçu ' || NEW.amount || ' XAF de ' || COALESCE(sender_name, 'un expéditeur'),
                'transfer_received',
                'high',
                NEW.sender_id,
                ARRAY[recipient_user_id],
                1
            ) RETURNING id INTO notification_id;
            
            -- Créer l'enregistrement du destinataire
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

-- Créer un trigger pour les retraits
CREATE OR REPLACE FUNCTION notify_withdrawal_completed()
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
            'Votre demande de retrait de ' || NEW.amount || ' XAF a été créée',
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

-- Attacher les triggers aux tables
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

-- Activer la réplication temps réel pour les tables nécessaires
ALTER TABLE transfers REPLICA IDENTITY FULL;
ALTER TABLE withdrawals REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE notification_recipients REPLICA IDENTITY FULL;

-- Ajouter les tables à la publication temps réel
ALTER PUBLICATION supabase_realtime ADD TABLE transfers;
ALTER PUBLICATION supabase_realtime ADD TABLE withdrawals;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE notification_recipients;
