
-- S'assurer que les colonnes pour les photos existent dans la table profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS id_card_photo_url text;

-- S'assurer que les buckets de stockage existent
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('id-cards', 'id-cards', false)
ON CONFLICT (id) DO NOTHING;

-- Supprimer les anciennes politiques si elles existent puis les recréer
DROP POLICY IF EXISTS "Users can view all avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own ID cards" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own ID cards" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own ID cards" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own ID cards" ON storage.objects;

-- Politiques pour le bucket avatars (public)
CREATE POLICY "Users can view all avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Politiques pour le bucket id-cards (privé)
CREATE POLICY "Users can view their own ID cards" ON storage.objects
FOR SELECT USING (bucket_id = 'id-cards' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own ID cards" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'id-cards' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own ID cards" ON storage.objects
FOR UPDATE USING (bucket_id = 'id-cards' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own ID cards" ON storage.objects
FOR DELETE USING (bucket_id = 'id-cards' AND auth.uid()::text = (storage.foldername(name))[1]);
