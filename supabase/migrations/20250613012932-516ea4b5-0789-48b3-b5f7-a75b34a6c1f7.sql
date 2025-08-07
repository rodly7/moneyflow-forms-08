
-- Ajouter une politique RLS pour permettre aux agents de créer des profils pour les clients
CREATE POLICY "Agents can create client profiles" ON public.profiles
  FOR INSERT 
  WITH CHECK (public.is_agent(auth.uid()) = true);

-- Ajouter une politique RLS pour permettre aux agents de mettre à jour les profils clients
CREATE POLICY "Agents can update client profiles" ON public.profiles
  FOR UPDATE 
  USING (public.is_agent(auth.uid()) = true);
