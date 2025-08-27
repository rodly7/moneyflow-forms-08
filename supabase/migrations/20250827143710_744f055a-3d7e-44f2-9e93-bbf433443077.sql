-- Rendre les buckets d'images publics pour permettre l'affichage des photos d'identité
UPDATE storage.buckets 
SET public = true 
WHERE id IN ('id-cards', 'identity-verification', 'id_photos');

-- Mettre à jour les politiques RLS pour permettre l'accès public en lecture aux images
CREATE POLICY "Public read access for id cards" 
ON storage.objects 
FOR SELECT 
USING (bucket_id IN ('id-cards', 'identity-verification', 'id_photos'));

-- Permettre aux utilisateurs de télécharger leurs propres images
CREATE POLICY "Users can upload their own id cards" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id IN ('id-cards', 'identity-verification', 'id_photos') 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permettre aux utilisateurs de modifier leurs propres images  
CREATE POLICY "Users can update their own id cards" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id IN ('id-cards', 'identity-verification', 'id_photos') 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permettre aux admins d'accéder à toutes les images
CREATE POLICY "Admins can access all id cards" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id IN ('id-cards', 'identity-verification', 'id_photos') 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'sub_admin')
  )
);