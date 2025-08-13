
-- Supprimer le trigger existant
DROP TRIGGER IF EXISTS trigger_notify_withdrawal_created ON withdrawal_requests;

-- Supprimer la fonction existante
DROP FUNCTION IF EXISTS notify_withdrawal_created();

-- Recréer la fonction avec le bon type de notification
CREATE OR REPLACE FUNCTION notify_withdrawal_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    user_id,
    title,
    message,
    notification_type,
    related_table,
    related_id,
    created_at
  ) VALUES (
    NEW.user_id,
    'Demande de retrait reçue',
    'Un agent souhaite effectuer un retrait de ' || NEW.amount || ' FCFA depuis votre compte. Approuvez ou refusez cette demande.',
    'individual',  -- Changé de 'info' à 'individual'
    'withdrawal_requests',
    NEW.id,
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recréer le trigger
CREATE TRIGGER trigger_notify_withdrawal_created
  AFTER INSERT ON withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_withdrawal_created();
