
-- Créer une table pour les demandes de recharge et de retrait des utilisateurs
CREATE TABLE public.user_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('recharge', 'withdrawal')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL,
  payment_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur la table
ALTER TABLE public.user_requests ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs puissent créer leurs propres demandes
CREATE POLICY "Users can create their own requests" 
  ON public.user_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Politique pour que les utilisateurs puissent voir leurs propres demandes
CREATE POLICY "Users can view their own requests" 
  ON public.user_requests 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Politique pour que les admins et sous-admins puissent voir toutes les demandes
CREATE POLICY "Admins can view all requests" 
  ON public.user_requests 
  FOR ALL 
  USING (is_admin_or_sub_admin(auth.uid()));

-- Politique pour que les admins et sous-admins puissent traiter les demandes
CREATE POLICY "Admins can process requests" 
  ON public.user_requests 
  FOR UPDATE 
  USING (is_admin_or_sub_admin(auth.uid()));

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_user_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_requests_updated_at
    BEFORE UPDATE ON public.user_requests
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_user_requests_updated_at();

-- Activer la réplication en temps réel pour les notifications
ALTER TABLE public.user_requests REPLICA IDENTITY FULL;

-- Ajouter la table à la publication realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_requests;
