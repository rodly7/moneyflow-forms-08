-- Créer la table des codes de parrainage
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table des parrainages
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'valide', 'credit_applique')),
  credit_applique BOOLEAN NOT NULL DEFAULT false,
  amount_credited NUMERIC DEFAULT 200,
  credited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referred_user_id) -- Un utilisateur ne peut être parrainé qu'une seule fois
);

-- Activer RLS sur les tables
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour referral_codes
CREATE POLICY "Users can view their own referral code" 
ON public.referral_codes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referral code" 
ON public.referral_codes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral code" 
ON public.referral_codes FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all referral codes" 
ON public.referral_codes FOR ALL 
USING (is_admin_or_sub_admin(auth.uid()));

-- Politiques RLS pour referrals
CREATE POLICY "Users can view their own referrals" 
ON public.referrals FOR SELECT 
USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "System can insert referrals" 
ON public.referrals FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can manage all referrals" 
ON public.referrals FOR ALL 
USING (is_admin_or_sub_admin(auth.uid()));

-- Fonction pour générer un code de parrainage unique
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Générer un code au format SEND-XXXXX
    new_code := 'SEND-' || LPAD(floor(random() * 99999)::text, 5, '0');
    
    -- Vérifier si le code existe déjà
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE referral_code = new_code) INTO code_exists;
    
    -- Si le code n'existe pas, le retourner
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- Fonction pour créer automatiquement un code de parrainage à l'inscription
CREATE OR REPLACE FUNCTION public.create_referral_code_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_referral_code TEXT;
BEGIN
  -- Générer un code unique
  new_referral_code := public.generate_referral_code();
  
  -- Insérer le code dans la table
  INSERT INTO public.referral_codes (user_id, referral_code)
  VALUES (NEW.id, new_referral_code);
  
  RETURN NEW;
END;
$$;

-- Trigger pour créer automatiquement un code de parrainage
CREATE TRIGGER create_referral_code_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_referral_code_for_new_user();

-- Fonction pour traiter un parrainage et créditer le parrain
CREATE OR REPLACE FUNCTION public.process_referral_credit(referred_user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  referral_record public.referrals%ROWTYPE;
  new_balance NUMERIC;
BEGIN
  -- Récupérer le parrainage en attente
  SELECT * INTO referral_record
  FROM public.referrals
  WHERE referred_user_id = referred_user_id_param
    AND status = 'en_attente'
    AND credit_applique = false;
  
  -- Si aucun parrainage trouvé, retourner false
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Créditer le compte du parrain
  new_balance := public.secure_increment_balance(
    referral_record.referrer_id,
    referral_record.amount_credited,
    'referral_bonus'
  );
  
  -- Mettre à jour le statut du parrainage
  UPDATE public.referrals
  SET 
    status = 'credit_applique',
    credit_applique = true,
    credited_at = now(),
    updated_at = now()
  WHERE id = referral_record.id;
  
  -- Créer une notification pour le parrain
  INSERT INTO public.notifications (
    title,
    message,
    notification_type,
    priority,
    sent_by,
    target_users,
    total_recipients
  ) VALUES (
    '🎉 Parrainage réussi !',
    'Félicitations ! Votre ami vient de s''inscrire. ' || referral_record.amount_credited || ' XAF ont été ajoutés à votre compte.',
    'referral_success',
    'high',
    referred_user_id_param,
    ARRAY[referral_record.referrer_id],
    1
  );
  
  -- Créer l'enregistrement du destinataire de la notification
  INSERT INTO public.notification_recipients (
    notification_id,
    user_id,
    status
  ) VALUES (
    (SELECT id FROM public.notifications ORDER BY created_at DESC LIMIT 1),
    referral_record.referrer_id,
    'sent'
  );
  
  RETURN true;
END;
$$;

-- Index pour optimiser les performances
CREATE INDEX idx_referral_codes_user_id ON public.referral_codes(user_id);
CREATE INDEX idx_referral_codes_code ON public.referral_codes(referral_code);
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referred_user_id ON public.referrals(referred_user_id);
CREATE INDEX idx_referrals_status ON public.referrals(status);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_referral_codes_updated_at
  BEFORE UPDATE ON public.referral_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();