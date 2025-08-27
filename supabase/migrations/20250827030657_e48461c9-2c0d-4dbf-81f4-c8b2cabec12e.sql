
-- Create KYC verifications table
CREATE TABLE IF NOT EXISTS kyc_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'requires_review')),
  id_document_url TEXT,
  id_document_type TEXT CHECK (id_document_type IN ('carte_identite', 'passeport', 'permis_conduire')),
  selfie_url TEXT,
  video_url TEXT,
  document_name TEXT,
  document_number TEXT,
  document_birth_date DATE,
  document_expiry_date DATE,
  verification_score NUMERIC,
  face_match_score NUMERIC,
  document_verification_passed BOOLEAN,
  face_verification_passed BOOLEAN,
  verification_provider TEXT DEFAULT 'manual',
  verification_notes TEXT,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can create their own KYC verifications" ON kyc_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own KYC verifications" ON kyc_verifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all KYC verifications" ON kyc_verifications
  FOR ALL USING (is_admin_or_sub_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_kyc_verifications_updated_at
  BEFORE UPDATE ON kyc_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update profile KYC status
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

CREATE TRIGGER trigger_update_profile_kyc_status
  AFTER INSERT OR UPDATE ON kyc_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_kyc_status();

-- Create storage buckets for KYC documents if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false),
       ('kyc-selfies', 'kyc-selfies', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload their own KYC documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'kyc-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own KYC documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'kyc-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own KYC selfies" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'kyc-selfies' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own KYC selfies" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'kyc-selfies' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow admins to view all KYC files
CREATE POLICY "Admins can view all KYC documents" ON storage.objects
  FOR SELECT USING (
    bucket_id IN ('kyc-documents', 'kyc-selfies') AND 
    is_admin_or_sub_admin(auth.uid())
  );
