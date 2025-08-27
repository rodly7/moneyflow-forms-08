
-- Table pour stocker les vérifications d'identité
CREATE TABLE IF NOT EXISTS public.kyc_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'requires_review')),
  
  -- Documents uploadés
  id_document_url TEXT,
  id_document_type TEXT CHECK (id_document_type IN ('carte_identite', 'passeport', 'permis_conduire')),
  selfie_url TEXT,
  video_url TEXT,
  
  -- Données extraites du document
  document_name TEXT,
  document_number TEXT,
  document_birth_date DATE,
  document_expiry_date DATE,
  
  -- Résultats de la vérification
  verification_score NUMERIC DEFAULT 0,
  face_match_score NUMERIC DEFAULT 0,
  document_verification_passed BOOLEAN DEFAULT false,
  face_verification_passed BOOLEAN DEFAULT false,
  
  -- Métadonnées
  verification_provider TEXT DEFAULT 'manual',
  verification_notes TEXT,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ajout d'un champ KYC status dans la table profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'not_started' CHECK (kyc_status IN ('not_started', 'pending', 'approved', 'rejected', 'requires_review')),
ADD COLUMN IF NOT EXISTS kyc_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS requires_kyc BOOLEAN DEFAULT true;

-- RLS policies pour kyc_verifications
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir et créer leurs propres vérifications
CREATE POLICY "Users can view their own KYC verifications" 
  ON public.kyc_verifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own KYC verifications" 
  ON public.kyc_verifications 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending KYC verifications" 
  ON public.kyc_verifications 
  FOR UPDATE 
  USING (auth.uid() = user_id AND status = 'pending');

-- Les admins peuvent tout voir et modifier
CREATE POLICY "Admins can view all KYC verifications" 
  ON public.kyc_verifications 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'sub_admin')
    )
  );

-- Créer les buckets de stockage pour les documents KYC
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('kyc-documents', 'kyc-documents', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('kyc-selfies', 'kyc-selfies', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies pour les buckets de stockage KYC
CREATE POLICY "Users can upload their own KYC documents"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id IN ('kyc-documents', 'kyc-selfies') AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own KYC documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id IN ('kyc-documents', 'kyc-selfies') AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins peuvent voir tous les documents KYC
CREATE POLICY "Admins can view all KYC documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id IN ('kyc-documents', 'kyc-selfies') AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'sub_admin')
    )
  );

-- Trigger pour mettre à jour le statut KYC dans profiles
CREATE OR REPLACE FUNCTION public.update_profile_kyc_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le statut KYC dans le profil
  UPDATE public.profiles 
  SET 
    kyc_status = NEW.status,
    kyc_completed_at = CASE WHEN NEW.status = 'approved' THEN NEW.verified_at ELSE NULL END
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_profile_kyc_trigger
  AFTER UPDATE ON public.kyc_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_kyc_status();

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_user_id ON public.kyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_status ON public.kyc_verifications(status);
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_status ON public.profiles(kyc_status);
