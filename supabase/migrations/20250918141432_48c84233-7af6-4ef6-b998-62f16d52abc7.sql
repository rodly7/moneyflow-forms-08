-- Ajouter une colonne pour tracker si c'est la première recharge >= 1000 XAF
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS first_recharge_completed BOOLEAN DEFAULT FALSE;

-- Fonction pour activer automatiquement le parrainage après une recharge de 1000 XAF
CREATE OR REPLACE FUNCTION auto_activate_referral_on_recharge()
RETURNS TRIGGER AS $$
DECLARE
  referral_record RECORD;
  user_total_recharges NUMERIC;
BEGIN
  -- Vérifier si c'est une recharge complétée
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Calculer le total des recharges de l'utilisateur (y compris celle-ci)
    SELECT COALESCE(SUM(amount), 0) INTO user_total_recharges
    FROM recharges 
    WHERE user_id = NEW.user_id 
    AND status = 'completed';
    
    -- Vérifier s'il y a un parrainage en attente pour cet utilisateur
    SELECT * INTO referral_record
    FROM referrals 
    WHERE referred_user_id = NEW.user_id 
    AND status = 'en_attente'
    AND first_recharge_completed = FALSE
    LIMIT 1;
    
    -- Si un parrainage existe et que l'utilisateur a rechargé au moins 1000 XAF au total
    IF referral_record.id IS NOT NULL AND user_total_recharges >= 1000 THEN
      
      -- Marquer le parrainage comme ayant la première recharge complétée
      UPDATE referrals 
      SET first_recharge_completed = TRUE,
          status = 'credit_applique',
          credit_applique = TRUE,
          credited_at = NOW(),
          activated = TRUE,
          activated_at = NOW(),
          updated_at = NOW()
      WHERE id = referral_record.id;
      
      -- Créditer automatiquement le parrain
      UPDATE profiles 
      SET balance = balance + referral_record.amount_credited
      WHERE id = referral_record.referrer_id;
      
      -- Créer une notification pour le parrain
      INSERT INTO notifications (
        title,
        message,
        notification_type,
        priority,
        sent_by,
        target_users
      ) VALUES (
        '🎉 Parrainage validé !',
        'Votre filleul a rechargé 1000 XAF ! Vous avez reçu ' || referral_record.amount_credited || ' XAF de bonus.',
        'individual',
        'high',
        NEW.user_id,
        ARRAY[referral_record.referrer_id]
      );
      
      -- Créer l'enregistrement du destinataire de la notification
      INSERT INTO notification_recipients (
        notification_id,
        user_id,
        status
      ) SELECT 
        id,
        referral_record.referrer_id,
        'sent'
      FROM notifications 
      WHERE title = '🎉 Parrainage validé !' 
      ORDER BY created_at DESC 
      LIMIT 1;
      
      -- Log dans audit_logs
      INSERT INTO audit_logs (
        action,
        table_name,
        record_id,
        user_id,
        new_values
      ) VALUES (
        'auto_referral_activation',
        'referrals',
        referral_record.id,
        NEW.user_id,
        jsonb_build_object(
          'referrer_id', referral_record.referrer_id,
          'amount_credited', referral_record.amount_credited,
          'total_user_recharges', user_total_recharges,
          'trigger_recharge_amount', NEW.amount
        )
      );
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;