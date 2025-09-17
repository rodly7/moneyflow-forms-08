-- Modifier la fonction notify_money_received pour différencier les paiements de factures
CREATE OR REPLACE FUNCTION public.notify_money_received()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    notification_id UUID;
    recipient_name TEXT;
    sender_name TEXT;
    is_bill_payment BOOLEAN := FALSE;
    notification_title TEXT;
    notification_message TEXT;
BEGIN
    -- Obtenir les noms du destinataire et de l'expéditeur
    SELECT full_name INTO recipient_name FROM profiles WHERE id = NEW.recipient_id;
    SELECT full_name INTO sender_name FROM profiles WHERE id = NEW.sender_id;
    
    -- Vérifier si c'est un paiement de facture (chercher dans merchant_payments)
    SELECT EXISTS(
        SELECT 1 FROM merchant_payments 
        WHERE user_id = NEW.sender_id 
        AND merchant_id = NEW.recipient_id::text 
        AND amount = NEW.amount 
        AND created_at > NOW() - INTERVAL '2 minutes'
    ) INTO is_bill_payment;
    
    -- Créer une notification pour la réception d'argent (seulement si le transfert est complété)
    IF NEW.status = 'completed' AND NEW.recipient_id IS NOT NULL THEN
        -- Personnaliser le message selon le type de transaction
        IF is_bill_payment THEN
            notification_title := '💳 Paiement de facture reçu';
            notification_message := 'Vous avez reçu un paiement de facture de ' || NEW.amount || ' XAF de ' || COALESCE(sender_name, 'un client');
        ELSE
            notification_title := '💰 Argent reçu';
            notification_message := 'Vous avez reçu ' || NEW.amount || ' XAF de ' || COALESCE(sender_name, 'un expéditeur');
        END IF;
        
        -- Créer la notification
        INSERT INTO notifications (
            title,
            message,
            notification_type,
            priority,
            sent_by,
            target_users
        ) VALUES (
            notification_title,
            notification_message,
            'individual',
            'high',
            NEW.sender_id,
            ARRAY[NEW.recipient_id]
        ) RETURNING id INTO notification_id;
        
        -- Créer l'enregistrement du destinataire
        INSERT INTO notification_recipients (
            notification_id,
            user_id,
            status
        ) VALUES (
            notification_id,
            NEW.recipient_id,
            'sent'
        );
    END IF;
    
    RETURN NEW;
END;
$function$;