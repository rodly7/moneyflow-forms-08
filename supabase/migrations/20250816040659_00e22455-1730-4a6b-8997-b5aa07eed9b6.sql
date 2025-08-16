
-- Table pour stocker les sessions de paiement
CREATE TABLE public.payment_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XAF',
  payment_method TEXT NOT NULL,
  provider TEXT NOT NULL,
  session_id TEXT UNIQUE NOT NULL,
  checkout_url TEXT,
  ussd_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  provider_transaction_id TEXT,
  callback_data JSONB,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 minutes'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour l'historique des callbacks
CREATE TABLE public.payment_callbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_session_id UUID REFERENCES public.payment_sessions(id) NOT NULL,
  provider TEXT NOT NULL,
  callback_data JSONB NOT NULL,
  signature TEXT,
  verified BOOLEAN DEFAULT false,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour les recherches rapides
CREATE INDEX idx_payment_sessions_user_id ON public.payment_sessions(user_id);
CREATE INDEX idx_payment_sessions_session_id ON public.payment_sessions(session_id);
CREATE INDEX idx_payment_sessions_status ON public.payment_sessions(status);
CREATE INDEX idx_payment_callbacks_session_id ON public.payment_callbacks(payment_session_id);

-- RLS Policies pour payment_sessions
ALTER TABLE public.payment_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment sessions" 
  ON public.payment_sessions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment sessions" 
  ON public.payment_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update payment sessions" 
  ON public.payment_sessions 
  FOR UPDATE 
  USING (true);

-- RLS Policies pour payment_callbacks
ALTER TABLE public.payment_callbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view payment callbacks" 
  ON public.payment_callbacks 
  FOR SELECT 
  USING (is_admin_or_sub_admin(auth.uid()));

CREATE POLICY "System can insert payment callbacks" 
  ON public.payment_callbacks 
  FOR INSERT 
  WITH CHECK (true);

-- Fonction pour nettoyer les sessions expirées
CREATE OR REPLACE FUNCTION public.cleanup_expired_payment_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    UPDATE payment_sessions 
    SET status = 'expired'
    WHERE status = 'pending' 
      AND expires_at < NOW();
END;
$function$;

-- Trigger pour mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION public.update_payment_session_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE TRIGGER update_payment_sessions_updated_at
    BEFORE UPDATE ON public.payment_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_payment_session_updated_at();
