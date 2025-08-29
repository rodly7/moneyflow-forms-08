-- Créer le bucket id-cards s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('id-cards', 'id-cards', false, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Créer les politiques pour le bucket id-cards
CREATE POLICY "Admins can view all id cards" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'id-cards' AND is_admin_or_sub_admin(auth.uid()));

CREATE POLICY "Admins can upload id cards" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'id-cards' AND is_admin_or_sub_admin(auth.uid()));

CREATE POLICY "Agents can view their own id cards" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'id-cards' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "System can upload id cards" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'id-cards');

CREATE POLICY "Admins can delete id cards" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'id-cards' AND is_admin_or_sub_admin(auth.uid()));