
-- Créer une table pour stocker les documents de vérification d'identité
CREATE TABLE IF NOT EXISTS public.identity_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selfie_url TEXT,
  id_card_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  verification_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id)
);

-- Ajouter des colonnes KYC à la table profiles si elles n'existent pas déjà
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'not_started' CHECK (kyc_status IN ('not_started', 'pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS kyc_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS requires_kyc BOOLEAN DEFAULT true;

-- Activer RLS sur la table identity_verifications
ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs voient leurs propres vérifications
CREATE POLICY "Users can view their own identity verifications" 
  ON public.identity_verifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Politique pour que les utilisateurs créent leurs propres vérifications
CREATE POLICY "Users can create their own identity verifications" 
  ON public.identity_verifications 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Politique pour que les utilisateurs mettent à jour leurs propres vérifications
CREATE POLICY "Users can update their own identity verifications" 
  ON public.identity_verifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Politique pour que les admins voient toutes les vérifications
CREATE POLICY "Admins can view all identity verifications" 
  ON public.identity_verifications 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'sub_admin')
    )
  );

-- Créer les buckets de stockage pour les documents KYC
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Politique de stockage pour les documents KYC
CREATE POLICY "Users can upload their own KYC documents" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'kyc-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own KYC documents" 
  ON storage.objects 
  FOR SELECT 
  USING (
    bucket_id = 'kyc-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all KYC documents" 
  ON storage.objects 
  FOR SELECT 
  USING (
    bucket_id = 'kyc-documents' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'sub_admin')
    )
  );

-- Fonction pour mettre à jour le statut KYC du profil
CREATE OR REPLACE FUNCTION update_profile_kyc_status()
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

-- Trigger pour synchroniser le statut KYC
DROP TRIGGER IF EXISTS sync_kyc_status ON public.identity_verifications;
CREATE TRIGGER sync_kyc_status
  AFTER INSERT OR UPDATE ON public.identity_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_kyc_status();
