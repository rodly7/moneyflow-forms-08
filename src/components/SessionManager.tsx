import { useState } from 'react';
import { useUserSession } from '@/hooks/useUserSession';
import { useAutoLock } from '@/hooks/useAutoLock';
import { useAuth } from '@/contexts/AuthContext';
import { AppLockModal } from '@/components/auth/AppLockModal';
import { authStorageService } from '@/services/authStorageService';

const SessionManager = () => {
  const { user } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  
  // Toujours appeler le hook, mais il gérera la logique interne
  useUserSession();
  
  // Hook d'auto-verrouillage - seulement si l'utilisateur a un numéro de téléphone stocké
  useAutoLock({
    onLockRequired: () => {
      const hasStoredPhone = authStorageService.hasStoredPhoneNumber();
      if (hasStoredPhone && user) {
        setIsLocked(true);
      }
    },
    lockDelay: 45000 // 45 secondes
  });
  
  const handleUnlock = () => {
    setIsLocked(false);
  };
  
  return (
    <>
      <AppLockModal 
        isOpen={isLocked}
        onUnlock={handleUnlock}
      />
    </>
  );
};

export default SessionManager;