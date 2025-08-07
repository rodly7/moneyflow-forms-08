export const pwaUpdateService = {
  // Vérifier les mises à jour de l'application
  checkForUpdates: async (): Promise<boolean> => {
    if ('serviceWorker' in navigator && 'serviceWorker' in window.navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          // Vérifier si une mise à jour est déjà en attente
          if (registration.waiting) {
            return true;
          }
          
          // Vérifier si une nouvelle version est en cours d'installation
          if (registration.installing) {
            return true;
          }
          
          // Forcer la vérification des mises à jour seulement si nécessaire
          try {
            await registration.update();
            return !!registration.waiting;
          } catch (updateError) {
            // Ignorer l'erreur si le service worker n'est pas prêt pour une mise à jour
            console.log('Service worker pas prêt pour mise à jour, vérification différée');
            return false;
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des mises à jour:', error);
      }
    }
    return false;
  },

  // Installer la mise à jour en attente
  installUpdate: async (): Promise<void> => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      } catch (error) {
        console.error('Erreur lors de l\'installation de la mise à jour:', error);
      }
    }
  },

  // Écouter les mises à jour du service worker
  onUpdateAvailable: (callback: () => void): (() => void) => {
    if ('serviceWorker' in navigator) {
      const handleUpdateFound = () => callback();
      
      navigator.serviceWorker.addEventListener('controllerchange', handleUpdateFound);
      
      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleUpdateFound);
      };
    }
    return () => {};
  }
};