-- Appliquer manuellement le crédit pour le parrainage existant avec le bon statut
UPDATE profiles 
SET balance = balance + 200
WHERE id = '1d92a1e7-9528-4cef-b6be-910b63eed648'; -- Parrain

UPDATE profiles 
SET balance = balance + 200
WHERE id = '7d56ac43-b926-48ba-906d-4b9f46dacb4e'; -- Référé

UPDATE referrals 
SET 
  status = 'completed', -- Utiliser le bon enum
  credited_at = NOW(),
  credit_applique = true
WHERE referred_user_id = '7d56ac43-b926-48ba-906d-4b9f46dacb4e';