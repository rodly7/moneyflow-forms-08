
-- Créer la table withdrawal_requests pour gérer les demandes de retrait des agents
CREATE TABLE public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  agent_name TEXT NOT NULL,
  agent_phone TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  withdrawal_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE NULL,
  rejected_at TIMESTAMP WITH TIME ZONE NULL,
  completed_at TIMESTAMP WITH TIME ZONE NULL
);

-- Ajouter Row Level Security (RLS)
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs puissent voir leurs propres demandes de retrait
CREATE POLICY "Users can view their own withdrawal requests" 
  ON public.withdrawal_requests 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Politique pour que les agents puissent voir les demandes qu'ils ont créées
CREATE POLICY "Agents can view withdrawal requests they created" 
  ON public.withdrawal_requests 
  FOR SELECT 
  USING (auth.uid() = agent_id);

-- Politique pour que les agents puissent créer des demandes de retrait
CREATE POLICY "Agents can create withdrawal requests" 
  ON public.withdrawal_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() = agent_id);

-- Politique pour que les utilisateurs puissent mettre à jour le statut de leurs demandes
CREATE POLICY "Users can update their withdrawal requests status" 
  ON public.withdrawal_requests 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Ajouter des contraintes pour valider les statuts
ALTER TABLE public.withdrawal_requests 
ADD CONSTRAINT valid_status 
CHECK (status IN ('pending', 'approved', 'rejected', 'completed'));

-- Ajouter des index pour optimiser les performances
CREATE INDEX idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_agent_id ON public.withdrawal_requests(agent_id);
CREATE INDEX idx_withdrawal_requests_status ON public.withdrawal_requests(status);
