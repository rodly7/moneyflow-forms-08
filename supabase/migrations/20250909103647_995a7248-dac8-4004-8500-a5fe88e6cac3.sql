-- Ajouter une colonne pour tracker si le parrainage a été activé (première transaction effectuée)
ALTER TABLE referrals ADD COLUMN activated BOOLEAN DEFAULT FALSE;
ALTER TABLE referrals ADD COLUMN activated_at TIMESTAMP WITH TIME ZONE;

-- Créer une fonction pour activer le parrainage lors de la première transaction
CREATE OR REPLACE FUNCTION activate_referral_bonus(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  referral_record RECORD;
  referrer_credited BOOLEAN := FALSE;
BEGIN
  -- Chercher si l'utilisateur a été parrainé et si ce n'est pas encore activé
  SELECT * INTO referral_record
  FROM referrals 
  WHERE referred_user_id = user_id_param 
    AND activated = FALSE
    AND status = 'completed';
  
  -- Si un parrainage non activé existe
  IF referral_record IS NOT NULL THEN
    -- Marquer le parrainage comme activé
    UPDATE referrals 
    SET activated = TRUE, activated_at = NOW()
    WHERE id = referral_record.id;
    
    -- Créditer le parrain de 200F
    UPDATE profiles 
    SET balance = balance + 200
    WHERE id = referral_record.referrer_id;
    
    -- Créer une notification pour le parrain
    INSERT INTO notifications (
      title,
      message,
      notification_type,
      priority,
      sent_by,
      target_users,
      total_recipients
    ) VALUES (
      '🎉 Bonus de parrainage activé !',
      'Votre filleul a effectué sa première transaction. Vous recevez 200 XAF de bonus !',
      'referral_bonus',
      'high',
      user_id_param,
      ARRAY[referral_record.referrer_id],
      1
    );
    
    -- Créer l'enregistrement du destinataire
    INSERT INTO notification_recipients (
      notification_id,
      user_id,
      status
    ) VALUES (
      (SELECT id FROM notifications ORDER BY created_at DESC LIMIT 1),
      referral_record.referrer_id,
      'sent'
    );
    
    referrer_credited := TRUE;
  END IF;
  
  RETURN referrer_credited;
END;
$$;

-- Supprimer l'ancienne fonction qui créditait immédiatement
DROP FUNCTION IF EXISTS process_referral_credit(UUID);