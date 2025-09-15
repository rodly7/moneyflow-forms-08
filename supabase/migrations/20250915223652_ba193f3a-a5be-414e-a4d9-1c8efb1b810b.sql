-- Créer une vue sécurisée pour les transferts reçus avec les noms des expéditeurs
CREATE OR REPLACE VIEW public.transfers_with_sender_info AS
SELECT 
  t.*,
  p.full_name as sender_full_name,
  p.phone as sender_phone
FROM public.transfers t
LEFT JOIN public.profiles p ON t.sender_id = p.id;

-- Politique RLS pour la vue : un utilisateur peut voir les transferts qu'il a envoyés ou reçus
ALTER VIEW public.transfers_with_sender_info OWNER TO postgres;

-- Créer des politiques RLS pour la vue
CREATE POLICY "Users can view transfers they sent or received" ON public.transfers_with_sender_info
FOR SELECT USING (
  auth.uid() = sender_id OR 
  auth.uid() = recipient_id OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND phone = recipient_phone
  )
);

-- Activer RLS sur la vue
ALTER VIEW public.transfers_with_sender_info ENABLE ROW LEVEL SECURITY;