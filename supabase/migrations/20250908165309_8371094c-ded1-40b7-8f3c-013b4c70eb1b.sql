-- Créer les politiques RLS pour le bucket avatars si elles n'existent pas
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- Politique pour permettre à tous les utilisateurs authentifiés de voir les avatars
CREATE POLICY IF NOT EXISTS "Avatars are publicly viewable" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

-- Politique pour permettre aux utilisateurs de télécharger leurs propres avatars
CREATE POLICY IF NOT EXISTS "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Politique pour permettre aux utilisateurs de mettre à jour leurs propres avatars
CREATE POLICY IF NOT EXISTS "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Politique pour permettre aux utilisateurs de supprimer leurs propres avatars
CREATE POLICY IF NOT EXISTS "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);