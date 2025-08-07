-- Créer la table pour les factures automatiques
CREATE TABLE public.automatic_bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bill_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  recurrence TEXT NOT NULL DEFAULT 'monthly', -- monthly, quarterly, yearly, once
  is_automated BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 1, -- 1 = high, 2 = medium, 3 = low
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed, cancelled
  last_payment_date DATE,
  next_due_date DATE,
  payment_attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 30, -- 30 tentatives quotidiennes max
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table pour l'historique des paiements de factures
CREATE TABLE public.bill_payment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES automatic_bills(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL, -- success, failed, insufficient_funds
  balance_before NUMERIC NOT NULL,
  balance_after NUMERIC,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table pour les notifications de factures
CREATE TABLE public.bill_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES automatic_bills(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL, -- reminder_24h, due_today, payment_success, payment_failed, insufficient_funds
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automatic_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_notifications ENABLE ROW LEVEL SECURITY;

-- Policies pour automatic_bills
CREATE POLICY "Users can manage their own bills" 
ON public.automatic_bills 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all bills" 
ON public.automatic_bills 
FOR SELECT 
USING (is_admin_or_sub_admin(auth.uid()));

-- Policies pour bill_payment_history
CREATE POLICY "Users can view their own payment history" 
ON public.bill_payment_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert payment history" 
ON public.bill_payment_history 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all payment history" 
ON public.bill_payment_history 
FOR SELECT 
USING (is_admin_or_sub_admin(auth.uid()));

-- Policies pour bill_notifications
CREATE POLICY "Users can view their own bill notifications" 
ON public.bill_notifications 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.bill_notifications 
FOR INSERT 
WITH CHECK (true);

-- Créer la fonction pour traiter les paiements automatiques
CREATE OR REPLACE FUNCTION public.process_automatic_bill_payment(bill_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  bill_record RECORD;
  user_balance NUMERIC;
  new_balance NUMERIC;
  payment_result JSON;
  next_due DATE;
BEGIN
  -- Récupérer les informations de la facture
  SELECT * INTO bill_record
  FROM automatic_bills
  WHERE id = bill_id_param
    AND is_automated = true
    AND status = 'pending';
  
  IF bill_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Facture non trouvée ou non automatisée'
    );
  END IF;
  
  -- Récupérer le solde de l'utilisateur
  SELECT balance INTO user_balance
  FROM profiles
  WHERE id = bill_record.user_id;
  
  -- Incrémenter le nombre de tentatives
  UPDATE automatic_bills
  SET payment_attempts = payment_attempts + 1,
      updated_at = now()
  WHERE id = bill_id_param;
  
  -- Vérifier si le solde est suffisant
  IF user_balance >= bill_record.amount THEN
    -- Débiter le compte
    new_balance := secure_increment_balance(
      bill_record.user_id,
      -bill_record.amount,
      'automatic_bill_payment'
    );
    
    -- Calculer la prochaine échéance
    CASE bill_record.recurrence
      WHEN 'monthly' THEN
        next_due := bill_record.due_date + INTERVAL '1 month';
      WHEN 'quarterly' THEN
        next_due := bill_record.due_date + INTERVAL '3 months';
      WHEN 'yearly' THEN
        next_due := bill_record.due_date + INTERVAL '1 year';
      ELSE
        next_due := NULL; -- Pour 'once'
    END CASE;
    
    -- Mettre à jour la facture
    UPDATE automatic_bills
    SET status = CASE WHEN bill_record.recurrence = 'once' THEN 'paid' ELSE 'pending' END,
        last_payment_date = CURRENT_DATE,
        next_due_date = next_due,
        due_date = COALESCE(next_due, due_date),
        payment_attempts = 0
    WHERE id = bill_id_param;
    
    -- Enregistrer dans l'historique
    INSERT INTO bill_payment_history (
      bill_id, user_id, amount, status, balance_before, balance_after, attempt_number
    ) VALUES (
      bill_id_param, bill_record.user_id, bill_record.amount, 'success', 
      user_balance, new_balance, bill_record.payment_attempts + 1
    );
    
    -- Créer notification de succès
    INSERT INTO bill_notifications (
      bill_id, user_id, notification_type
    ) VALUES (
      bill_id_param, bill_record.user_id, 'payment_success'
    );
    
    RETURN json_build_object(
      'success', true,
      'message', 'Paiement effectué avec succès',
      'amount', bill_record.amount,
      'new_balance', new_balance
    );
  ELSE
    -- Solde insuffisant
    INSERT INTO bill_payment_history (
      bill_id, user_id, amount, status, balance_before, attempt_number, error_message
    ) VALUES (
      bill_id_param, bill_record.user_id, bill_record.amount, 'insufficient_funds',
      user_balance, bill_record.payment_attempts + 1, 'Solde insuffisant'
    );
    
    -- Créer notification d'échec
    INSERT INTO bill_notifications (
      bill_id, user_id, notification_type
    ) VALUES (
      bill_id_param, bill_record.user_id, 'insufficient_funds'
    );
    
    -- Si max tentatives atteint, mettre en échec
    IF bill_record.payment_attempts + 1 >= bill_record.max_attempts THEN
      UPDATE automatic_bills
      SET status = 'failed'
      WHERE id = bill_id_param;
    END IF;
    
    RETURN json_build_object(
      'success', false,
      'message', 'Solde insuffisant',
      'required', bill_record.amount,
      'available', user_balance,
      'attempts', bill_record.payment_attempts + 1
    );
  END IF;
END;
$$;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_automatic_bills_updated_at
BEFORE UPDATE ON public.automatic_bills
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();