
-- Corriger le trigger notify_transfer_received pour supprimer la référence au champ recipient_email qui n'existe pas
CREATE OR REPLACE FUNCTION public.notify_transfer_received()
RETURNS TRIGGER
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
        
        -- Obtenir l'ID du destinataire à partir du téléphone seulement
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
