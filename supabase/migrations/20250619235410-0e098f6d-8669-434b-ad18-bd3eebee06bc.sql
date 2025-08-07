
-- Ajouter les colonnes pour la photo d'identité et le numéro de la pièce d'identité
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS id_card_number text,
ADD COLUMN IF NOT EXISTS id_card_photo_url text;

-- Créer le bucket pour les photos d'identité s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-cards', 'id-cards', false)
ON CONFLICT (id) DO NOTHING;

-- Politique pour permettre aux utilisateurs de voir leurs propres photos d'identité
CREATE POLICY "Users can view their own ID card photos" ON storage.objects
FOR SELECT USING (bucket_id = 'id-cards' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Politique pour permettre aux utilisateurs d'uploader leurs propres photos d'identité
CREATE POLICY "Users can upload their own ID card photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'id-cards' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Politique pour permettre aux utilisateurs de mettre à jour leurs propres photos d'identité
CREATE POLICY "Users can update their own ID card photos" ON storage.objects
FOR UPDATE USING (bucket_id = 'id-cards' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Politique pour permettre aux utilisateurs de supprimer leurs propres photos d'identité
CREATE POLICY "Users can delete their own ID card photos" ON storage.objects
FOR DELETE USING (bucket_id = 'id-cards' AND auth.uid()::text = (storage.foldername(name))[1]);
