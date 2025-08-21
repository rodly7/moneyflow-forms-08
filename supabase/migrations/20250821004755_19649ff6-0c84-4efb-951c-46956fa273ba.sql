
-- Ajouter la colonne recipient_email à la table pending_transfers si elle n'existe pas déjà
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pending_transfers' 
    AND column_name = 'recipient_email'
  ) THEN
    ALTER TABLE pending_transfers 
    ADD COLUMN recipient_email TEXT DEFAULT '';
  END IF;
END $$;

-- S'assurer que nous avons un trigger pour les notifications de pending_transfers
CREATE OR REPLACE FUNCTION notify_pending_transfer_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id UUID;
BEGIN
    -- Créer une notification pour l'expéditeur
    INSERT INTO notifications (
        title,
        message,
        notification_type,
        priority,
        sent_by,
        target_users,
        total_recipients
    ) VALUES (
        '⏳ Transfert en attente créé',
        'Votre transfert de ' || NEW.amount || ' XAF vers ' || NEW.recipient_phone || ' est en attente avec le code: ' || NEW.claim_code,
        'transfer_pending',
        'normal',
        NEW.sender_id,
        ARRAY[NEW.sender_id],
        1
    ) RETURNING id INTO notification_id;
    
    -- Créer l'enregistrement du destinataire
    INSERT INTO notification_recipients (
        notification_id,
        user_id,
        status
    ) VALUES (
        notification_id,
        NEW.sender_id,
        'sent'
    );
    
    RETURN NEW;
END;
$$;

-- Créer le trigger pour les pending_transfers
DROP TRIGGER IF EXISTS trigger_notify_pending_transfer_created ON pending_transfers;
CREATE TRIGGER trigger_notify_pending_transfer_created
    AFTER INSERT ON pending_transfers
    FOR EACH ROW
    EXECUTE FUNCTION notify_pending_transfer_created();
