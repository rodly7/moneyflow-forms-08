-- Créer une fonction pour envoyer des notifications automatiques lors de la réception d'argent
CREATE OR REPLACE FUNCTION notify_money_received()
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

-- Ajouter une colonne recipient_id à la table transfers si elle n'existe pas déjà
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transfers' AND column_name = 'recipient_id') THEN
        ALTER TABLE transfers ADD COLUMN recipient_id UUID;
    END IF;
END $$;

-- Créer le trigger pour notifier automatiquement lors de la réception d'argent
DROP TRIGGER IF EXISTS trigger_notify_money_received ON transfers;
CREATE TRIGGER trigger_notify_money_received
    AFTER INSERT OR UPDATE ON transfers
    FOR EACH ROW
    EXECUTE FUNCTION notify_money_received();

-- Fonction pour créer une notification lorsqu'un retrait est créé
CREATE OR REPLACE FUNCTION notify_withdrawal_created()
RETURNS TRIGGER AS $$
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
        'medium',
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger pour notifier lors de la création d'un retrait
DROP TRIGGER IF EXISTS trigger_notify_withdrawal_created ON withdrawals;
CREATE TRIGGER trigger_notify_withdrawal_created
    AFTER INSERT ON withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION notify_withdrawal_created();

-- Fonction pour créer une notification lorsqu'un dépôt est crédité
CREATE OR REPLACE FUNCTION notify_deposit_completed()
RETURNS TRIGGER AS $$
DECLARE
    notification_id UUID;
    user_name TEXT;
BEGIN
    -- Vérifier si c'est une mise à jour du statut vers 'completed'
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
        -- Obtenir le nom de l'utilisateur
        SELECT full_name INTO user_name FROM profiles WHERE id = NEW.user_id;
        
        -- Créer une notification pour le dépôt complété
        INSERT INTO notifications (
            title,
            message,
            notification_type,
            priority,
            sent_by,
            target_users
        ) VALUES (
            'Dépôt effectué',
            'Votre compte a été crédité de ' || NEW.amount || ' XAF.',
            'success',
            'high',
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
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger pour notifier lors de la completion d'une recharge
DROP TRIGGER IF EXISTS trigger_notify_deposit_completed ON recharges;
CREATE TRIGGER trigger_notify_deposit_completed
    AFTER UPDATE ON recharges
    FOR EACH ROW
    EXECUTE FUNCTION notify_deposit_completed();