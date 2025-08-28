-- Créer seulement le bucket selfies manquant
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('selfies', 'selfies', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[])
ON CONFLICT (id) DO NOTHING;

-- Créer seulement les policies manquantes pour selfies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload their own selfies' AND tablename = 'objects') THEN
        CREATE POLICY "Users can upload their own selfies" 
        ON storage.objects 
        FOR INSERT 
        WITH CHECK (bucket_id = 'selfies' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own selfies' AND tablename = 'objects') THEN
        CREATE POLICY "Users can view their own selfies" 
        ON storage.objects 
        FOR SELECT 
        USING (bucket_id = 'selfies' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all selfies' AND tablename = 'objects') THEN
        CREATE POLICY "Admins can view all selfies" 
        ON storage.objects 
        FOR SELECT 
        USING (bucket_id = 'selfies' AND is_admin_or_sub_admin(auth.uid()));
    END IF;
END $$;