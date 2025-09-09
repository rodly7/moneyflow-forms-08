-- Créer la fonction pour traiter le crédit de parrainage
CREATE OR REPLACE FUNCTION process_referral_credit(referred_user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  referral_record RECORD;
  referrer_profile RECORD;
  referred_profile RECORD;
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
  
  -- Récupérer les profils du parrain et du référé
  SELECT * INTO referrer_profile FROM profiles WHERE id = referral_record.referrer_id;
  SELECT * INTO referred_profile FROM profiles WHERE id = referred_user_id_param;
  
  -- Vérifier que les profils existent
  IF referrer_profile IS NULL OR referred_profile IS NULL THEN
    RAISE LOG 'Profils non trouvés pour le parrainage %', referral_record.id;
    RETURN FALSE;
  END IF;
  
  -- Créditer les comptes (200 F chacun)
  -- Créditer le parrain
  UPDATE profiles 
  SET balance = balance + 200
  WHERE id = referral_record.referrer_id;
  
  -- Créditer le référé
  UPDATE profiles 
  SET balance = balance + 200
  WHERE id = referred_user_id_param;
  
  -- Mettre à jour le statut du parrainage
  UPDATE referrals 
  SET 
    status = 'complete',
    credited_at = NOW()
  WHERE id = referral_record.id;
  
  RAISE LOG 'Crédit de parrainage appliqué: % F pour le parrain (%) et % F pour le référé (%)', 
    200, referral_record.referrer_id, 200, referred_user_id_param;
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Erreur lors du traitement du crédit de parrainage: %', SQLERRM;
    RETURN FALSE;
END;
$$;