-- Créer le bucket selfies seulement s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('selfies', 'selfies', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Créer les policies pour selfies (avec IF NOT EXISTS pour éviter les doublons)
DO $$
BEGIN
    -- Policy pour upload
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can upload their own selfies' 
        AND tablename = 'objects' 
        AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Users can upload their own selfies" 
        ON storage.objects 
        FOR INSERT 
        WITH CHECK (bucket_id = 'selfies' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
    
    -- Policy pour view
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can view their own selfies' 
        AND tablename = 'objects' 
        AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Users can view their own selfies" 
        ON storage.objects 
        FOR SELECT 
        USING (bucket_id = 'selfies' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
    
    -- Policy pour admin
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Admins can view all selfies' 
        AND tablename = 'objects' 
        AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Admins can view all selfies" 
        ON storage.objects 
        FOR SELECT 
        USING (bucket_id = 'selfies' AND is_admin_or_sub_admin(auth.uid()));
    END IF;
END $$;