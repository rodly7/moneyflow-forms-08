
-- Create the kyc_verifications table
CREATE TABLE public.kyc_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies for kyc_verifications
CREATE POLICY "Users can view their own KYC verifications" 
  ON public.kyc_verifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own KYC verifications" 
  ON public.kyc_verifications 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own KYC verifications" 
  ON public.kyc_verifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all KYC verifications" 
  ON public.kyc_verifications 
  FOR SELECT 
  USING (is_admin_or_sub_admin(auth.uid()));

CREATE POLICY "Admins can update all KYC verifications" 
  ON public.kyc_verifications 
  FOR UPDATE 
  USING (is_admin_or_sub_admin(auth.uid()));

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_kyc_verifications_updated_at 
  BEFORE UPDATE ON public.kyc_verifications 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets for KYC files if they don't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc-documents', 'kyc-documents', false),
       ('kyc-selfies', 'kyc-selfies', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for kyc-documents bucket
CREATE POLICY "Users can upload their own KYC documents" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own KYC documents" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all KYC documents" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'kyc-documents' AND is_admin_or_sub_admin(auth.uid()));

-- Create storage policies for kyc-selfies bucket
CREATE POLICY "Users can upload their own KYC selfies" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'kyc-selfies' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own KYC selfies" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'kyc-selfies' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all KYC selfies" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'kyc-selfies' AND is_admin_or_sub_admin(auth.uid()));
