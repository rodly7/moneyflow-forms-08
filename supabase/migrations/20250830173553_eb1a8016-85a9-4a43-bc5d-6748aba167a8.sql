-- Ajouter les colonnes manquantes à la table user_requests
ALTER TABLE public.user_requests 
ADD COLUMN IF NOT EXISTS operation_type TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_phone TEXT,
ADD COLUMN IF NOT EXISTS processed_by UUID,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Mettre à jour les colonnes avec des valeurs par défaut appropriées
UPDATE public.user_requests 
SET operation_type = CASE 
  WHEN request_type = 'recharge' THEN 'Recharge'
  WHEN request_type = 'withdrawal' THEN 'Retrait'
  ELSE request_type
END
WHERE operation_type IS NULL;

-- Rendre operation_type non-nullable maintenant qu'il a des valeurs
ALTER TABLE public.user_requests 
ALTER COLUMN operation_type SET NOT NULL;