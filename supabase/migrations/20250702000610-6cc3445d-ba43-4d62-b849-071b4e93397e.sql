
-- Table pour les comptes d'épargne
CREATE TABLE public.savings_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  target_amount NUMERIC DEFAULT NULL,
  target_date DATE DEFAULT NULL,
  auto_deposit_amount NUMERIC DEFAULT NULL,
  auto_deposit_frequency TEXT DEFAULT NULL CHECK (auto_deposit_frequency IN ('daily', 'weekly', 'monthly')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour l'historique des dépôts d'épargne
CREATE TABLE public.savings_deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  savings_account_id UUID REFERENCES public.savings_accounts ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('manual', 'automatic')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour stocker les reçus générés
CREATE TABLE public.transaction_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  transaction_id UUID NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('transfer', 'withdrawal', 'deposit', 'savings')),
  receipt_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour la localisation des agents
CREATE TABLE public.agent_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents ON DELETE CASCADE NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  zone TEXT DEFAULT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS pour savings_accounts
ALTER TABLE public.savings_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own savings accounts" 
  ON public.savings_accounts 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own savings accounts" 
  ON public.savings_accounts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own savings accounts" 
  ON public.savings_accounts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all savings accounts" 
  ON public.savings_accounts 
  FOR ALL 
  USING (is_admin_or_sub_admin(auth.uid()));

-- RLS pour savings_deposits
ALTER TABLE public.savings_deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own savings deposits" 
  ON public.savings_deposits 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own savings deposits" 
  ON public.savings_deposits 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS pour transaction_receipts
ALTER TABLE public.transaction_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own receipts" 
  ON public.transaction_receipts 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own receipts" 
  ON public.transaction_receipts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS pour agent_locations
ALTER TABLE public.agent_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active agent locations" 
  ON public.agent_locations 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Agents can update their own location" 
  ON public.agent_locations 
  FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.agents WHERE user_id = auth.uid() AND id = agent_id));

CREATE POLICY "Admins can manage all agent locations" 
  ON public.agent_locations 
  FOR ALL 
  USING (is_admin_or_sub_admin(auth.uid()));
