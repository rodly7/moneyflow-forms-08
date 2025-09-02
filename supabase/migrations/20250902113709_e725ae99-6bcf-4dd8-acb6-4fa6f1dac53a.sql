-- Créer une table pour les paiements de commission Sendflow
CREATE TABLE IF NOT EXISTS public.sendflow_commission_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 50,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.sendflow_commission_payments ENABLE ROW LEVEL SECURITY;

-- Politique pour que les marchands voient seulement leurs propres paiements
CREATE POLICY "Merchants can view their own commission payments" 
ON public.sendflow_commission_payments 
FOR SELECT 
USING (auth.uid() = merchant_id);

-- Politique pour que les marchands puissent créer leurs propres paiements
CREATE POLICY "Merchants can create their own commission payments" 
ON public.sendflow_commission_payments 
FOR INSERT 
WITH CHECK (auth.uid() = merchant_id);

-- Politique pour que les admins puissent tout voir
CREATE POLICY "Admins can view all commission payments" 
ON public.sendflow_commission_payments 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'sub_admin')
  )
);

-- Créer un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_sendflow_commission_payments_merchant_date 
ON public.sendflow_commission_payments(merchant_id, payment_date);

-- Trigger pour updated_at
CREATE TRIGGER update_sendflow_commission_payments_updated_at
    BEFORE UPDATE ON public.sendflow_commission_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Contrainte unique pour éviter les doublons par jour
ALTER TABLE public.sendflow_commission_payments 
ADD CONSTRAINT unique_merchant_payment_per_day 
UNIQUE (merchant_id, payment_date);