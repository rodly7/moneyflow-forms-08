-- Ajouter la colonne agent_id à la table withdrawals
ALTER TABLE public.withdrawals 
ADD COLUMN agent_id UUID REFERENCES public.profiles(id);

-- Créer un index pour améliorer les performances
CREATE INDEX idx_withdrawals_agent_id ON public.withdrawals(agent_id);

-- Mettre à jour les politiques RLS pour permettre aux agents de voir leurs retraits
CREATE POLICY "Agents can view withdrawals they processed" 
ON public.withdrawals 
FOR SELECT 
USING (auth.uid() = agent_id);