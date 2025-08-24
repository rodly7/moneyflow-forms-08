
-- Créer la table user_requests pour les demandes de recharge et retrait
CREATE TABLE public.user_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('recharge', 'withdrawal')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL,
  payment_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE NULL,
  processed_by UUID NULL,
  rejection_reason TEXT NULL
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

-- Politique pour que les admins et sub-admins puissent voir toutes les demandes
CREATE POLICY "Admins can view all requests" 
  ON public.user_requests 
  FOR SELECT 
  USING (is_admin_or_sub_admin(auth.uid()));

-- Politique pour que les admins et sub-admins puissent mettre à jour les demandes
CREATE POLICY "Admins can update requests" 
  ON public.user_requests 
  FOR UPDATE 
  USING (is_admin_or_sub_admin(auth.uid()));

-- Ajouter des index pour améliorer les performances
CREATE INDEX idx_user_requests_status ON public.user_requests(status);
CREATE INDEX idx_user_requests_user_id ON public.user_requests(user_id);
CREATE INDEX idx_user_requests_created_at ON public.user_requests(created_at);
