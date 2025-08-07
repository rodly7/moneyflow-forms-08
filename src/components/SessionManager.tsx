import { useUserSession } from '@/hooks/useUserSession';
import { useAuth } from '@/contexts/AuthContext';

const SessionManager = () => {
  const { user } = useAuth();
  
  // Toujours appeler le hook, mais il gérera la logique interne
  useUserSession();
  
  return null;
};

export default SessionManager;