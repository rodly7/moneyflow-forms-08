-- Créer quelques données de test pour le commerçant
INSERT INTO merchant_payments (
  merchant_id,
  user_id,
  amount,
  business_name,
  description,
  status,
  currency
) VALUES 
(
  'ed8f7137-a629-461f-a064-0c0e392efbe8',
  'ed8f7137-a629-461f-a064-0c0e392efbe8',
  15000,
  'Boutique Test',
  'Achat de produits',
  'completed',
  'XAF'
),
(
  'ed8f7137-a629-461f-a064-0c0e392efbe8',
  'ed8f7137-a629-461f-a064-0c0e392efbe8',
  8500,
  'Client Premium',
  'Service consultattion',
  'completed',
  'XAF'
),
(
  'ed8f7137-a629-461f-a064-0c0e392efbe8',
  'ed8f7137-a629-461f-a064-0c0e392efbe8',
  12000,
  'Entreprise ABC',
  'Commande #456',
  'completed',
  'XAF'
);

-- Mettre à jour les politiques RLS pour permettre aux commerçants de voir leurs propres paiements
DROP POLICY IF EXISTS "Merchants can view their own payments" ON merchant_payments;

CREATE POLICY "Merchants can view their own payments" 
ON merchant_payments 
FOR SELECT 
USING (merchant_id = auth.uid()::text);