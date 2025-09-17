-- Fix notification error by correcting notify_withdrawal_completed function
-- Remove reference to non-existent verification_code column
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
            'Votre demande de retrait de ' || NEW.amount || ' XAF a été créée et est en cours de traitement',
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