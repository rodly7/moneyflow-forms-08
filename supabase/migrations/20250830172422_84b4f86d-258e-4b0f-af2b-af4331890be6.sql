-- Supprimer la table user_requests et créer une vue à la place
DROP TABLE IF EXISTS user_requests CASCADE;

-- Créer une vue unifiée pour les demandes utilisateurs basée sur les tables recharges et withdrawals
CREATE VIEW user_requests AS 
SELECT 
  r.id,
  r.user_id,
  'recharge'::text as operation_type,
  r.amount,
  COALESCE(r.payment_method, 'Mobile Money')::text as payment_method,
  COALESCE(r.payment_phone, r.provider_transaction_id)::text as payment_phone,
  r.status,
  r.created_at,
  NULL::uuid as processed_by,
  NULL::timestamp with time zone as processed_at,
  NULL::text as rejection_reason
FROM recharges r

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
FROM withdrawals w;

-- Mettre à jour les politiques sur recharges pour les sous-administrateurs
CREATE POLICY "Sub-admins can view recharges" ON recharges
  FOR SELECT USING (is_admin_or_sub_admin(auth.uid()));

-- Mettre à jour les politiques sur withdrawals pour les sous-administrateurs  
CREATE POLICY "Sub-admins can view withdrawals" ON withdrawals
  FOR SELECT USING (is_admin_or_sub_admin(auth.uid()));

-- Permettre aux sous-administrateurs de modifier le statut des recharges et withdrawals
CREATE POLICY "Sub-admins can update recharge status" ON recharges
  FOR UPDATE USING (is_admin_or_sub_admin(auth.uid()));

CREATE POLICY "Sub-admins can update withdrawal status" ON withdrawals
  FOR UPDATE USING (is_admin_or_sub_admin(auth.uid()));