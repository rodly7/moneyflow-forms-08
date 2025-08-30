import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UseAutoLockProps {
  onLockRequired: () => void;
  lockDelay?: number; // en millisecondes
}

export const useAutoLock = ({ onLockRequired, lockDelay = 5000 }: UseAutoLockProps) => {
  const { user } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    lastActivityRef.current = Date.now();
    
    if (user) {
      timeoutRef.current = setTimeout(() => {
        onLockRequired();
      }, lockDelay);
    }
  }, [user, onLockRequired, lockDelay]);

  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // Quand l'app devient invisible, démarrer le timer d'auto-verrouillage
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        onLockRequired();
      }, lockDelay);
    } else {
      // Quand l'app redevient visible, vérifier si assez de temps s'est écoulé
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      if (timeSinceLastActivity >= lockDelay) {
        onLockRequired();
      } else {
        resetTimer();
      }
    }
  }, [onLockRequired, lockDelay, resetTimer]);

  const handlePageHide = useCallback(() => {
    // Déclencher immédiatement le verrouillage lors de la fermeture/changement d'onglet
    setTimeout(() => {
      onLockRequired();
    }, lockDelay);
  }, [onLockRequired, lockDelay]);

  useEffect(() => {
    if (!user) return;

    // Démarrer le timer initial
    resetTimer();

    // Écouter les événements d'activité
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Écouter les changements de visibilité
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('blur', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('blur', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [user, handleActivity, handleVisibilityChange, handlePageHide, resetTimer]);

  return {
    resetTimer
  };
};