
-- Create the kyc_verifications table
CREATE TABLE public.kyc_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'requires_review')),
  id_document_type TEXT CHECK (id_document_type IN ('carte_identite', 'passeport', 'permis_conduire')),
  document_name TEXT,
  document_number TEXT,
  document_birth_date TEXT,
  document_expiry_date TEXT,
  id_document_url TEXT,
  selfie_url TEXT,
  video_url TEXT,
  verification_score NUMERIC,
  face_match_score NUMERIC,
  document_verification_passed BOOLEAN,
  face_verification_passed BOOLEAN,
  verification_provider TEXT,
  verification_notes TEXT,
  verified_by UUID REFERENCES auth.users,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on the kyc_verifications table
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

-- Policy for users to create their own KYC verifications
CREATE POLICY "Users can create their own KYC verifications"
  ON public.kyc_verifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to view their own KYC verifications
CREATE POLICY "Users can view their own KYC verifications"
  ON public.kyc_verifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for users to update their own KYC verifications (only when pending)
CREATE POLICY "Users can update their own pending KYC verifications"
  ON public.kyc_verifications
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Policy for admins and sub-admins to view all KYC verifications
CREATE POLICY "Admins can view all KYC verifications"
  ON public.kyc_verifications
  FOR SELECT
  USING (is_admin_or_sub_admin(auth.uid()));

-- Policy for admins and sub-admins to update KYC verifications
CREATE POLICY "Admins can update KYC verifications"
  ON public.kyc_verifications
  FOR UPDATE
  USING (is_admin_or_sub_admin(auth.uid()));

-- Trigger to update the updated_at column
CREATE TRIGGER update_kyc_verifications_updated_at
  BEFORE UPDATE ON public.kyc_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create a trigger to update profile KYC status when verification status changes
CREATE OR REPLACE FUNCTION public.update_profile_kyc_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the KYC status in the profile
  UPDATE public.profiles 
  SET 
    kyc_status = NEW.status,
    is_verified = CASE WHEN NEW.status = 'approved' THEN true ELSE false END,
    verified_at = CASE WHEN NEW.status = 'approved' THEN NEW.verified_at ELSE NULL END
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply the trigger
CREATE TRIGGER trigger_update_profile_kyc_status
  AFTER UPDATE ON public.kyc_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_kyc_status();
