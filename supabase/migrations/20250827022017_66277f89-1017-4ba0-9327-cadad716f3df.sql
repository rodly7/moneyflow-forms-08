
-- Créer les buckets de stockage pour les avatars et pièces d'identité
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('id-cards', 'id-cards', true)
ON CONFLICT (id) DO NOTHING;

-- Créer les politiques RLS pour le bucket avatars
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can view avatars" ON storage.objects
FOR SELECT USING (
  bucket_id = 'avatars'
);

CREATE POLICY "Authenticated users can update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Créer les politiques RLS pour le bucket id-cards
CREATE POLICY "Authenticated users can upload id-cards" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'id-cards' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can view id-cards" ON storage.objects
FOR SELECT USING (
  bucket_id = 'id-cards'
);

CREATE POLICY "Authenticated users can update their own id-cards" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'id-cards' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can delete their own id-cards" ON storage.objects
FOR DELETE USING (
  bucket_id = 'id-cards' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Vérifier et ajuster les politiques RLS sur la table profiles si nécessaire
-- Permettre aux utilisateurs de mettre à jour leur profil avec les nouvelles colonnes
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur propre profil" ON profiles;

CREATE POLICY "Users can update their own profile data" ON profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
