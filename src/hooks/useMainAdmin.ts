
import { useAuth } from "@/contexts/AuthContext";

export const useMainAdmin = () => {
  const { profile } = useAuth();
  
  const isMainAdmin = () => {
    return profile?.phone === '+221773637752';
  };

  const canPromoteToAdmin = () => {
    return isMainAdmin();
  };

  return {
    isMainAdmin: isMainAdmin(),
    canPromoteToAdmin: canPromoteToAdmin()
  };
};
