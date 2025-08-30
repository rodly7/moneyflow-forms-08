-- Supprimer la vue user_requests si elle existe
DROP VIEW IF EXISTS public.user_requests;

-- Recréer la table user_requests comme elle était avant
CREATE TABLE IF NOT EXISTS public.user_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    request_type TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- Réactiver RLS sur la table user_requests
ALTER TABLE public.user_requests ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour la table user_requests
CREATE POLICY "Sub-admins can view user requests" 
ON public.user_requests 
FOR SELECT 
USING (is_admin_or_sub_admin(auth.uid()));

CREATE POLICY "Sub-admins can update user requests" 
ON public.user_requests 
FOR UPDATE 
USING (is_admin_or_sub_admin(auth.uid()));

CREATE POLICY "Users can create their own requests" 
ON public.user_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Supprimer les politiques ajoutées aux tables recharges et withdrawals si elles existent
DROP POLICY IF EXISTS "Sub-admins can view all recharges" ON public.recharges;
DROP POLICY IF EXISTS "Sub-admins can update all recharges" ON public.recharges;
DROP POLICY IF EXISTS "Sub-admins can view all withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Sub-admins can update all withdrawals" ON public.withdrawals;