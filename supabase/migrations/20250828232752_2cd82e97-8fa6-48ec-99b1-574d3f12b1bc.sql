-- Vérifier et créer le bucket selfies si nécessaire
DO $$
BEGIN
    -- Supprimer et recréer le bucket pour être sûr
    DELETE FROM storage.buckets WHERE id = 'selfies';
    
    -- Créer le bucket selfies
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('selfies', 'selfies', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]);
    
    -- Vérifier que le bucket a été créé
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'selfies') THEN
        RAISE EXCEPTION 'Failed to create selfies bucket';
    END IF;
END $$;

-- Supprimer les anciennes policies et les recréer
DROP POLICY IF EXISTS "Users can upload their own selfies" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own selfies" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all selfies" ON storage.objects;

-- Recréer les policies pour selfies
CREATE POLICY "Users can upload their own selfies" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'selfies' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own selfies" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'selfies' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all selfies" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'selfies' AND is_admin_or_sub_admin(auth.uid()));