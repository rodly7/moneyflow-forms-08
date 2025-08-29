-- Rendre le bucket id-cards public pour permettre l'affichage direct des images
UPDATE storage.buckets 
SET public = true 
WHERE id = 'id-cards';

-- Supprimer les anciennes politiques restrictives et les remplacer par des politiques publiques
DROP POLICY IF EXISTS "Admins can view all id cards" ON storage.objects;
DROP POLICY IF EXISTS "Agents can view their own id cards" ON storage.objects;

-- Créer une politique simple pour permettre à tous les utilisateurs authentifiés de voir les photos d'identité
CREATE POLICY "Authenticated users can view id cards" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'id-cards' AND auth.uid() IS NOT NULL);