BEGIN;

-- Fix function: use valid priority 'normal' instead of invalid 'medium'
CREATE OR REPLACE FUNCTION public.notify_withdrawal_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    notification_id UUID;
    user_name TEXT;
BEGIN
    -- Obtenir le nom de l'utilisateur
    SELECT full_name INTO user_name FROM profiles WHERE id = NEW.user_id;
    
    -- Créer une notification pour la création du retrait
    INSERT INTO notifications (
        title,
        message,
        notification_type,
        priority,
        sent_by,
        target_users
    ) VALUES (
        'Demande de retrait créée',
        'Votre demande de retrait de ' || NEW.amount || ' XAF vers ' || NEW.withdrawal_phone || ' a été créée.',
        'info',
        'normal', -- fixed from 'medium'
        NEW.user_id,
        ARRAY[NEW.user_id]
    ) RETURNING id INTO notification_id;
    
    -- Créer l'enregistrement du destinataire
    INSERT INTO notification_recipients (
        notification_id,
        user_id,
        status
    ) VALUES (
        notification_id,
        NEW.user_id,
        'sent'
    );
    
    RETURN NEW;
END;
$function$;

COMMIT;