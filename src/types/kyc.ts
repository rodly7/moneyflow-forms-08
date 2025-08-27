
export interface KYCVerificationRecord {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'requires_review';
  id_document_type: 'carte_identite' | 'passeport' | 'permis_conduire' | null;
  document_name: string | null;
  document_number: string | null;
  document_birth_date: string | null;
  document_expiry_date: string | null;
  id_document_url: string | null;
  selfie_url: string | null;
  video_url: string | null;
  verification_score: number | null;
  face_match_score: number | null;
  document_verification_passed: boolean | null;
  face_verification_passed: boolean | null;
  verification_provider: string | null;
  verification_notes: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface KYCVerificationInsert {
  user_id: string;
  id_document_type: string;
  document_name: string;
  document_number: string;
  document_birth_date: string;
  document_expiry_date?: string;
  id_document_url?: string;
  selfie_url?: string;
  video_url?: string;
  status: string;
  verified_at?: string;
}
