-- Vérifier et créer les politiques RLS pour le storage id-cards si nécessaires
DO $$
BEGIN
  -- Politique pour permettre la lecture publique des photos d'identité
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public Access to ID Cards'
  ) THEN
    CREATE POLICY "Public Access to ID Cards"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'id-cards');
  END IF;

  -- Politique pour permettre aux utilisateurs authentifiés de télécharger leurs propres photos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload their own ID cards'
  ) THEN
    CREATE POLICY "Users can upload their own ID cards"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'id-cards' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- Politique pour permettre aux admins de voir toutes les photos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can view all ID cards'
  ) THEN
    CREATE POLICY "Admins can view all ID cards"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'id-cards' AND is_admin_or_sub_admin(auth.uid()));
  END IF;
END $$;