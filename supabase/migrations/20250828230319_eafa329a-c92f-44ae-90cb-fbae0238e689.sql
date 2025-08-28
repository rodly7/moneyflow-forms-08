-- Create storage buckets for user uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('selfies', 'selfies', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('id-cards', 'id-cards', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/pdf']::text[])
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for avatars bucket (public)
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

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create RLS policies for selfies bucket (private)
CREATE POLICY "Users can view their own selfies" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'selfies' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own selfies" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'selfies' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own selfies" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'selfies' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own selfies" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'selfies' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create RLS policies for ID cards bucket (private)
CREATE POLICY "Users can view their own ID cards" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'id-cards' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own ID cards" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'id-cards' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own ID cards" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'id-cards' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own ID cards" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'id-cards' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can access all files
CREATE POLICY "Admins can view all user files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id IN ('selfies', 'id-cards', 'avatars') AND is_admin_or_sub_admin(auth.uid()));

CREATE POLICY "Admins can manage all user files" 
ON storage.objects 
FOR ALL 
USING (bucket_id IN ('selfies', 'id-cards', 'avatars') AND is_admin_or_sub_admin(auth.uid()));