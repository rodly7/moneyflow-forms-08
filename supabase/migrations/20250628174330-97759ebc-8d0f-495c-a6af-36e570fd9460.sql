
-- Créer la table agent_reports pour stocker les rapports des agents
CREATE TABLE public.agent_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly')),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_transfers INTEGER NOT NULL DEFAULT 0,
  total_withdrawals INTEGER NOT NULL DEFAULT 0,
  total_deposits INTEGER NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  amount_to_add NUMERIC NOT NULL DEFAULT 0,
  total_commissions NUMERIC NOT NULL DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(agent_id, period, report_date)
);

-- Activer RLS sur la table agent_reports
ALTER TABLE public.agent_reports ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour que les agents puissent voir leurs propres rapports
CREATE POLICY "Agents can view their own reports" 
  ON public.agent_reports 
  FOR SELECT 
  USING (auth.uid() = agent_id);

-- Créer une politique pour que les agents puissent insérer leurs propres rapports
CREATE POLICY "Agents can create their own reports" 
  ON public.agent_reports 
  FOR INSERT 
  WITH CHECK (auth.uid() = agent_id);

-- Créer une politique pour que les agents puissent mettre à jour leurs propres rapports
CREATE POLICY "Agents can update their own reports" 
  ON public.agent_reports 
  FOR UPDATE 
  USING (auth.uid() = agent_id);

-- Créer une politique pour que les admins puissent voir tous les rapports
CREATE POLICY "Admins can view all reports" 
  ON public.agent_reports 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'sub_admin')
    )
  );
