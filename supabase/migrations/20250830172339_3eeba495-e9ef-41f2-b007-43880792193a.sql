-- Vérifier si la table user_requests existe, sinon créer une vue ou utiliser les tables existantes
-- Créer une vue unifiée pour les demandes utilisateurs basée sur les tables recharges et withdrawals

CREATE OR REPLACE VIEW user_requests AS 
SELECT 
  r.id,
  r.user_id,
  'recharge'::text as operation_type,
  r.amount,
  r.payment_method,
  r.payment_phone,
  r.status,
  r.created_at,
  NULL::uuid as processed_by,
  NULL::timestamp with time zone as processed_at,
  NULL::text as rejection_reason
FROM recharges r
WHERE r.status IN ('pending', 'completed', 'failed')

UNION ALL

SELECT 
  w.id,
  w.user_id,
  'withdrawal'::text as operation_type,
  w.amount,
  'Mobile Money'::text as payment_method,
  w.withdrawal_phone as payment_phone,
  w.status,
  w.created_at,
  NULL::uuid as processed_by,
  NULL::timestamp with time zone as processed_at,
  NULL::text as rejection_reason
FROM withdrawals w
WHERE w.status IN ('pending', 'completed', 'failed');

-- Politique RLS pour la vue user_requests
CREATE POLICY "Sub-admins can view user requests" ON user_requests
  FOR SELECT USING (is_admin_or_sub_admin(auth.uid()));

-- Si besoin, créer la table réelle user_requests pour stocker des métadonnées supplémentaires
CREATE TABLE IF NOT EXISTS public.user_requests_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL, -- ID de la demande (recharge ou withdrawal)
  request_type text NOT NULL, -- 'recharge' ou 'withdrawal'
  processed_by uuid REFERENCES profiles(id),
  processed_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS pour la table metadata
ALTER TABLE public.user_requests_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sub-admins can manage user request metadata" 
ON public.user_requests_metadata FOR ALL 
USING (is_admin_or_sub_admin(auth.uid()));

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_user_requests_metadata_updated_at
  BEFORE UPDATE ON public.user_requests_metadata
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();