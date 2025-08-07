-- Amélioration du système d'épargne et de notifications

-- 1. Modifier la fonction check_savings_target_and_transfer pour ajouter une notification
CREATE OR REPLACE FUNCTION public.check_savings_target_and_transfer()
RETURNS TRIGGER AS $$
DECLARE
    v_target_reached BOOLEAN := false;
    notification_id UUID;
BEGIN
    -- Check if target amount is set and reached
    IF NEW.target_amount IS NOT NULL AND NEW.balance >= NEW.target_amount THEN
        v_target_reached := true;
        
        -- Transfer savings balance to main balance
        UPDATE profiles 
        SET balance = balance + NEW.balance
        WHERE id = NEW.user_id;
        
        -- Créer une notification pour informer l'utilisateur
        INSERT INTO notifications (
            title,
            message,
            notification_type,
            priority,
            sent_by,
            target_users
        ) VALUES (
            'Objectif d''épargne atteint !',
            'Félicitations ! Votre objectif d''épargne de ' || NEW.target_amount || ' XAF a été atteint. Le montant de ' || NEW.balance || ' XAF a été automatiquement transféré vers votre compte principal.',
            'success',
            'high',
            NEW.user_id,
            ARRAY[NEW.user_id]
        ) RETURNING id INTO notification_id;
        
        -- Créer l'enregistrement du destinataire de la notification
        INSERT INTO notification_recipients (
            notification_id,
            user_id,
            status
        ) VALUES (
            notification_id,
            NEW.user_id,
            'sent'
        );
        
        -- Reset savings account balance
        NEW.balance := 0;
        
        -- Marquer l'objectif comme atteint pour permettre la suppression
        NEW.target_amount := NULL;
        
        -- Log the automatic transfer
        INSERT INTO audit_logs (
            action,
            table_name,
            record_id,
            user_id,
            new_values
        ) VALUES (
            'savings_target_reached_auto_transfer',
            'savings_accounts',
            NEW.id,
            NEW.user_id,
            jsonb_build_object('transferred_amount', OLD.balance, 'target_reached', true)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Modifier la fonction prevent_savings_deletion_before_target pour permettre la suppression après l'objectif atteint
CREATE OR REPLACE FUNCTION public.prevent_savings_deletion_before_target()
RETURNS TRIGGER AS $$
BEGIN
    -- Permettre la suppression si l'objectif a été atteint (target_amount est NULL)
    -- ou si le solde est 0 (compte vide)
    IF OLD.target_amount IS NOT NULL 
       AND OLD.balance > 0 THEN
        RAISE EXCEPTION 'Cannot delete savings account before reaching target amount. Current: %, Target: %', 
                       OLD.balance, OLD.target_amount;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Améliorer le trigger notify_money_received pour tous les transferts
CREATE OR REPLACE FUNCTION public.notify_money_received()
RETURNS TRIGGER AS $$
DECLARE
    notification_id UUID;
    recipient_name TEXT;
    sender_name TEXT;
BEGIN
    -- Obtenir les noms du destinataire et de l'expéditeur
    SELECT full_name INTO recipient_name FROM profiles WHERE id = NEW.recipient_id;
    SELECT full_name INTO sender_name FROM profiles WHERE id = NEW.sender_id;
    
    -- Créer une notification pour la réception d'argent (seulement si le transfert est complété)
    IF NEW.status = 'completed' AND NEW.recipient_id IS NOT NULL THEN
        -- Créer la notification
        INSERT INTO notifications (
            title,
            message,
            notification_type,
            priority,
            sent_by,
            target_users
        ) VALUES (
            'Argent reçu',
            'Vous avez reçu ' || NEW.amount || ' XAF de ' || COALESCE(sender_name, 'un expéditeur'),
            'success',
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Créer un trigger pour les notifications de transfert (si pas déjà existant)
DROP TRIGGER IF EXISTS notify_money_received_trigger ON transfers;
CREATE TRIGGER notify_money_received_trigger
    AFTER UPDATE OF status ON transfers
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
    EXECUTE FUNCTION notify_money_received();

-- 5. Trigger pour les nouveaux transferts complétés directement
DROP TRIGGER IF EXISTS notify_money_received_insert_trigger ON transfers;
CREATE TRIGGER notify_money_received_insert_trigger
    AFTER INSERT ON transfers
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND NEW.recipient_id IS NOT NULL)
    EXECUTE FUNCTION notify_money_received();