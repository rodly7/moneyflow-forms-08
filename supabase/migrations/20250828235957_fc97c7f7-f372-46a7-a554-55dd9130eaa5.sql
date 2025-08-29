-- Créer les buckets de stockage pour les avatars et cartes d'identité
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('avatars', 'avatars', true),
  ('id-cards', 'id-cards', false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public;

-- Supprimer les anciennes politiques pour éviter les conflits
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own ID cards" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own ID cards" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own ID cards" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all ID cards" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own ID cards" ON storage.objects;

-- Créer les politiques RLS pour le bucket avatars (public)
CREATE POLICY "Authenticated users can upload avatars" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Authenticated users can update their avatars" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Avatars are publicly viewable" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete their own avatars" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Créer les politiques RLS pour le bucket id-cards (privé)
CREATE POLICY "Users can upload their own ID cards" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'id-cards' 
  AND auth.uid() IS NOT NULL 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own ID cards" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'id-cards' 
  AND auth.uid() IS NOT NULL 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own ID cards" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'id-cards' 
  AND auth.uid() IS NOT NULL 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can view all ID cards" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'id-cards' 
  AND is_admin_or_sub_admin(auth.uid())
);

CREATE POLICY "Users can delete their own ID cards" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'id-cards' 
  AND auth.uid() IS NOT NULL 
  AND (storage.foldername(name))[1] = auth.uid()::text
);