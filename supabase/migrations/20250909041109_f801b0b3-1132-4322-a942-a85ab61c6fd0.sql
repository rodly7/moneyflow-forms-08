-- Corriger la fonction process_referral_credit avec le bon statut
CREATE OR REPLACE FUNCTION process_referral_credit(referred_user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  referral_record RECORD;
BEGIN
  -- Récupérer l'enregistrement de parrainage
  SELECT * INTO referral_record
  FROM referrals
  WHERE referred_user_id = referred_user_id_param
    AND status = 'en_attente'
  LIMIT 1;
  
  -- Vérifier que le parrainage existe
  IF referral_record IS NULL THEN
    RAISE LOG 'Aucun parrainage en attente trouvé pour l''utilisateur %', referred_user_id_param;
    RETURN FALSE;
  END IF;
  
  -- Créditer les comptes (200 F chacun)
  UPDATE profiles 
  SET balance = balance + 200
  WHERE id = referral_record.referrer_id;
  
  UPDATE profiles 
  SET balance = balance + 200
  WHERE id = referred_user_id_param;
  
  -- Mettre à jour seulement le flag de crédit sans changer le statut
  UPDATE referrals 
  SET 
    credit_applique = true,
    credited_at = NOW()
  WHERE id = referral_record.id;
  
  RAISE LOG 'Crédit de parrainage appliqué: 200 F pour le parrain (%) et 200 F pour le référé (%)', 
    referral_record.referrer_id, referred_user_id_param;
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Erreur lors du traitement du crédit de parrainage: %', SQLERRM;
    RETURN FALSE;
END;
$$;