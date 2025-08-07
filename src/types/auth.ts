
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
}
