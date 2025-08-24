
-- Créer une table pour les demandes des utilisateurs (recharges et retraits)
CREATE TABLE IF NOT EXISTS public.user_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  operation_type TEXT NOT NULL CHECK (operation_type IN ('recharge', 'withdrawal')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL,
  payment_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT
);

-- Activer RLS
ALTER TABLE public.user_requests ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs puissent créer leurs propres demandes
CREATE POLICY "Users can create their own requests" ON public.user_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique pour que les utilisateurs puissent voir leurs propres demandes
CREATE POLICY "Users can view their own requests" ON public.user_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Politique pour que les sous-admins et admins puissent voir toutes les demandes
CREATE POLICY "Sub-admins and admins can view all requests" ON public.user_requests
  FOR SELECT USING (is_admin_or_sub_admin(auth.uid()));

-- Politique pour que les sous-admins et admins puissent mettre à jour les demandes
CREATE POLICY "Sub-admins and admins can update requests" ON public.user_requests
  FOR UPDATE USING (is_admin_or_sub_admin(auth.uid()));

-- Activer les mises à jour temps réel
ALTER TABLE public.user_requests REPLICA IDENTITY FULL;
SELECT pg_drop_replication_slot('supabase_realtime_replication_slot') WHERE EXISTS (
  SELECT 1 FROM pg_replication_slots WHERE slot_name = 'supabase_realtime_replication_slot'
);
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_requests;

-- Créer un trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_requests_updated_at 
  BEFORE UPDATE ON public.user_requests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
