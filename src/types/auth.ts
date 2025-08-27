
export interface Profile {
  id: string;
  full_name: string | null;
  phone: string;
  country: string | null;
  address: string | null;
  balance: number;
  role: 'user' | 'agent' | 'admin' | 'sub_admin';
  avatar_url: string | null;
  is_verified: boolean | null;
  birth_date: string | null;
  id_card_url: string | null;
  kyc_status: 'not_started' | 'pending' | 'approved' | 'rejected' | 'requires_review' | null;
  kyc_completed_at: string | null;
  requires_kyc: boolean | null;
}

export interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  userRole: 'user' | 'agent' | 'admin' | 'sub_admin' | null;
  loading: boolean;
  signIn: (phone: string, password: string) => Promise<void>;
  signUp: (phone: string, password: string, metadata: any) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
  isAgent: () => boolean;
  isAgentOrAdmin: () => boolean;
  refreshProfile: () => Promise<void>;
}

export interface SignUpMetadata {
  full_name: string;
  country: string;
  address: string;
  phone: string;
  role: 'user' | 'agent';
  birth_date: string;
}

export interface KYCVerification {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'requires_review';
  id_document_url: string | null;
  id_document_type: 'carte_identite' | 'passeport' | 'permis_conduire' | null;
  selfie_url: string | null;
  video_url: string | null;
  document_name: string | null;
  document_number: string | null;
  document_birth_date: string | null;
  document_expiry_date: string | null;
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
