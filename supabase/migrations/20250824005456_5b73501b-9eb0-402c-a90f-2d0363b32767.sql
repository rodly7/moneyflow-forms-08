
-- Créer la table user_requests si elle n'existe pas déjà
CREATE TABLE IF NOT EXISTS public.user_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('recharge', 'withdrawal')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL,
  payment_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE NULL,
  processed_by UUID NULL REFERENCES auth.users(id),
  rejection_reason TEXT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ajouter RLS
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
CREATE POLICY "Admins and sub-admins can view all requests" 
  ON public.user_requests 
  FOR SELECT 
  USING (is_admin_or_sub_admin(auth.uid()));

-- Politique pour que les admins et sous-admins puissent mettre à jour les demandes
CREATE POLICY "Admins and sub-admins can update requests" 
  ON public.user_requests 
  FOR UPDATE 
  USING (is_admin_or_sub_admin(auth.uid()));

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_requests_status ON public.user_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_requests_user_id ON public.user_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_requests_created_at ON public.user_requests(created_at DESC);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_user_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_requests_updated_at
    BEFORE UPDATE ON public.user_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_user_requests_updated_at();
