-- Créer tous les buckets de stockage nécessaires
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('selfies', 'selfies', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('id-cards', 'id-cards', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[])
ON CONFLICT (id) DO NOTHING;

-- Créer les policies RLS pour le bucket selfies
CREATE POLICY "Users can upload their own selfies" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'selfies' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own selfies" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'selfies' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own selfies" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'selfies' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all selfies" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'selfies' AND is_admin_or_sub_admin(auth.uid()));

-- Créer les policies RLS pour le bucket id-cards
CREATE POLICY "Users can upload their own id-cards" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'id-cards' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own id-cards" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'id-cards' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own id-cards" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'id-cards' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all id-cards" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'id-cards' AND is_admin_or_sub_admin(auth.uid()));

-- Créer les policies RLS pour le bucket avatars (public)
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);