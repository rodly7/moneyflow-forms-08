-- Ajouter les politiques pour permettre aux administrateurs de supprimer des utilisateurs
CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (is_admin_or_sub_admin(auth.uid()));

-- Créer une table pour les dépôts administrateurs internationaux
CREATE TABLE public.admin_deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XAF',
  target_currency TEXT NOT NULL,
  exchange_rate NUMERIC NOT NULL DEFAULT 1.0,
  converted_amount NUMERIC NOT NULL,
  deposit_type TEXT NOT NULL DEFAULT 'international',
  reference_number TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS sur la table admin_deposits
ALTER TABLE public.admin_deposits ENABLE ROW LEVEL SECURITY;

-- Politiques pour les dépôts administrateurs
CREATE POLICY "Admins can create deposits" 
ON public.admin_deposits 
FOR INSERT 
WITH CHECK (is_admin_or_sub_admin(auth.uid()));

CREATE POLICY "Admins can view all deposits" 
ON public.admin_deposits 
FOR SELECT 
USING (is_admin_or_sub_admin(auth.uid()));

CREATE POLICY "Admins can update deposits" 
ON public.admin_deposits 
FOR UPDATE 
USING (is_admin_or_sub_admin(auth.uid()));

-- Fonction pour traiter les dépôts internationaux
CREATE OR REPLACE FUNCTION public.process_international_deposit(
  target_user_id UUID,
  deposit_amount NUMERIC,
  deposit_currency TEXT,
  target_currency TEXT,
  exchange_rate NUMERIC DEFAULT 1.0,
  reference_number TEXT DEFAULT NULL,
  notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_user_id UUID;
  converted_amount NUMERIC;
  deposit_id UUID;
  new_balance NUMERIC;
BEGIN
  -- Vérifier que l'utilisateur est administrateur
  admin_user_id := auth.uid();
  IF NOT is_admin_or_sub_admin(admin_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can process international deposits';
  END IF;
  
  -- Calculer le montant converti
  converted_amount := deposit_amount * exchange_rate;
  
  -- Vérifier que l'utilisateur cible existe
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;
  
  -- Créer l'enregistrement du dépôt
  INSERT INTO admin_deposits (
    admin_id,
    target_user_id,
    amount,
    currency,
    target_currency,
    exchange_rate,
    converted_amount,
    reference_number,
    notes
  ) VALUES (
    admin_user_id,
    target_user_id,
    deposit_amount,
    deposit_currency,
    target_currency,
    exchange_rate,
    converted_amount,
    reference_number,
    notes
  ) RETURNING id INTO deposit_id;
  
  -- Créditer le compte de l'utilisateur
  new_balance := secure_increment_balance(
    target_user_id,
    converted_amount,
    'international_deposit',
    admin_user_id
  );
  
  RETURN deposit_id;
END;
$$;